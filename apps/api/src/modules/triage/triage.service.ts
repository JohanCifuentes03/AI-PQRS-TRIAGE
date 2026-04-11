import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { OrchestratorAgent } from '../../agents/orchestrator.agent';
import { LlmProvider } from '../../llm/llm.provider';

@Injectable()
export class TriageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: OrchestratorAgent,
    private readonly llm: LlmProvider,
  ) {}

  async runTriage(input: { texto: string; canal: string }): Promise<Record<string, unknown>> {
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
        tipo: result.tipo,
        tema: result.tema,
        subtema: result.subtema,
        urgencia: result.urgencia,
        entidad: result.entidad,
        riesgo: result.riesgo,
        resumen: result.resumen,
        confianza: result.confianza,
        estado: 'pendiente',
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
