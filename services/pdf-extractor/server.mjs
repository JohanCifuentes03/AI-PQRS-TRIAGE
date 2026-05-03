import http from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import busboy from 'busboy';
import { createWorker, PSM } from 'tesseract.js';

const PORT = parseInt(process.env.PDF_EXTRACTOR_PORT || '4100', 10);
const MIN_DIRECT_TEXT_LENGTH = 50;
const MIN_VALID_TEXT_LENGTH = 5;
const OCR_WARNING_CONFIDENCE_THRESHOLD = 70;
export const SCANNED_PDF_ERROR =
  'No se pudo extraer texto del PDF. Puede ser un PDF escaneado (imagen sin texto).';

function execFileAsync(command, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout }, (err) => (err ? reject(err) : resolve()));
  });
}

function normalizeText(text) {
  return typeof text === 'string' ? text.trim() : '';
}

function hasEnoughText(text, minLength) {
  return normalizeText(text).length >= minLength;
}

function calculateAverageConfidence(words, fallbackConfidence) {
  if (Array.isArray(words) && words.length > 0) {
    const total = words.reduce((sum, word) => sum + (word?.confidence || 0), 0);
    return Math.round(total / words.length);
  }

  return Math.round(fallbackConfidence || 0);
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const files = [];

    bb.on('file', (name, stream, info) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        files.push({ name, filename: info.filename, buffer: Buffer.concat(chunks) });
      });
    });

    bb.on('finish', () => resolve(files));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

async function extractWithPdftotext(buffer) {
  const dir = await mkdtemp(join(tmpdir(), 'pdf-ext-'));
  const inputPath = join(dir, 'input.pdf');
  const outputPath = join(dir, 'output.txt');

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync('pdftotext', ['-layout', '-enc', 'UTF-8', inputPath, outputPath]);
    const text = await readFile(outputPath, 'utf-8');
    return normalizeText(text);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function extractWithOcr(buffer) {
  const dir = await mkdtemp(join(tmpdir(), 'pdf-ocr-'));
  const inputPath = join(dir, 'input.pdf');
  const outputBasePath = join(dir, 'page');
  const imagePath = `${outputBasePath}.png`;
  let worker;

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync('pdftoppm', ['-png', '-f', '1', '-singlefile', inputPath, outputBasePath]);

    worker = await createWorker('spa+eng');
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
    });

    const result = await worker.recognize(imagePath);
    const text = normalizeText(result.data.text);
    const confianzaOcr = calculateAverageConfidence(
      result.data.words,
      result.data.confidence,
    );

    return {
      text,
      ocrUsado: true,
      advertenciaOcr: confianzaOcr < OCR_WARNING_CONFIDENCE_THRESHOLD,
      confianzaOcr,
    };
  } finally {
    await worker?.terminate();
    await rm(dir, { recursive: true, force: true });
  }
}

export async function extractPdfContent(
  buffer,
  {
    extractWithPdftotext: extractText = extractWithPdftotext,
    extractWithOcr: extractOcr = extractWithOcr,
  } = {},
) {
  let text = '';

  try {
    text = normalizeText(await extractText(buffer));
  } catch (error) {
    console.warn('pdftotext extraction failed, trying OCR fallback:', error);
  }

  if (hasEnoughText(text, MIN_DIRECT_TEXT_LENGTH)) {
    return { success: true, text };
  }

  try {
    const ocrResult = await extractOcr(buffer);
    if (hasEnoughText(ocrResult.text, MIN_VALID_TEXT_LENGTH)) {
      return {
        success: true,
        text: normalizeText(ocrResult.text),
        ocrUsado: true,
        advertenciaOcr: Boolean(ocrResult.advertenciaOcr),
        confianzaOcr: ocrResult.confianzaOcr,
      };
    }
  } catch (error) {
    console.warn('OCR fallback failed:', error);
  }

  throw new Error(SCANNED_PDF_ERROR);
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'pdf-extractor' }));
    return;
  }

  if (url.pathname === '/extract' && req.method === 'POST') {
    try {
      let buffer;

      const contentType = (req.headers['content-type'] || '').toLowerCase();
      if (contentType.includes('multipart/form-data')) {
        const files = await parseMultipart(req);
        if (files.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'No file uploaded' }));
          return;
        }
        buffer = files[0].buffer;
      } else {
        buffer = await readRawBody(req);
      }

      if (buffer.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Empty body' }));
        return;
      }

      const extractionResult = await extractPdfContent(buffer);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(extractionResult));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      const status = message === SCANNED_PDF_ERROR ? 422 : 500;
      console.error('Extraction error:', err);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: message,
        }),
      );
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`pdf-extractor listening on :${PORT}`);
  });
}
