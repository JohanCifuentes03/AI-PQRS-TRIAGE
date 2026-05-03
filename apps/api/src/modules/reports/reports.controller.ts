import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Canal, EstadoPqrs, TipoPqrs, Urgencia } from '@ai-pqrs-triage/shared';
import { Response } from 'express';
import { z } from 'zod';
import { SimpleRateLimitGuard } from '../../common/simple-rate-limit.guard';
import { ReportsService } from './reports.service';

const optionalDate = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z.coerce.date().optional(),
);

export const reportExportQuerySchema = z
  .object({
    format: z.enum(['csv', 'xlsx', 'pdf']),
    from: optionalDate,
    to: optionalDate,
    canal: z.nativeEnum(Canal).optional(),
    tipo: z.nativeEnum(TipoPqrs).optional(),
    urgencia: z.nativeEnum(Urgencia).optional(),
    estado: z.nativeEnum(EstadoPqrs).optional(),
    entidad: z.string().min(1).optional(),
  })
  .refine(({ from, to }) => !(from && to) || from <= to, {
    message: 'from must be before or equal to to',
    path: ['from'],
  });

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export')
  @UseGuards(SimpleRateLimitGuard)
  @ApiOperation({ summary: 'Export PQRS report in CSV, XLSX, or PDF format' })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'xlsx', 'pdf'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'canal', required: false, enum: Canal })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoPqrs })
  @ApiQuery({ name: 'urgencia', required: false, enum: Urgencia })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoPqrs })
  @ApiQuery({ name: 'entidad', required: false, type: String })
  async export(@Query() query: unknown, @Res({ passthrough: true }) res: Response) {
    const filters = reportExportQuerySchema.parse(query);

    if (filters.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="pqrs-report.csv"');
      return this.reportsService.exportCsv(filters);
    }

    if (filters.format === 'xlsx') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="pqrs-report.xlsx"');
      return this.reportsService.exportXlsx(filters);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pqrs-report.pdf"');
    return this.reportsService.exportPdf(filters);
  }
}

export type ReportExportQueryDto = z.infer<typeof reportExportQuerySchema>;
