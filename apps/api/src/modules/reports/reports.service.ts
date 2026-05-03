import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { parse as parseSync } from 'json2csv';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../common/prisma.service';
import { ReportExportQueryDto } from './reports.controller';

type ReportRecord = {
  id: string;
  createdAt: Date;
  canal: string;
  tipo: string | null;
  tema: string | null;
  subtema: string | null;
  urgencia: string | null;
  entidad: string | null;
  riesgo: string | null;
  estado: string;
  confianza: number | null;
  resumen: string | null;
};

type ReportRow = {
  ID: string;
  Fecha: string;
  Canal: string;
  Tipo: string;
  Tema: string;
  Subtema: string;
  Urgencia: string;
  Entidad: string;
  Riesgo: string;
  Estado: string;
  Confianza: string;
  Resumen: string;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportCsv(filters: ReportExportQueryDto) {
    const rows = this.mapRows(await this.getRecords(filters));

    return parseSync(rows, {
      fields: [
        'ID',
        'Fecha',
        'Canal',
        'Tipo',
        'Tema',
        'Subtema',
        'Urgencia',
        'Entidad',
        'Riesgo',
        'Estado',
        'Confianza',
        'Resumen',
      ],
    });
  }

  async exportXlsx(filters: ReportExportQueryDto) {
    const rows = this.mapRows(await this.getRecords(filters));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PQRS');

    worksheet.columns = [
      { header: 'ID', key: 'ID' },
      { header: 'Fecha', key: 'Fecha' },
      { header: 'Canal', key: 'Canal' },
      { header: 'Tipo', key: 'Tipo' },
      { header: 'Tema', key: 'Tema' },
      { header: 'Subtema', key: 'Subtema' },
      { header: 'Urgencia', key: 'Urgencia' },
      { header: 'Entidad', key: 'Entidad' },
      { header: 'Riesgo', key: 'Riesgo' },
      { header: 'Estado', key: 'Estado' },
      { header: 'Confianza', key: 'Confianza' },
      { header: 'Resumen', key: 'Resumen' },
    ];

    worksheet.getRow(1).font = { bold: true };
    rows.forEach((row) => worksheet.addRow(row));

    worksheet.columns.forEach((column) => {
      let width = String(column.header ?? '').length;

      if (column.eachCell) {
        column.eachCell({ includeEmpty: true }, (cell) => {
          width = Math.max(width, String(cell.value ?? '').length);
        });
      }

      column.width = Math.min(width + 2, 50);
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportPdf(filters: ReportExportQueryDto) {
    const records = await this.getRecords(filters);
    const titleRange = this.buildDateRangeLabel(filters);
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text('Reporte PQRS', { align: 'left' });
      doc.moveDown(0.3);
      doc.fontSize(10).text(`Rango: ${titleRange}`);
      doc.moveDown(1);

      this.drawPdfTableHeader(doc);

      for (const record of records) {
        const rowHeight = this.measurePdfRowHeight(doc, record);
        if (doc.y + rowHeight > doc.page.height - 70) {
          doc.addPage();
          this.drawPdfTableHeader(doc);
        }

        this.drawPdfRow(doc, record, rowHeight);
      }

      const pageRange = doc.bufferedPageRange();
      for (let index = pageRange.start; index < pageRange.start + pageRange.count; index += 1) {
        doc.switchToPage(index);
        doc.fontSize(9).text(`Página ${index + 1}`, 40, doc.page.height - 30, {
          align: 'center',
          width: doc.page.width - 80,
        });
      }

      doc.end();
    });
  }

  private async getRecords(filters: ReportExportQueryDto) {
    return this.prisma.pqrs.findMany({
      where: this.buildWhere(filters),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        canal: true,
        tipo: true,
        tema: true,
        subtema: true,
        urgencia: true,
        entidad: true,
        riesgo: true,
        estado: true,
        confianza: true,
        resumen: true,
      },
    });
  }

  private buildWhere(filters: ReportExportQueryDto): Prisma.PqrsWhereInput {
    const where: Prisma.PqrsWhereInput = {};

    if (filters.canal) where.canal = filters.canal;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.urgencia) where.urgencia = filters.urgencia;
    if (filters.estado) where.estado = filters.estado;
    if (filters.entidad) where.entidad = filters.entidad;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    return where;
  }

  private mapRows(records: ReportRecord[]): ReportRow[] {
    return records.map((record) => ({
      ID: record.id,
      Fecha: this.formatDate(record.createdAt),
      Canal: record.canal,
      Tipo: record.tipo ?? '',
      Tema: record.tema ?? '',
      Subtema: record.subtema ?? '',
      Urgencia: record.urgencia ?? '',
      Entidad: record.entidad ?? '',
      Riesgo: record.riesgo ?? '',
      Estado: record.estado,
      Confianza:
        record.confianza === null || record.confianza === undefined
          ? ''
          : record.confianza.toFixed(2),
      Resumen: record.resumen ?? '',
    }));
  }

  private formatDate(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private buildDateRangeLabel(filters: ReportExportQueryDto) {
    const from = filters.from ? this.formatDate(filters.from) : 'inicio';
    const to = filters.to ? this.formatDate(filters.to) : 'hoy';
    return `${from} a ${to}`;
  }

  private truncateSummary(summary: string | null) {
    if (!summary) return '';
    return summary.length > 50 ? `${summary.slice(0, 47)}...` : summary;
  }

  private drawPdfTableHeader(doc: PDFDocument) {
    const top = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Fecha', 40, top, { width: 65 });
    doc.text('Tipo', 105, top, { width: 70 });
    doc.text('Urgencia', 175, top, { width: 60 });
    doc.text('Canal', 235, top, { width: 60 });
    doc.text('Estado', 295, top, { width: 70 });
    doc.text('Resumen', 365, top, { width: 190 });

    doc.moveTo(40, top + 15).lineTo(555, top + 15).stroke();
    doc.font('Helvetica').moveDown(1);
    doc.y = top + 22;
  }

  private measurePdfRowHeight(doc: PDFDocument, record: ReportRecord) {
    const summary = this.truncateSummary(record.resumen);
    const summaryHeight = doc.heightOfString(summary, { width: 190, align: 'left' });
    return Math.max(summaryHeight, 16) + 8;
  }

  private drawPdfRow(doc: PDFDocument, record: ReportRecord, rowHeight: number) {
    const top = doc.y;

    doc.fontSize(9).font('Helvetica');
    doc.text(this.formatDate(record.createdAt), 40, top, { width: 65 });
    doc.text(record.tipo ?? '', 105, top, { width: 70 });
    doc.text(record.urgencia ?? '', 175, top, { width: 60 });
    doc.text(record.canal, 235, top, { width: 60 });
    doc.text(record.estado, 295, top, { width: 70 });
    doc.text(this.truncateSummary(record.resumen), 365, top, { width: 190 });

    doc.moveTo(40, top + rowHeight - 4).lineTo(555, top + rowHeight - 4).strokeColor('#cccccc').stroke();
    doc.fillColor('black');
    doc.y = top + rowHeight;
  }
}
