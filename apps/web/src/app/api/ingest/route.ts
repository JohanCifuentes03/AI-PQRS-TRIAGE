import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_URL = process.env.NEXT_SERVER_API_URL || 'http://localhost:4000';
const PDF_EXTRACTOR_URL = process.env.PDF_EXTRACTOR_URL || 'http://localhost:4100';

async function extractPdfText(buffer: Buffer): Promise<string> {
  const res = await fetch(`${PDF_EXTRACTOR_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });

  const payload = await res.json();

  if (!res.ok || !payload.success) {
    throw new Error(
      payload.error || `PDF extraction failed (status ${res.status})`,
    );
  }

  return payload.text;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const canal = String(formData.get('canal') || 'web');
    const textInput = formData.get('texto');
    const file = formData.get('file');

    let texto = '';
    let sourceType = 'manual_text';

    if (typeof textInput === 'string' && textInput.trim().length > 0) {
      texto = textInput.trim();
      sourceType = 'manual_text';
    } else if (file && file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        texto = await extractPdfText(buffer);
        sourceType = 'pdf';
      } else {
        texto = buffer.toString('utf-8').trim();
        sourceType = 'txt';
      }
    }

    if (!texto || texto.length < 10) {
      return NextResponse.json(
        { success: false, message: 'No se pudo extraer texto valido del archivo o input.' },
        { status: 400 },
      );
    }

    let res: Response;
    try {
      res = await fetch(`${API_URL}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, canal, sourceType }),
      });
    } catch {
      return NextResponse.json(
        { success: false, message: 'No se pudo conectar con la API de triage (puerto 4000).' },
        { status: 502 },
      );
    }

    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      payload = { success: false, message: 'La API devolvio una respuesta no valida.' };
    }

    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado en ingesta';
    const isPdfError = message.toLowerCase().includes('pdf');
    return NextResponse.json(
      { success: false, message },
      { status: isPdfError ? 422 : 500 },
    );
  }
}
