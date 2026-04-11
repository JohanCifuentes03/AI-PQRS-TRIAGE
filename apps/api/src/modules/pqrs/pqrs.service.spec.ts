import { NotFoundException } from '@nestjs/common';
import { PqrsService } from './pqrs.service';

describe('PqrsService', () => {
  const prismaMock = {
    pqrs: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: PqrsService;

  beforeEach(() => {
    service = new PqrsService(prismaMock as never);
    jest.clearAllMocks();
  });

  it('findAll returns paginated result', async () => {
    prismaMock.pqrs.findMany.mockResolvedValue([{ id: '1' }]);
    prismaMock.pqrs.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20, estado: 'pendiente' });

    expect(result.meta.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('findAll applies no filters when empty', async () => {
    prismaMock.pqrs.findMany.mockResolvedValue([]);
    prismaMock.pqrs.count.mockResolvedValue(0);

    await service.findAll({ page: 2, limit: 10 });

    expect(prismaMock.pqrs.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('findOne throws not found', async () => {
    prismaMock.pqrs.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('findOne returns record when found', async () => {
    prismaMock.pqrs.findUnique.mockResolvedValue({ id: '1' });
    const result = await service.findOne('1');
    expect(result).toEqual({ data: { id: '1' } });
  });

  it('approve updates status and writes audit log', async () => {
    prismaMock.pqrs.findUnique.mockResolvedValue({ id: '1', estado: 'pendiente' });
    prismaMock.pqrs.update.mockResolvedValue({ id: '1', estado: 'aprobado' });
    prismaMock.auditLog.create.mockResolvedValue({ id: 'log-1' });
    prismaMock.$transaction.mockResolvedValue([{ id: '1', estado: 'aprobado' }]);

    const result = await service.approve('1', { usuario: 'admin' });
    expect(result.success).toBe(true);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('correct updates fields and state', async () => {
    prismaMock.pqrs.findUnique.mockResolvedValue({
      id: '1',
      estado: 'pendiente',
      tipo: 'Queja',
      tema: 'Infraestructura',
      subtema: 'Alumbrado',
      urgencia: 'Media',
      entidad: 'IDU',
      riesgo: 'Ninguno',
    });
    prismaMock.pqrs.update.mockResolvedValue({ id: '1', estado: 'corregido' });
    prismaMock.auditLog.create.mockResolvedValue({ id: 'log-1' });
    prismaMock.$transaction.mockResolvedValue([{ id: '1', estado: 'corregido' }]);

    const result = await service.correct('1', {
      usuario: 'admin',
      urgencia: 'Alta',
      entidad: 'SDS',
    });

    expect(result.success).toBe(true);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('route updates state to enrutado', async () => {
    prismaMock.pqrs.findUnique.mockResolvedValue({ id: '1', estado: 'aprobado', entidad: 'IDU' });
    prismaMock.pqrs.update.mockResolvedValue({ id: '1', estado: 'enrutado' });
    prismaMock.auditLog.create.mockResolvedValue({ id: 'log-1' });
    prismaMock.$transaction.mockResolvedValue([{ id: '1', estado: 'enrutado' }]);

    const result = await service.route('1', { usuario: 'admin' });
    expect(result.success).toBe(true);
  });
});
