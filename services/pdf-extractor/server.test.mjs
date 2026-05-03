import test from 'node:test';
import assert from 'node:assert/strict';

import { SCANNED_PDF_ERROR, extractPdfContent } from './server.mjs';

test('returns plain extraction when pdftotext yields enough text', async () => {
  const text = 'Este PDF ya tiene una capa de texto suficiente para evitar OCR.';
  let ocrCalls = 0;

  const result = await extractPdfContent(Buffer.from('pdf'), {
    extractWithPdftotext: async () => text,
    extractWithOcr: async () => {
      ocrCalls += 1;
      return {
        text: 'No deberia usarse',
        ocrUsado: true,
        advertenciaOcr: false,
        confianzaOcr: 90,
      };
    },
  });

  assert.deepEqual(result, { success: true, text });
  assert.equal(ocrCalls, 0);
});

test('falls back to OCR when extracted text is too short', async () => {
  const ocrText = 'Texto recuperado por OCR con suficiente contenido para continuar el triage.';

  const result = await extractPdfContent(Buffer.from('pdf'), {
    extractWithPdftotext: async () => 'muy corto',
    extractWithOcr: async () => ({
      text: ocrText,
      ocrUsado: true,
      advertenciaOcr: true,
      confianzaOcr: 68,
    }),
  });

  assert.deepEqual(result, {
    success: true,
    text: ocrText,
    ocrUsado: true,
    advertenciaOcr: true,
    confianzaOcr: 68,
  });
});

test('throws scanned pdf error when OCR cannot recover text', async () => {
  await assert.rejects(
    extractPdfContent(Buffer.from('pdf'), {
      extractWithPdftotext: async () => '',
      extractWithOcr: async () => ({
        text: 'bad',
        ocrUsado: true,
        advertenciaOcr: true,
        confianzaOcr: 42,
      }),
    }),
    (error) => {
      assert.equal(error.message, SCANNED_PDF_ERROR);
      return true;
    },
  );
});
