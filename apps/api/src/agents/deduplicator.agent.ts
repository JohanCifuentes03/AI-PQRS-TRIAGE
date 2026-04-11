import { Injectable } from '@nestjs/common';
import { LlmProvider } from '../llm/llm.provider';
import { PrismaService } from '../common/prisma.service';

const SIMILARITY_THRESHOLD = 0.8;
const MAX_RESULTS = 5;

@Injectable()
export class DeduplicatorAgent {
  constructor(
    private readonly llm: LlmProvider,
    private readonly prisma: PrismaService,
  ) {}

  async findDuplicates(texto: string): Promise<string[]> {
    try {
      const embedding = await this.llm.generateEmbedding(texto);

      const results = await this.prisma.$queryRaw<
        Array<{ id: string; similarity: number }>
      >`
        SELECT id, 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
        FROM pqrs
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
        LIMIT ${MAX_RESULTS}
      `;

      return results
        .filter((r) => r.similarity >= SIMILARITY_THRESHOLD)
        .map((r) => r.id);
    } catch {
      return [];
    }
  }
}
