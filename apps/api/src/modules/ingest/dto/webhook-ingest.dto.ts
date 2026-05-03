import { z } from 'zod';

const webhookAttachmentSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.string().min(1),
});

export const webhookIngestSchema = z.object({
  texto: z.string().min(10),
  remitente: z.string().email().optional(),
  asunto: z.string().min(1).optional(),
  canalOrigen: z.string().min(1).optional(),
  adjuntos: z.array(webhookAttachmentSchema).optional(),
});

export type WebhookIngestDto = z.infer<typeof webhookIngestSchema>;
