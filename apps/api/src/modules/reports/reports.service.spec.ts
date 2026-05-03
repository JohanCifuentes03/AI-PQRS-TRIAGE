import { Canal, EstadoPqrs, TipoPqrs, Urgencia } from '@ai-pqrs-triage/shared';
import ExcelJS from 'exceljs';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const prismaMock = {
    pqrs: {
      findMany: jest.fn(),
    },
  };

  let service: ReportsService;

  beforeEach(() => {
    service = new ReportsService(prismaMock as never);
    jest.clearAllMocks();
  });

  it('exportCsv serializes filtered records with report columns', async () => {
    prismaMock.pqrs.findMany.mockResolvedValue([
      {
        id: 'pqrs-1',
        createdAt: new Date('2026-04-10T12:00:00.000Z'),
        canal: Canal.WEB,
        tipo: TipoPqrs.QUEJA,
        tema: 'Movilidad',
        subtema: 'Semaforos',
        urgencia: Urgencia.ALTA,
        entidad: 'IDU',
        riesgo: 'Alto',
        estado: EstadoPqrs.PENDIENTE,
        confianza: 0.97,
        resumen: 'Semaforo dañado frente al colegio',
      },
    ]);

    const result = await service.exportCsv({
      format: 'csv',
      from: new Date('2026-04-01T00:00:00.000Z'),
      to: new Date('2026-04-30T23:59:59.999Z'),
      canal: Canal.WEB,
      tipo: TipoPqrs.QUEJA,
      urgencia: Urgencia.ALTA,
      estado: EstadoPqrs.PENDIENTE,
      entidad: 'IDU',
    });

    expect(prismaMock.pqrs.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-04-01T00:00:00.000Z'),
          lte: new Date('2026-04-30T23:59:59.999Z'),
        },
        canal: Canal.WEB,
        tipo: TipoPqrs.QUEJA,
        urgencia: Urgencia.ALTA,
        estado: EstadoPqrs.PENDIENTE,
        entidad: 'IDU',
      },
      orderBy: { createdAt: 'desc' },
      select: expect.objectContaining({
        id: true,
        createdAt: true,
        canal: true,
        resumen: true,
      }),
    });
    expect(result).toContain(
      '"ID","Fecha","Canal","Tipo","Tema","Subtema","Urgencia","Entidad","Riesgo","Estado","Confianza","Resumen"',
    );
    expect(result).toContain('pqrs-1');
    expect(result).toContain('Semaforo dañado frente al colegio');
  });

  it('exportXlsx returns workbook buffer with PQRS sheet', async () => {
    prismaMock.pqrs.findMany.mockResolvedValue([
      {
        id: 'pqrs-2',
        createdAt: new Date('2026-04-11T09:30:00.000Z'),
        canal: Canal.EMAIL,
        tipo: TipoPqrs.PETICION,
        tema: 'Salud',
        subtema: 'Citas',
        urgencia: Urgencia.MEDIA,
        entidad: 'SDS',
        riesgo: 'Medio',
        estado: EstadoPqrs.APROBADO,
        confianza: 0.88,
        resumen: 'Solicitud de reasignación de cita médica',
      },
    ]);

    const buffer = await service.exportXlsx({ format: 'xlsx', entidad: 'SDS' });
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet('PQRS');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(worksheet).toBeDefined();
    expect(worksheet?.getRow(1).getCell(1).value).toBe('ID');
    expect(worksheet?.getRow(1).getCell(12).value).toBe('Resumen');
    expect(worksheet?.getRow(2).getCell(1).value).toBe('pqrs-2');
    expect(worksheet?.getRow(2).getCell(8).value).toBe('SDS');
  });

  it('exportPdf returns a non-empty buffer', async () => {
    prismaMock.pqrs.findMany.mockResolvedValue([
      {
        id: 'pqrs-3',
        createdAt: new Date('2026-04-12T14:15:00.000Z'),
        canal: Canal.PRESENCIAL,
        tipo: TipoPqrs.RECLAMO,
        tema: 'Espacio publico',
        subtema: 'Basuras',
        urgencia: Urgencia.BAJA,
        entidad: 'UAESP',
        riesgo: 'Bajo',
        estado: EstadoPqrs.ENRUTADO,
        confianza: 0.76,
        resumen:
          'Acumulación de residuos en el parque del barrio que requiere intervención de limpieza programada',
      },
    ]);

    const buffer = await service.exportPdf({
      format: 'pdf',
      from: new Date('2026-04-01T00:00:00.000Z'),
      to: new Date('2026-04-30T23:59:59.999Z'),
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(prismaMock.pqrs.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-04-01T00:00:00.000Z'),
            lte: new Date('2026-04-30T23:59:59.999Z'),
          },
        },
      }),
    );
  });
});
