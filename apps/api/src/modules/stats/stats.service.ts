import { Injectable } from '@nestjs/common';
import { EstadoPqrs } from '@ai-pqrs-triage/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { StatsQueryDto } from './dto/stats-query.dto';

type TrendRow = {
  date: Date;
  count: bigint | number;
};

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(filters: StatsQueryDto) {
    const where = this.buildWhere(filters);
    const [total, confidenceAggregate, statusGroups] = await Promise.all([
      this.prisma.pqrs.count({ where }),
      this.prisma.pqrs.aggregate({
        where,
        _avg: { confianza: true },
      }),
      this.prisma.pqrs.groupBy({
        by: ['estado'],
        where,
        _count: { estado: true },
      }),
    ]);

    const counts = {
      pending: 0,
      approved: 0,
      corrected: 0,
      routed: 0,
    };

    for (const group of statusGroups) {
      if (group.estado === EstadoPqrs.PENDIENTE) counts.pending = group._count.estado;
      if (group.estado === EstadoPqrs.APROBADO) counts.approved = group._count.estado;
      if (group.estado === EstadoPqrs.CORREGIDO) counts.corrected = group._count.estado;
      if (group.estado === EstadoPqrs.ENRUTADO) counts.routed = group._count.estado;
    }

    return {
      success: true,
      data: {
        total,
        pending: counts.pending,
        approved: counts.approved,
        corrected: counts.corrected,
        routed: counts.routed,
        avgConfidence: confidenceAggregate._avg.confianza ?? 0,
        resolutionRate:
          total === 0 ? 0 : Number(((counts.approved / total) * 100).toFixed(2)),
      },
    };
  }

  async getByChannel(filters: StatsQueryDto) {
    const data = await this.prisma.pqrs.groupBy({
      by: ['canal'],
      where: this.buildWhere(filters),
      _count: { canal: true },
      orderBy: { canal: 'asc' },
    });

    return {
      success: true,
      data: data.map((item) => ({ canal: item.canal, count: item._count.canal })),
    };
  }

  async getByType(filters: StatsQueryDto) {
    const data = await this.prisma.pqrs.groupBy({
      by: ['tipo'],
      where: this.buildWhere(filters),
      _count: { tipo: true },
      orderBy: { tipo: 'asc' },
    });

    return {
      success: true,
      data: data
        .filter((item) => item.tipo !== null)
        .map((item) => ({ tipo: item.tipo, count: item._count.tipo })),
    };
  }

  async getByUrgency(filters: StatsQueryDto) {
    const data = await this.prisma.pqrs.groupBy({
      by: ['urgencia'],
      where: this.buildWhere(filters),
      _count: { urgencia: true },
      orderBy: { urgencia: 'asc' },
    });

    return {
      success: true,
      data: data
        .filter((item) => item.urgencia !== null)
        .map((item) => ({ urgencia: item.urgencia, count: item._count.urgencia })),
    };
  }

  async getByEntity(filters: StatsQueryDto) {
    const data = await this.prisma.pqrs.groupBy({
      by: ['entidad'],
      where: this.buildWhere(filters),
      _count: { entidad: true },
      orderBy: { entidad: 'asc' },
    });

    return {
      success: true,
      data: data
        .filter((item) => item.entidad !== null)
        .map((item) => ({ entidad: item.entidad, count: item._count.entidad })),
    };
  }

  async getByTopic(filters: StatsQueryDto) {
    const data = await this.prisma.pqrs.groupBy({
      by: ['tema'],
      where: this.buildWhere(filters),
      _count: { tema: true },
      orderBy: { tema: 'asc' },
    });

    return {
      success: true,
      data: data
        .filter((item) => item.tema !== null)
        .map((item) => ({ tema: item.tema, count: item._count.tema })),
    };
  }

  async getTrends(filters: StatsQueryDto) {
    const range = this.buildTrendRange(filters);
    const conditions = this.buildRawConditions({ ...filters, ...range });
    const whereClause =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const data = await this.prisma.$queryRaw<TrendRow[]>(Prisma.sql`
      SELECT DATE("createdAt") AS date, COUNT(*)::int AS count
      FROM "pqrs"
      ${whereClause}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `);

    return {
      success: true,
      data: data.map((item) => ({
        date: item.date.toISOString().slice(0, 10),
        count: Number(item.count),
      })),
    };
  }

  private buildWhere(filters: StatsQueryDto): Prisma.PqrsWhereInput {
    const where: Prisma.PqrsWhereInput = {};

    if (filters.canal) where.canal = filters.canal;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.entidad) where.entidad = filters.entidad;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    return where;
  }

  private buildTrendRange(filters: StatsQueryDto) {
    if (filters.from || filters.to) {
      return {
        from: filters.from,
        to: filters.to,
      };
    }

    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);

    return { from, to };
  }

  private buildRawConditions(filters: StatsQueryDto): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [];

    if (filters.from) conditions.push(Prisma.sql`"createdAt" >= ${filters.from}`);
    if (filters.to) conditions.push(Prisma.sql`"createdAt" <= ${filters.to}`);
    if (filters.canal) conditions.push(Prisma.sql`"canal" = ${filters.canal}`);
    if (filters.tipo) conditions.push(Prisma.sql`"tipo" = ${filters.tipo}`);
    if (filters.entidad) conditions.push(Prisma.sql`"entidad" = ${filters.entidad}`);

    return conditions;
  }
}
