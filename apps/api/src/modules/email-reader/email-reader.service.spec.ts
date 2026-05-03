import { EmailReaderService } from './email-reader.service';

describe('EmailReaderService', () => {
  const prismaMock = {
    setting: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const triageServiceMock = {
    runTriage: jest.fn(),
  };

  let service: EmailReaderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmailReaderService(prismaMock as never, triageServiceMock as never);
  });

  it('returns disconnected status when config is missing', async () => {
    prismaMock.setting.findUnique.mockResolvedValue(null);

    await expect(service.getStatus()).resolves.toEqual(
      expect.objectContaining({
        configured: false,
        state: 'No configurado',
        polling: false,
      }),
    );
  });

  it('tests IMAP connection with provided config', async () => {
    await expect(
      service.testConnection({
        host: 'imap.gmail.com',
        port: 993,
        user: 'pqrs@example.com',
        password: 'secret',
        folder: 'INBOX',
        frequencyMinutes: 5,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        success: true,
        state: 'Conectado',
      }),
    );
  });

  it('syncs unseen emails, triages them, and marks them as seen once processed', async () => {
    prismaMock.setting.findUnique.mockResolvedValue({
      key: 'email_reader',
      value: {
        host: 'imap.gmail.com',
        port: 993,
        user: 'pqrs@example.com',
        password: 'secret',
        folder: 'INBOX',
        frequencyMinutes: 2,
        processedMessageIds: [],
      },
    });
    triageServiceMock.runTriage.mockResolvedValue({ id: 'pqrs-1' });

    const result = await service.syncEmails();

    expect(result).toEqual(
      expect.objectContaining({
        processed: 1,
        skipped: 0,
        state: 'Conectado',
      }),
    );
    expect(triageServiceMock.runTriage).toHaveBeenCalledWith({
      texto: 'Necesito respuesta sobre mi solicitud radicada.',
      canal: 'email',
      sourceType: 'email_imap',
      remitente: 'ciudadano@example.com',
      asunto: 'Solicitud de seguimiento',
      adjuntos: [{ nombre: 'soporte.pdf', tipo: 'application/pdf' }],
    });
    expect(prismaMock.setting.upsert).toHaveBeenCalled();
  });
});
