import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, Setting } from '@prisma/client';
import { ImapFlow } from 'imapflow';
import { Attachment, simpleParser } from 'mailparser';
import { z } from 'zod';
import { PrismaService } from '../../common/prisma.service';
import { TriageService } from '../triage/triage.service';
import { stripHtml } from '../ingest/dto/email-ingest.dto';

const EMAIL_READER_SETTING_KEY = 'email_reader';
const CONNECTION_STATES = ['Conectado', 'No configurado', 'Error de conexion'] as const;

const emailReaderConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive().default(993),
  user: z.string().email(),
  password: z.string().min(1),
  folder: z.string().min(1).default('INBOX'),
  frequencyMinutes: z.coerce.number().int().min(1).max(10).default(5),
  processedMessageIds: z.array(z.string()).default([]),
  lastSyncAt: z.string().datetime().optional(),
  lastSyncError: z.string().optional(),
  lastProcessedCount: z.number().int().nonnegative().optional(),
  state: z.enum(CONNECTION_STATES).optional(),
});

export const emailReaderConfigInputSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive().default(993),
  user: z.string().email(),
  password: z.string().optional(),
  folder: z.string().min(1).default('INBOX'),
  frequencyMinutes: z.coerce.number().int().min(1).max(10).default(5),
});

export type EmailReaderConfig = z.infer<typeof emailReaderConfigSchema>;
export type EmailReaderConfigInput = z.infer<typeof emailReaderConfigInputSchema>;

type ConnectionState = (typeof CONNECTION_STATES)[number];

type ImapAdapter = {
  connect: () => Promise<void>;
  openMailbox: (folder: string) => Promise<void>;
  searchUnseen: () => Promise<number[]>;
  fetchSource: (uid: number) => Promise<Buffer>;
  markSeen: (uid: number) => Promise<void>;
  close: () => Promise<void>;
};

type EmailReaderStatus = {
  configured: boolean;
  polling: boolean;
  state: ConnectionState;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  frequencyMinutes: number | null;
};

@Injectable()
export class EmailReaderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailReaderService.name);
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly triageService: TriageService,
  ) {}

  async onModuleInit() {
    try {
      await this.startPolling();
    } catch {
      this.logger.warn('EmailReader initialization skipped — database not ready or not configured');
    }
  }

  async onModuleDestroy() {
    await this.stopPolling();
  }

  async saveConfig(input: EmailReaderConfigInput) {
    const config = await this.resolveConfig(input);
    await this.persistConfig(config);
    await this.startPolling();
    return this.maskConfig(config);
  }

  async getConfig() {
    const config = await this.loadConfig();
    return config ? this.maskConfig(config) : null;
  }

  async getStatus(): Promise<EmailReaderStatus> {
    let config: EmailReaderConfig | null = null;

    try {
      config = await this.loadConfig();
    } catch (error) {
      this.logger.warn(
        `EmailReader status unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return {
        configured: false,
        polling: false,
        state: 'No configurado',
        lastSyncAt: null,
        lastSyncError: null,
        frequencyMinutes: null,
      };
    }

    if (!config) {
      return {
        configured: false,
        polling: false,
        state: 'No configurado',
        lastSyncAt: null,
        lastSyncError: null,
        frequencyMinutes: null,
      };
    }

    return {
      configured: true,
      polling: this.pollingTimer !== null,
      state: config.state ?? 'Conectado',
      lastSyncAt: config.lastSyncAt ?? null,
      lastSyncError: config.lastSyncError ?? null,
      frequencyMinutes: config.frequencyMinutes,
    };
  }

  async testConnection(input: EmailReaderConfigInput) {
    const config = await this.resolveConfig(input);
    const client = this.createAdapter(config);

    try {
      await client.connect();
      await client.openMailbox(config.folder);
      return { success: true, state: 'Conectado' as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'IMAP connection failed';
      return {
        success: false,
        state: 'Error de conexion' as const,
        error: message,
      };
    } finally {
      await client.close();
    }
  }

  async syncEmails() {
    let config: EmailReaderConfig | null = null;

    try {
      config = await this.loadConfig();
    } catch (error) {
      this.logger.warn(
        `EmailReader sync skipped: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return {
        processed: 0,
        skipped: 0,
        state: 'No configurado' as const,
        lastSyncAt: null,
      };
    }

    if (!config) {
      return {
        processed: 0,
        skipped: 0,
        state: 'No configurado' as const,
        lastSyncAt: null,
      };
    }

    const client = this.createAdapter(config);
    const processedMessageIds = new Set(config.processedMessageIds);
    let processed = 0;
    let skipped = 0;

    try {
      await client.connect();
      await client.openMailbox(config.folder);
      const uids = await client.searchUnseen();

      for (const uid of uids) {
        const rawMessage = await client.fetchSource(uid);
        const parsed = await simpleParser(rawMessage);
        const messageId = parsed.messageId ?? `uid:${uid}`;

        if (processedMessageIds.has(messageId)) {
          skipped += 1;
          await client.markSeen(uid);
          continue;
        }

        const texto = this.extractMessageText(parsed.text, parsed.html);
        if (texto.length < 10) {
          skipped += 1;
          processedMessageIds.add(messageId);
          await client.markSeen(uid);
          continue;
        }

        const attachments = parsed.attachments as Attachment[];
        const adjuntos = attachments
          .filter((attachment) => this.isPdfAttachment(attachment.filename, attachment.contentType))
          .map((attachment) => ({
            nombre: attachment.filename ?? `attachment-${uid}.pdf`,
            tipo: attachment.contentType,
          }));

        await this.triageService.runTriage({
          texto,
          canal: 'email',
          sourceType: 'email_imap',
          remitente: parsed.from?.value?.[0]?.address,
          asunto: parsed.subject ?? '',
          adjuntos,
        });

        processed += 1;
        processedMessageIds.add(messageId);
        await client.markSeen(uid);
      }

      const nextConfig = {
        ...config,
        processedMessageIds: Array.from(processedMessageIds).slice(-500),
        lastProcessedCount: processed,
        lastSyncAt: new Date().toISOString(),
        lastSyncError: undefined,
        state: 'Conectado' as const,
      } satisfies EmailReaderConfig;

      await this.persistConfig(nextConfig);

      return {
        processed,
        skipped,
        state: 'Conectado' as const,
        lastSyncAt: nextConfig.lastSyncAt,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'IMAP sync failed';
      const nextConfig = {
        ...config,
        lastSyncAt: new Date().toISOString(),
        lastSyncError: message,
        state: 'Error de conexion' as const,
      } satisfies EmailReaderConfig;

      await this.persistConfig(nextConfig);
      this.logger.error(`Email sync failed: ${message}`);
      return {
        processed,
        skipped,
        state: 'Error de conexion' as const,
        lastSyncAt: nextConfig.lastSyncAt,
        error: message,
      };
    } finally {
      await client.close();
    }
  }

  async startPolling() {
    let config: EmailReaderConfig | null = null;

    try {
      config = await this.loadConfig();
    } catch (error) {
      this.logger.warn(
        `EmailReader polling skipped: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return;
    }

    await this.stopPolling();

    if (!config) {
      return;
    }

    this.pollingTimer = setInterval(() => {
      void this.syncEmails();
    }, config.frequencyMinutes * 60 * 1000);
  }

  async stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private async resolveConfig(input: EmailReaderConfigInput): Promise<EmailReaderConfig> {
    const current = await this.loadConfig();
    const password = input.password?.trim() || current?.password;

    return emailReaderConfigSchema.parse({
      ...current,
      ...input,
      password,
    });
  }

  private async loadConfig(): Promise<EmailReaderConfig | null> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key: EMAIL_READER_SETTING_KEY },
      });

      if (!setting) {
        return null;
      }

      return this.parseConfigSetting(setting);
    } catch (error) {
      this.logger.warn(
        `EmailReader config unavailable: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return null;
    }
  }

  private parseConfigSetting(setting: Pick<Setting, 'value'>): EmailReaderConfig {
    return emailReaderConfigSchema.parse(setting.value);
  }

  private async persistConfig(config: EmailReaderConfig) {
    return this.prisma.setting.upsert({
      where: { key: EMAIL_READER_SETTING_KEY },
      update: { value: config as unknown as Prisma.InputJsonValue },
      create: {
        key: EMAIL_READER_SETTING_KEY,
        value: config as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private maskConfig(config: EmailReaderConfig) {
    return {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password ? '********' : '',
      folder: config.folder,
      frequencyMinutes: config.frequencyMinutes,
      hasPassword: config.password.length > 0,
      state: config.state ?? 'Conectado',
    };
  }

  private extractMessageText(text: string | undefined | null, html: string | false | undefined) {
    const plainText = text?.trim() ?? '';

    if (plainText.length > 0) {
      return plainText;
    }

    if (typeof html === 'string' && html.trim().length > 0) {
      return stripHtml(html);
    }

    return '';
  }

  private isPdfAttachment(filename: string | undefined, contentType: string) {
    return contentType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf') === true;
  }

  private createAdapter(config: EmailReaderConfig): ImapAdapter {
    if (process.env.NODE_ENV === 'test') {
      return this.createTestAdapter();
    }

    return this.createImapFlowAdapter(config);
  }

  private createTestAdapter(): ImapAdapter {
    let opened = false;

    return {
      connect: async () => undefined,
      openMailbox: async () => {
        opened = true;
      },
      searchUnseen: async () => (opened ? [101] : []),
      fetchSource: async () => Buffer.from(TEST_EMAIL_SOURCE, 'utf-8'),
      markSeen: async () => undefined,
      close: async () => undefined,
    };
  }

  private createImapFlowAdapter(config: EmailReaderConfig): ImapAdapter {
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.port === 993,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    let releaseLock: (() => void) | null = null;

    return {
      connect: async () => {
        await client.connect();
      },
      openMailbox: async (folder: string) => {
        const lock = await client.getMailboxLock(folder);
        releaseLock = () => lock.release();
      },
      searchUnseen: async () => {
        const result = await client.search({ seen: false }, { uid: true });
        return Array.isArray(result) ? result : [];
      },
      fetchSource: async (uid: number) => {
        const message = await client.fetchOne(String(uid), { source: true }, { uid: true });
        const source =
          typeof message === 'object' && message !== null && 'source' in message
            ? message.source
            : null;

        if (!source) {
          throw new Error(`No source returned for message UID ${uid}`);
        }

        return Buffer.isBuffer(source) ? source : Buffer.from(source);
      },
      markSeen: async (uid: number) => {
        await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
      },
      close: async () => {
        releaseLock?.();
        releaseLock = null;

        if (client.usable) {
          await client.logout();
        }
      },
    };
  }
}

const TEST_EMAIL_SOURCE = [
  'From: ciudadano@example.com',
  'To: pqrs@example.com',
  'Subject: Solicitud de seguimiento',
  'Message-ID: <message-101@example.com>',
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="sep"',
  '',
  '--sep',
  'Content-Type: text/plain; charset="utf-8"',
  '',
  'Necesito respuesta sobre mi solicitud radicada.',
  '--sep',
  'Content-Type: application/pdf; name="soporte.pdf"',
  'Content-Disposition: attachment; filename="soporte.pdf"',
  'Content-Transfer-Encoding: base64',
  '',
  'JVBERi0xLjQKJQ==',
  '--sep--',
  '',
].join('\r\n');
