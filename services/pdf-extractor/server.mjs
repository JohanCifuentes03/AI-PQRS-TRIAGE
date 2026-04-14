import http from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import busboy from 'busboy';

const PORT = parseInt(process.env.PDF_EXTRACTOR_PORT || '4100', 10);

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
    await new Promise((resolve, reject) => {
      execFile(
        'pdftotext',
        ['-layout', '-enc', 'UTF-8', inputPath, outputPath],
        { timeout: 30000 },
        (err) => (err ? reject(err) : resolve()),
      );
    });
    const text = await readFile(outputPath, 'utf-8');
    return text.trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
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

      const text = await extractWithPdftotext(buffer);

      if (!text || text.length < 5) {
        res.writeHead(422, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: false,
            error: 'No se pudo extraer texto del PDF. Puede ser un PDF escaneado (imagen sin texto).',
          }),
        );
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, text }));
    } catch (err) {
      console.error('Extraction error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : 'Extraction failed',
        }),
      );
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`pdf-extractor listening on :${PORT}`);
});
