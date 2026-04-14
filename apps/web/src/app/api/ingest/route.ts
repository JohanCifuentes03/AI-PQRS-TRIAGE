import { NextResponse } from 'next/server';
import { createRequire } from 'module';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const runtime = 'nodejs';

const API_URL = process.env.NEXT_SERVER_API_URL || 'http://localhost:4000';
const require = createRequire(import.meta.url);
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse/lib/pdf-parse.js');
const execFileAsync = promisify(execFile);

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const parsed = await pdfParse(buffer);
    return parsed.text?.trim() || '';
  } catch {
    const dir = await mkdtemp(join(tmpdir(), 'pqrs-pdf-'));
    const inputPath = join(dir, 'input.pdf');
    const outputPath = join(dir, 'output.txt');

    try {
      await writeFile(inputPath, buffer);
      await execFileAsync('pdftotext', ['-layout', '-enc', 'UTF-8', inputPath, outputPath]);
      const txt = await readFile(outputPath, 'utf-8');
      return txt.trim();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
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

    const res = await fetch(`${API_URL}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, canal, sourceType }),
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
