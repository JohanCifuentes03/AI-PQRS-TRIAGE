import { Canal, EstadoPqrs, TipoPqrs } from '@ai-pqrs-triage/shared';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  const prismaMock = {
    pqrs: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  let service: StatsService;

  beforeEach(() => {
    service = new StatsService(prismaMock as never);
    jest.clearAllMocks();
  });

  it('getOverview returns KPI summary with filtered counts', async () => {
    prismaMock.pqrs.count.mockResolvedValue(20);
    prismaMock.pqrs.aggregate.mockResolvedValue({ _avg: { confianza: 0.875 } });
    prismaMock.pqrs.groupBy.mockResolvedValue([
      { estado: EstadoPqrs.PENDIENTE, _count: { estado: 8 } },
      { estado: EstadoPqrs.APROBADO, _count: { estado: 6 } },
      { estado: EstadoPqrs.CORREGIDO, _count: { estado: 4 } },
      { estado: EstadoPqrs.ENRUTADO, _count: { estado: 2 } },
    ]);

    const result = await service.getOverview({
      canal: Canal.WEB,
      tipo: TipoPqrs.QUEJA,
      entidad: 'SDS',
      from: new Date('2026-04-01T00:00:00.000Z'),
      to: new Date('2026-04-30T23:59:59.999Z'),
    });

    expect(prismaMock.pqrs.count).toHaveBeenCalledWith({
      where: {
        canal: Canal.WEB,
        tipo: TipoPqrs.QUEJA,
        entidad: 'SDS',
        createdAt: {
          gte: new Date('2026-04-01T00:00:00.000Z'),
          lte: new Date('2026-04-30T23:59:59.999Z'),
        },
      },
    });
    expect(result).toEqual({
      success: true,
      data: {
        total: 20,
        pending: 8,
        approved: 6,
        corrected: 4,
        routed: 2,
        avgConfidence: 0.875,
        resolutionRate: 30,
      },
    });
  });

  it('getOverview handles empty aggregates', async () => {
    prismaMock.pqrs.count.mockResolvedValue(0);
    prismaMock.pqrs.aggregate.mockResolvedValue({ _avg: { confianza: null } });
    prismaMock.pqrs.groupBy.mockResolvedValue([]);

    const result = await service.getOverview({});

    expect(result).toEqual({
      success: true,
      data: {
        total: 0,
        pending: 0,
        approved: 0,
        corrected: 0,
        routed: 0,
        avgConfidence: 0,
        resolutionRate: 0,
      },
    });
  });

  it('getByChannel groups by canal', async () => {
    prismaMock.pqrs.groupBy.mockResolvedValue([
      { canal: 'web', _count: { canal: 3 } },
      { canal: 'email', _count: { canal: 2 } },
    ]);

    const result = await service.getByChannel({ tipo: TipoPqrs.PETICION });

    expect(prismaMock.pqrs.groupBy).toHaveBeenCalledWith({
      by: ['canal'],
      where: { tipo: TipoPqrs.PETICION },
      _count: { canal: true },
      orderBy: { canal: 'asc' },
    });
    expect(result).toEqual({
      success: true,
      data: [
        { canal: 'web', count: 3 },
        { canal: 'email', count: 2 },
      ],
    });
  });

  it('getByType groups by tipo', async () => {
    prismaMock.pqrs.groupBy.mockResolvedValue([{ tipo: 'Queja', _count: { tipo: 5 } }]);

    const result = await service.getByType({ canal: Canal.EMAIL });

    expect(result).toEqual({ success: true, data: [{ tipo: 'Queja', count: 5 }] });
  });

  it('getByUrgency groups by urgencia', async () => {
    prismaMock.pqrs.groupBy.mockResolvedValue([
      { urgencia: 'Alta', _count: { urgencia: 4 } },
      { urgencia: 'Media', _count: { urgencia: 1 } },
    ]);

    const result = await service.getByUrgency({ entidad: 'IDU' });

    expect(result).toEqual({
      success: true,
      data: [
        { urgencia: 'Alta', count: 4 },
        { urgencia: 'Media', count: 1 },
      ],
    });
  });

  it('getByEntity groups by entidad', async () => {
    prismaMock.pqrs.groupBy.mockResolvedValue([
      { entidad: 'IDU', _count: { entidad: 7 } },
      { entidad: 'SDS', _count: { entidad: 2 } },
    ]);

    const result = await service.getByEntity({ canal: Canal.PRESENCIAL });

    expect(result).toEqual({
      success: true,
      data: [
        { entidad: 'IDU', count: 7 },
        { entidad: 'SDS', count: 2 },
      ],
    });
  });

  it('getTrends returns daily counts for the last 30 days query', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      { date: new Date('2026-04-10T00:00:00.000Z'), count: BigInt(4) },
      { date: new Date('2026-04-11T00:00:00.000Z'), count: BigInt(2) },
    ]);

    const result = await service.getTrends({ canal: Canal.WEB });

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      data: [
        { date: '2026-04-10', count: 4 },
        { date: '2026-04-11', count: 2 },
      ],
    });
  });
});
