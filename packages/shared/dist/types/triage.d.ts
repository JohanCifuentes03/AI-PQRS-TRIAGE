import { Canal } from './enums';
export interface TriageInput {
    texto: string;
    canal: Canal;
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
    tipo: string | null;
    tema: string | null;
    subtema: string | null;
    urgencia: string | null;
    entidad: string | null;
    riesgo: string | null;
    resumen: string | null;
    confianza: number | null;
    estado: string;
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
//# sourceMappingURL=triage.d.ts.map