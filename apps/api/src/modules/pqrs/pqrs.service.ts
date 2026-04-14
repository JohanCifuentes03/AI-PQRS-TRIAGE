import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PqrsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    estado?: string;
    urgencia?: string;
    tipo?: string;
    page: number;
    limit: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.estado) where.estado = filters.estado;
    if (filters.urgencia) where.urgencia = filters.urgencia;
    if (filters.tipo) where.tipo = filters.tipo;

    const [data, total] = await Promise.all([
      this.prisma.pqrs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.pqrs.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.pqrs.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`PQRS ${id} not found`);
    return { data: record };
  }

  async findTrace(id: string) {
    const record = await this.prisma.pqrs.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`PQRS ${id} not found`);

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { pqrsId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      data: {
        pqrsId: id,
        estado: record.estado,
        sourceType: record.sourceType,
        pipelineTrace: record.pipelineTrace,
        auditLogs,
      },
    };
  }

  async approve(
    id: string,
    input: { usuario: string },
  ) {
    const record = await this.prisma.pqrs.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`PQRS ${id} not found`);

    const [updated] = await this.prisma.$transaction([
      this.prisma.pqrs.update({
        where: { id },
        data: { estado: 'aprobado' },
      }),
      this.prisma.auditLog.create({
        data: {
          pqrsId: id,
          accion: 'aprobar',
          usuario: input.usuario,
          detalles: { estadoAnterior: record.estado } as Prisma.InputJsonValue,
        },
      }),
    ]);

    return { success: true, data: updated };
  }

  async correct(
    id: string,
    input: {
      usuario: string;
      tipo?: string;
      tema?: string;
      subtema?: string;
      urgencia?: string;
      entidad?: string;
      riesgo?: string;
    },
  ) {
    const record = await this.prisma.pqrs.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`PQRS ${id} not found`);

    const updates: Record<string, unknown> = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    for (const [key, value] of Object.entries(input)) {
      if (key === 'usuario') continue;
      if (value !== undefined && value !== record[key as keyof typeof record]) {
        changes[key] = {
          before: record[key as keyof typeof record],
          after: value,
        };
        updates[key] = value;
      }
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.pqrs.update({
        where: { id },
        data: { ...updates, estado: 'corregido' },
      }),
      this.prisma.auditLog.create({
        data: {
          pqrsId: id,
          accion: 'corregir',
          usuario: input.usuario,
          detalles: { changes } as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    return { success: true, data: updated };
  }

  async route(
    id: string,
    input: { usuario: string },
  ) {
    const record = await this.prisma.pqrs.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`PQRS ${id} not found`);

    const [updated] = await this.prisma.$transaction([
      this.prisma.pqrs.update({
        where: { id },
        data: { estado: 'enrutado' },
      }),
      this.prisma.auditLog.create({
        data: {
          pqrsId: id,
          accion: 'enrutar',
          usuario: input.usuario,
          detalles: {
            estadoAnterior: record.estado,
            entidad: record.entidad,
          } as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    return { success: true, data: updated };
  }
}
