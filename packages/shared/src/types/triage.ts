import { Canal } from './enums';

export interface TriageInput {
  texto: string;
  canal: Canal;
  sourceType?: string;
  remitente?: string;
  asunto?: string;
  adjuntos?: Array<{ nombre: string; tipo: string }>;
  ocrUsado?: boolean;
  advertenciaOcr?: boolean;
}

export interface TriageOutput {
  tipo: string;
  tema: string;
  subtema: string;
  urgencia: string;
  entidad: string;
  riesgo: string;
  duplicados: string[];
  confianza: number;
  resumen: string;
}

export interface PqrsRecord {
  id: string;
  texto: string;
  canal: Canal;
  sourceType: string | null;
  remitente: string | null;
  asunto: string | null;
  adjuntos: Array<{ nombre: string; tipo: string }> | null;
  tipo: string | null;
  tema: string | null;
  subtema: string | null;
  urgencia: string | null;
  entidad: string | null;
  riesgo: string | null;
  resumen: string | null;
  confianza: number | null;
  estado: string;
  ocrUsado: boolean;
  advertenciaOcr: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogRecord {
  id: string;
  pqrsId: string;
  accion: string;
  usuario: string;
  detalles: Record<string, unknown> | null;
  createdAt: Date;
}
