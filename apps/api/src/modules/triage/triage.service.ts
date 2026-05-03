import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { OrchestratorAgent } from '../../agents/orchestrator.agent';
import { LlmProvider } from '../../llm/llm.provider';

interface TriageInput {
  texto: string;
  canal: string;
  sourceType?: string;
  remitente?: string;
  asunto?: string;
  adjuntos?: Array<{ nombre: string; tipo: string }>;
  ocrUsado?: boolean;
  advertenciaOcr?: boolean;
}

@Injectable()
export class TriageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: OrchestratorAgent,
    private readonly llm: LlmProvider,
  ) {}

  async runTriage(input: TriageInput): Promise<Record<string, unknown>> {
    const result = await this.orchestrator.run(input.texto);

    let embedding: number[] | null = null;
    try {
      embedding = await this.llm.generateEmbedding(input.texto);
    } catch {
      // Continue without embedding
    }

    const record = await this.prisma.pqrs.create({
      data: {
        texto: input.texto,
        canal: input.canal,
        sourceType: input.sourceType || 'manual_text',
        remitente: input.remitente ?? null,
        asunto: input.asunto ?? null,
        adjuntos: input.adjuntos
          ? (input.adjuntos as unknown as Prisma.InputJsonValue)
          : undefined,
        tipo: result.tipo,
        tema: result.tema,
        subtema: result.subtema,
        urgencia: result.urgencia,
        entidad: result.entidad,
        riesgo: result.riesgo,
        resumen: result.resumen,
        confianza: result.confianza,
        pipelineTrace: result.trace as Prisma.InputJsonValue,
        estado: 'pendiente',
        ocrUsado: input.ocrUsado ?? false,
        advertenciaOcr: input.advertenciaOcr ?? false,
      },
    });

    if (embedding) {
      await this.prisma.$executeRaw`
        UPDATE pqrs SET embedding = ${JSON.stringify(embedding)}::vector WHERE id = ${record.id}
      `;
    }

    return { ...result, id: record.id };
  }
}
