import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ClassifierAgent } from './classifier.agent';
import { RiskDetectorAgent } from './risk-detector.agent';
import { RouterAgent } from './router.agent';
import { DeduplicatorAgent } from './deduplicator.agent';
import { LlmProvider } from '../llm/llm.provider';

export interface TriageResult {
  tipo: string;
  tema: string;
  subtema: string;
  urgencia: string;
  entidad: string;
  riesgo: string;
  duplicados: string[];
  confianza: number;
  resumen: string;
  trace: {
    runId: string;
    startedAt: string;
    finishedAt: string;
    totalMs: number;
    steps: Array<{
      agent: string;
      status: 'ok' | 'fallback' | 'error';
      durationMs: number;
      output: Record<string, unknown>;
    }>;
  };
}

@Injectable()
export class OrchestratorAgent {
  constructor(
    private readonly classifier: ClassifierAgent,
    private readonly riskDetector: RiskDetectorAgent,
    private readonly router: RouterAgent,
    private readonly deduplicator: DeduplicatorAgent,
    private readonly llm: LlmProvider,
  ) {}

  async run(texto: string): Promise<TriageResult> {
    const runId = randomUUID();
    const startedAt = new Date();

    const stepStartClassifier = Date.now();
    const classifierPromise = this.classifier.classify(texto).then((value) => ({
      value,
      durationMs: Date.now() - stepStartClassifier,
    }));

    const stepStartRisk = Date.now();
    const riskPromise = this.riskDetector.detect(texto).then((value) => ({
      value,
      durationMs: Date.now() - stepStartRisk,
    }));

    const stepStartRouter = Date.now();
    const routerPromise = this.router.route(texto).then((value) => ({
      value,
      durationMs: Date.now() - stepStartRouter,
    }));

    const [classifierResult, riskResult, routerResult] = await Promise.all([
      classifierPromise,
      riskPromise,
      routerPromise,
    ]);

    const classification = classifierResult.value;
    const risk = riskResult.value;
    const routing = routerResult.value;

    const dedupStart = Date.now();
    const duplicados = await this.deduplicator.findDuplicates(texto);
    const dedupDuration = Date.now() - dedupStart;

    const summaryStart = Date.now();
    const resumen = await this.generateSummary(texto, classification, risk, routing);
    const summaryDuration = Date.now() - summaryStart;

    const confianza = this.calculateConfidence(classification, risk, routing, duplicados);

    const finishedAt = new Date();
    const trace = {
      runId,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      totalMs: finishedAt.getTime() - startedAt.getTime(),
      steps: [
        {
          agent: 'classifier',
          status: 'ok' as const,
          durationMs: classifierResult.durationMs,
          output: classification,
        },
        {
          agent: 'risk_detector',
          status: risk.riesgo.includes('No se pudo determinar') ? ('fallback' as const) : ('ok' as const),
          durationMs: riskResult.durationMs,
          output: risk,
        },
        {
          agent: 'router',
          status: routing.entidad === 'Alcaldía Local' ? ('fallback' as const) : ('ok' as const),
          durationMs: routerResult.durationMs,
          output: routing,
        },
        {
          agent: 'deduplicator',
          status: 'ok' as const,
          durationMs: dedupDuration,
          output: { duplicados },
        },
        {
          agent: 'summary',
          status: 'ok' as const,
          durationMs: summaryDuration,
          output: { resumen },
        },
      ],
    };

    return {
      tipo: classification.tipo,
      tema: classification.tema,
      subtema: classification.subtema,
      urgencia: risk.urgencia,
      entidad: routing.entidad,
      riesgo: risk.riesgo,
      duplicados,
      confianza,
      resumen,
      trace,
    };
  }

  private async generateSummary(
    texto: string,
    classification: { tipo: string; tema: string; subtema: string },
    _risk: { urgencia: string; riesgo: string },
    routing: { entidad: string },
  ): Promise<string> {
    try {
      const raw = await this.llm.chat([
        {
          role: 'system',
          content:
            'Genera un resumen de una línea en español para esta PQRS. Máximo 120 caracteres. Responde en JSON con clave "resumen".',
        },
        {
          role: 'user',
          content: `Tipo: ${classification.tipo}, Tema: ${classification.tema}, Entidad: ${routing.entidad}. Texto: ${texto}`,
        },
      ]);
      const parsed = JSON.parse(raw);
      return parsed.resumen || texto.substring(0, 120);
    } catch {
      return texto.substring(0, 120);
    }
  }

  private calculateConfidence(
    classification: { tipo: string; tema: string; subtema: string },
    risk: { urgencia: string; riesgo: string },
    routing: { entidad: string },
    duplicados: string[],
  ): number {
    let score = 0.7;
    if (classification.tipo && classification.tema && classification.subtema) score += 0.1;
    if (risk.urgencia) score += 0.05;
    if (routing.entidad) score += 0.05;
    if (duplicados.length === 0) score += 0.1;
    if (duplicados.length > 0) score -= 0.05;
    return Math.min(Math.max(score, 0), 1);
  }
}
