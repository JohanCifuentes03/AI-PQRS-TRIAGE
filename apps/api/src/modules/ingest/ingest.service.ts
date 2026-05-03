import { BadGatewayException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { z } from 'zod';
import { TriageService } from '../triage/triage.service';
import { EmailIngestDto, getEmailBodyText } from './dto/email-ingest.dto';
import { WebhookIngestDto } from './dto/webhook-ingest.dto';

const INGEST_API_KEY_SETTING = 'ingest_api_key';

const pdfExtractorResponseSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(),
  ocrUsado: z.boolean().optional(),
  advertenciaOcr: z.boolean().optional(),
});

interface ExtractedPdfText {
  text: string;
  ocrUsado: boolean;
  advertenciaOcr: boolean;
}

@Injectable()
export class IngestService {
  constructor(
    private readonly triageService: TriageService,
    private readonly prisma: PrismaService,
  ) {}

  async processEmail(payload: EmailIngestDto): Promise<Record<string, unknown>> {
    const bodyText = getEmailBodyText(payload);
    const attachments = payload.attachments ?? [];
    const extractedTexts: string[] = [];
    let ocrUsado = false;
    let advertenciaOcr = false;

    for (const attachment of attachments) {
      if (!this.isPdfAttachment(attachment.filename, attachment.contentType)) {
        continue;
      }

      const extracted = await this.extractPdfText(Buffer.from(attachment.content, 'base64'));

      if (extracted.text.trim().length > 0) {
        extractedTexts.push(extracted.text.trim());
      }

      ocrUsado = ocrUsado || extracted.ocrUsado;
      advertenciaOcr = advertenciaOcr || extracted.advertenciaOcr;
    }

    const texto = [bodyText, ...extractedTexts].filter((value) => value.length > 0).join('\n\n');

    return this.triageService.runTriage({
      texto,
      canal: 'email',
      sourceType: 'email_webhook',
      remitente: payload.from,
      asunto: payload.subject,
      adjuntos: attachments.map((attachment) => ({
        nombre: attachment.filename,
        tipo: attachment.contentType,
      })),
      ocrUsado,
      advertenciaOcr,
    });
  }

  async processWebhook(payload: WebhookIngestDto): Promise<Record<string, unknown>> {
    return this.triageService.runTriage({
      texto: payload.texto,
      canal: 'api_externa',
      sourceType: payload.canalOrigen || 'api_webhook',
      remitente: payload.remitente,
      asunto: payload.asunto,
      adjuntos: payload.adjuntos,
    });
  }

  async validateApiKey(headerValue: string | undefined) {
    const configuredKey = await this.getConfiguredApiKey();

    if (!configuredKey) {
      return;
    }

    if (headerValue !== configuredKey) {
      throw new Error('INVALID_API_KEY');
    }
  }

  async getApiInfo(baseUrl: string) {
    const apiKey = await this.getConfiguredApiKey();
    return this.buildApiInfo(baseUrl, apiKey);
  }

  async regenerateApiKey(baseUrl: string) {
    const apiKey = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');

    await this.prisma.setting.upsert({
      where: { key: INGEST_API_KEY_SETTING },
      update: { value: { apiKey } },
      create: { key: INGEST_API_KEY_SETTING, value: { apiKey } },
    });

    return this.buildApiInfo(baseUrl, apiKey, true);
  }

  private async getConfiguredApiKey() {
    if (process.env.INGEST_API_KEY) {
      return process.env.INGEST_API_KEY;
    }

    const setting = await this.prisma.setting.findUnique({
      where: { key: INGEST_API_KEY_SETTING },
    });
    const value = z.object({ apiKey: z.string().min(1) }).safeParse(setting?.value);
    return value.success ? value.data.apiKey : null;
  }

  private buildApiInfo(baseUrl: string, apiKey: string | null, includeSecret = false) {
    return {
      webhookUrl: `${baseUrl}/ingest/webhook`,
      apiKeyRequired: Boolean(apiKey),
      apiKey: apiKey ? `${apiKey.slice(0, 8)}***` : null,
      ...(includeSecret && apiKey ? { apiKeyValue: apiKey } : {}),
    };
  }

  private isPdfAttachment(filename: string, contentType: string): boolean {
    return contentType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
  }

  private async extractPdfText(buffer: Buffer): Promise<ExtractedPdfText> {
    const baseUrl = process.env.PDF_EXTRACTOR_URL || 'http://localhost:4100';

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown PDF extractor error';
      throw new BadGatewayException(`PDF extraction failed: ${message}`);
    }

    const payload = pdfExtractorResponseSchema.safeParse(await response.json());

    if (!payload.success || !response.ok || !payload.data.success) {
      const message = payload.success ? payload.data.error : 'Invalid PDF extractor response';
      throw new BadGatewayException(
        message || `PDF extraction failed (status ${response.status})`,
      );
    }

    return {
      text: payload.data.text?.trim() ?? '',
      ocrUsado: payload.data.ocrUsado ?? true,
      advertenciaOcr: payload.data.advertenciaOcr ?? false,
    };
  }
}
