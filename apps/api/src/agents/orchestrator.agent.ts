import { Injectable } from '@nestjs/common';
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
    const [classification, risk, routing] = await Promise.all([
      this.classifier.classify(texto),
      this.riskDetector.detect(texto),
      this.router.route(texto),
    ]);

    const duplicados = await this.deduplicator.findDuplicates(texto);

    const resumen = await this.generateSummary(texto, classification, risk, routing);

    const confianza = this.calculateConfidence(classification, risk, routing, duplicados);

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
