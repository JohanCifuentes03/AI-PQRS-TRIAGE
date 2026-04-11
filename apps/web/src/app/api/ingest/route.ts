import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';

const API_URL = process.env.NEXT_SERVER_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const canal = String(formData.get('canal') || 'web');
    const textInput = formData.get('texto');
    const file = formData.get('file');

    let texto = '';

    if (typeof textInput === 'string' && textInput.trim().length > 0) {
      texto = textInput.trim();
    } else if (file && file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();
        texto = parsed.text.trim();
        await parser.destroy();
      } else {
        texto = buffer.toString('utf-8').trim();
      }
    }

    if (!texto || texto.length < 10) {
      return NextResponse.json(
        { success: false, message: 'No se pudo extraer texto valido del archivo o input.' },
        { status: 400 },
      );
    }

    const res = await fetch(`${API_URL}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, canal }),
    });

    const payload = await res.json();
    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Error inesperado en ingesta',
      },
      { status: 500 },
    );
  }
}
