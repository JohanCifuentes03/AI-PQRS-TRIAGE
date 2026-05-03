import { z } from 'zod';
import { Canal, Urgencia, EstadoPqrs, TipoPqrs } from '../types/enums';

export const triageInputSchema = z.object({
  texto: z.string().min(10, 'El texto debe tener al menos 10 caracteres'),
  canal: z.nativeEnum(Canal),
  sourceType: z.string().optional(),
  remitente: z.string().optional(),
  asunto: z.string().optional(),
  adjuntos: z.array(z.object({ nombre: z.string(), tipo: z.string() })).optional(),
  ocrUsado: z.boolean().optional(),
  advertenciaOcr: z.boolean().optional(),
});

export const triageOutputSchema = z.object({
  tipo: z.string().min(1),
  tema: z.string().min(1),
  subtema: z.string().min(1),
  urgencia: z.nativeEnum(Urgencia),
  entidad: z.string().min(1),
  riesgo: z.string().min(1),
  duplicados: z.array(z.string()),
  confianza: z.number().min(0).max(1),
  resumen: z.string().min(1),
});

export const pqrsCreateSchema = z.object({
  texto: z.string().min(10),
  canal: z.nativeEnum(Canal),
  sourceType: z.string().optional(),
  remitente: z.string().optional(),
  asunto: z.string().optional(),
  adjuntos: z.array(z.object({ nombre: z.string(), tipo: z.string() })).optional(),
  ocrUsado: z.boolean().optional(),
  advertenciaOcr: z.boolean().optional(),
});

export const pqrsApproveSchema = z.object({
  usuario: z.string().min(1),
});

export const pqrsCorrectSchema = z.object({
  usuario: z.string().min(1),
  tipo: z.nativeEnum(TipoPqrs).optional(),
  tema: z.string().optional(),
  subtema: z.string().optional(),
  urgencia: z.nativeEnum(Urgencia).optional(),
  entidad: z.string().optional(),
  riesgo: z.string().optional(),
});

export const pqrsRouteSchema = z.object({
  usuario: z.string().min(1),
});

export const pqrsQuerySchema = z.object({
  estado: z.nativeEnum(EstadoPqrs).optional(),
  urgencia: z.nativeEnum(Urgencia).optional(),
  tipo: z.nativeEnum(TipoPqrs).optional(),
  canal: z.nativeEnum(Canal).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type TriageInput = z.infer<typeof triageInputSchema>;
export type TriageOutput = z.infer<typeof triageOutputSchema>;
export type PqrsCreateInput = z.infer<typeof pqrsCreateSchema>;
export type PqrsApproveInput = z.infer<typeof pqrsApproveSchema>;
export type PqrsCorrectInput = z.infer<typeof pqrsCorrectSchema>;
export type PqrsRouteInput = z.infer<typeof pqrsRouteSchema>;
export type PqrsQueryInput = z.infer<typeof pqrsQuerySchema>;
