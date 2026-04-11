import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import type { TriageInput, TriageOutput } from '@ai-pqrs-triage/shared';
import { Urgencia } from '@ai-pqrs-triage/shared';

@Injectable()
export class TriageService {
  constructor(private readonly prisma: PrismaService) {}

  async runTriage(input: TriageInput): Promise<TriageOutput & { id: string }> {
    const stubResult: TriageOutput = {
      tipo: 'Peticion',
      tema: 'Infraestructura',
      subtema: 'Alumbrado publico',
      urgencia: Urgencia.MEDIA,
      entidad: 'CODENSA S.A.',
      riesgo: 'Ninguno',
      duplicados: [],
      confianza: 0.75,
      resumen: 'Solicitud de reparacion de alumbrado publico (stub)',
    };

    const record = await this.prisma.pqrs.create({
      data: {
        texto: input.texto,
        canal: input.canal,
        tipo: stubResult.tipo,
        tema: stubResult.tema,
        subtema: stubResult.subtema,
        urgencia: stubResult.urgencia,
        entidad: stubResult.entidad,
        riesgo: stubResult.riesgo,
        resumen: stubResult.resumen,
        confianza: stubResult.confianza,
        estado: 'pendiente',
      },
    });

    return { ...stubResult, id: record.id };
  }
}
