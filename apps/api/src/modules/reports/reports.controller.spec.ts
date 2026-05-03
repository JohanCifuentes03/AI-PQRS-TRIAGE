import { Test, TestingModule } from '@nestjs/testing';
import { Canal, EstadoPqrs, TipoPqrs, Urgencia } from '@ai-pqrs-triage/shared';
import { Response } from 'express';
import { ZodError } from 'zod';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const reportsServiceMock = {
    exportCsv: jest.fn(),
    exportXlsx: jest.fn(),
    exportPdf: jest.fn(),
  };

  const responseMock: Partial<Response> = {
    setHeader: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: reportsServiceMock }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('exports CSV with headers and parsed filters', async () => {
    reportsServiceMock.exportCsv.mockResolvedValue('csv-content');

    const result = await controller.export(
      {
        format: 'csv',
        from: '2026-04-01T00:00:00.000Z',
        to: '2026-04-30T23:59:59.999Z',
        canal: Canal.WEB,
        tipo: TipoPqrs.QUEJA,
        urgencia: Urgencia.ALTA,
        estado: EstadoPqrs.PENDIENTE,
        entidad: 'IDU',
      },
      responseMock as Response,
    );

    expect(service.exportCsv).toHaveBeenCalledWith({
      format: 'csv',
      from: new Date('2026-04-01T00:00:00.000Z'),
      to: new Date('2026-04-30T23:59:59.999Z'),
      canal: Canal.WEB,
      tipo: TipoPqrs.QUEJA,
      urgencia: Urgencia.ALTA,
      estado: EstadoPqrs.PENDIENTE,
      entidad: 'IDU',
    });
    expect(responseMock.setHeader).toHaveBeenNthCalledWith(1, 'Content-Type', 'text/csv');
    expect(responseMock.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Disposition',
      'attachment; filename="pqrs-report.csv"',
    );
    expect(result).toBe('csv-content');
  });

  it('exports XLSX with binary headers', async () => {
    const buffer = Buffer.from('xlsx');
    reportsServiceMock.exportXlsx.mockResolvedValue(buffer);

    const result = await controller.export({ format: 'xlsx' }, responseMock as Response);

    expect(service.exportXlsx).toHaveBeenCalledWith({ format: 'xlsx' });
    expect(responseMock.setHeader).toHaveBeenNthCalledWith(
      1,
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(responseMock.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Disposition',
      'attachment; filename="pqrs-report.xlsx"',
    );
    expect(result).toBe(buffer);
  });

  it('exports PDF with attachment headers', async () => {
    const buffer = Buffer.from('pdf');
    reportsServiceMock.exportPdf.mockResolvedValue(buffer);

    const result = await controller.export({ format: 'pdf' }, responseMock as Response);

    expect(service.exportPdf).toHaveBeenCalledWith({ format: 'pdf' });
    expect(responseMock.setHeader).toHaveBeenNthCalledWith(1, 'Content-Type', 'application/pdf');
    expect(responseMock.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Disposition',
      'attachment; filename="pqrs-report.pdf"',
    );
    expect(result).toBe(buffer);
  });

  it('rejects invalid formats', async () => {
    await expect(
      controller.export({ format: 'docx' }, responseMock as Response),
    ).rejects.toBeInstanceOf(ZodError);
  });
});
