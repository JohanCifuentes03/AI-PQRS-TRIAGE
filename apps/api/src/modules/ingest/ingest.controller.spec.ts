import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';

describe('IngestController', () => {
  let controller: IngestController;
  let service: IngestService;

  const mockIngestService = {
    processEmail: jest.fn().mockResolvedValue({ id: 'pqrs-1' }),
    processWebhook: jest.fn().mockResolvedValue({ id: 'pqrs-webhook-1' }),
    validateApiKey: jest.fn().mockResolvedValue(undefined),
    getApiInfo: jest.fn().mockImplementation(async (baseUrl: string) => ({
      webhookUrl: `${baseUrl}/ingest/webhook`,
      apiKeyRequired: Boolean(process.env.INGEST_API_KEY),
      apiKey: process.env.INGEST_API_KEY ? `${process.env.INGEST_API_KEY.slice(0, 8)}***` : null,
    })),
    regenerateApiKey: jest.fn(),
  };

  const originalApiKey = process.env.INGEST_API_KEY;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
      providers: [{ provide: IngestService, useValue: mockIngestService }],
    }).compile();

    controller = module.get<IngestController>(IngestController);
    service = module.get<IngestService>(IngestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.INGEST_API_KEY;
      return;
    }

    process.env.INGEST_API_KEY = originalApiKey;
  });

  it('accepts a valid email webhook payload', async () => {
    const body = {
      from: 'user@example.com',
      subject: 'Solicitud ciudadana',
      text: 'Necesito una respuesta pronta sobre el caso reportado.',
    };

    const result = await controller.ingestEmail(body);

    expect(result).toEqual({ success: true, data: { id: 'pqrs-1' } });
    expect(service.processEmail).toHaveBeenCalledWith(body);
  });

  it('rejects payloads without text or html', async () => {
    await expect(
      controller.ingestEmail({
        from: 'user@example.com',
        subject: 'Solicitud ciudadana',
      }),
    ).rejects.toThrow();
  });

  it('rejects payloads whose extracted text is shorter than ten characters', async () => {
    await expect(
      controller.ingestEmail({
        from: 'user@example.com',
        subject: 'Solicitud ciudadana',
        html: '<p>Hola</p>',
      }),
    ).rejects.toThrow();
  });

  it('accepts a webhook payload when the API key matches', async () => {
    process.env.INGEST_API_KEY = 'secret-token';

    const result = await controller.ingestWebhook(
      {
        headers: { 'x-api-key': 'secret-token' },
        protocol: 'https',
        get: jest.fn().mockReturnValue('api.example.com'),
      } as never,
      {
        texto: 'Necesito apoyo con una PQRS que no ha sido respondida.',
        remitente: 'integracion@example.com',
        asunto: 'Caso prioritario',
      },
    );

    expect(result).toEqual({ success: true, data: { id: 'pqrs-webhook-1' } });
    expect(service.processWebhook).toHaveBeenCalledWith({
      texto: 'Necesito apoyo con una PQRS que no ha sido respondida.',
      remitente: 'integracion@example.com',
      asunto: 'Caso prioritario',
    });
  });

  it('rejects a webhook payload when the API key does not match', async () => {
    process.env.INGEST_API_KEY = 'secret-token';
    mockIngestService.validateApiKey.mockRejectedValueOnce(new Error('INVALID_API_KEY'));

    await expect(
      controller.ingestWebhook(
        {
          headers: { 'x-api-key': 'invalid-token' },
          protocol: 'https',
          get: jest.fn().mockReturnValue('api.example.com'),
        } as never,
        {
          texto: 'Necesito apoyo con una PQRS que no ha sido respondida.',
        },
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns API info with masked token and derived webhook URL', async () => {
    process.env.INGEST_API_KEY = '1234567890abcdef';

    const result = await controller.getApiInfo({
      protocol: 'https',
      get: jest.fn().mockReturnValue('api.example.com'),
    } as never);

    expect(result).toEqual({
      success: true,
      data: {
        webhookUrl: 'https://api.example.com/ingest/webhook',
        apiKeyRequired: true,
        apiKey: '12345678***',
      },
    });
  });
});
