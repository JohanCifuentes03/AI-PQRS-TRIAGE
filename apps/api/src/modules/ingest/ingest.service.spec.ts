import { BadGatewayException } from '@nestjs/common';
import { IngestService } from './ingest.service';

describe('IngestService', () => {
  const triageServiceMock = {
    runTriage: jest.fn(),
  };

  const prismaMock = {
    setting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  let service: IngestService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new IngestService(triageServiceMock as never, prismaMock as never);
    jest.clearAllMocks();
    process.env.PDF_EXTRACTOR_URL = 'http://pdf-service:4100';
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('uses text body directly when present and sends email metadata to triage', async () => {
    triageServiceMock.runTriage.mockResolvedValue({ id: 'pqrs-1' });

    const result = await service.processEmail({
      from: 'user@example.com',
      subject: 'Solicitud de apoyo',
      text: 'Necesito ayuda urgente con el servicio publico.',
      attachments: [
        {
          filename: 'evidencia.jpg',
          contentType: 'image/jpeg',
          content: Buffer.from('ignored').toString('base64'),
        },
      ],
    });

    expect(result).toEqual({ id: 'pqrs-1' });
    expect(triageServiceMock.runTriage).toHaveBeenCalledWith({
      texto: 'Necesito ayuda urgente con el servicio publico.',
      canal: 'email',
      sourceType: 'email_webhook',
      remitente: 'user@example.com',
      asunto: 'Solicitud de apoyo',
      adjuntos: [{ nombre: 'evidencia.jpg', tipo: 'image/jpeg' }],
      ocrUsado: false,
      advertenciaOcr: false,
    });
  });

  it('extracts plain text from html and concatenates extracted pdf text', async () => {
    triageServiceMock.runTriage.mockResolvedValue({ id: 'pqrs-2' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        text: 'Contenido del PDF adjunto.',
        ocrUsado: true,
        advertenciaOcr: true,
      }),
    } as never);

    const pdfBytes = Buffer.from('%PDF-1.4 sample');

    await service.processEmail({
      from: 'user@example.com',
      subject: 'Peticion formal',
      html: '<p>Hola <strong>equipo</strong>, necesito respuesta pronta.</p>',
      attachments: [
        {
          filename: 'soporte.pdf',
          contentType: 'application/pdf',
          content: pdfBytes.toString('base64'),
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://pdf-service:4100/extract',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: pdfBytes,
      }),
    );

    expect(triageServiceMock.runTriage).toHaveBeenCalledWith(
      expect.objectContaining({
        texto: 'Hola equipo , necesito respuesta pronta.\n\nContenido del PDF adjunto.',
        adjuntos: [{ nombre: 'soporte.pdf', tipo: 'application/pdf' }],
        ocrUsado: true,
        advertenciaOcr: true,
      }),
    );
  });

  it('throws when pdf extractor fails for a pdf attachment', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: jest.fn().mockResolvedValue({ success: false, error: 'upstream error' }),
    } as never);

    await expect(
      service.processEmail({
        from: 'user@example.com',
        subject: 'Asunto valido',
        text: 'Este correo tiene suficiente contenido para ser procesado.',
        attachments: [
          {
            filename: 'soporte.pdf',
            contentType: 'application/pdf',
            content: Buffer.from('%PDF-1.4 sample').toString('base64'),
          },
        ],
      }),
    ).rejects.toThrow(BadGatewayException);
  });
});
