import { POST } from './route';

describe('POST /api/ingest', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('forwards OCR metadata from the pdf extractor to triage', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          text: 'Texto extraido via OCR con suficiente longitud para el triage.',
          ocrUsado: true,
          advertenciaOcr: true,
          confianzaOcr: 68,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: '1' } }),
      } as Response);

    global.fetch = fetchMock;

    const formData = new FormData();
    formData.set('canal', 'web');
    formData.set(
      'file',
      new File([new Uint8Array([37, 80, 68, 70])], 'documento.pdf', {
        type: 'application/pdf',
      }),
    );

    const request = new Request('http://localhost/api/ingest', {
      method: 'POST',
    });
    Object.defineProperty(request, 'formData', {
      value: async () => formData,
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ success: true, data: { id: '1' } });

    const triageRequest = fetchMock.mock.calls[1]?.[1];
    expect(triageRequest).toBeDefined();
    expect(JSON.parse(String(triageRequest?.body))).toMatchObject({
      texto: 'Texto extraido via OCR con suficiente longitud para el triage.',
      canal: 'web',
      sourceType: 'pdf',
      ocrUsado: true,
      advertenciaOcr: true,
      confianzaOcr: 68,
    });
  });
});
