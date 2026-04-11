import { z } from 'zod';
import { Canal, Urgencia, EstadoPqrs, TipoPqrs } from '../types/enums';
export declare const triageInputSchema: z.ZodObject<{
    texto: z.ZodString;
    canal: z.ZodNativeEnum<typeof Canal>;
}, "strip", z.ZodTypeAny, {
    texto: string;
    canal: Canal;
}, {
    texto: string;
    canal: Canal;
}>;
export declare const triageOutputSchema: z.ZodObject<{
    tipo: z.ZodString;
    tema: z.ZodString;
    subtema: z.ZodString;
    urgencia: z.ZodNativeEnum<typeof Urgencia>;
    entidad: z.ZodString;
    riesgo: z.ZodString;
    duplicados: z.ZodArray<z.ZodString, "many">;
    confianza: z.ZodNumber;
    resumen: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tipo: string;
    tema: string;
    subtema: string;
    urgencia: Urgencia;
    entidad: string;
    riesgo: string;
    duplicados: string[];
    confianza: number;
    resumen: string;
}, {
    tipo: string;
    tema: string;
    subtema: string;
    urgencia: Urgencia;
    entidad: string;
    riesgo: string;
    duplicados: string[];
    confianza: number;
    resumen: string;
}>;
export declare const pqrsCreateSchema: z.ZodObject<{
    texto: z.ZodString;
    canal: z.ZodNativeEnum<typeof Canal>;
}, "strip", z.ZodTypeAny, {
    texto: string;
    canal: Canal;
}, {
    texto: string;
    canal: Canal;
}>;
export declare const pqrsApproveSchema: z.ZodObject<{
    usuario: z.ZodString;
}, "strip", z.ZodTypeAny, {
    usuario: string;
}, {
    usuario: string;
}>;
export declare const pqrsCorrectSchema: z.ZodObject<{
    usuario: z.ZodString;
    tipo: z.ZodOptional<z.ZodNativeEnum<typeof TipoPqrs>>;
    tema: z.ZodOptional<z.ZodString>;
    subtema: z.ZodOptional<z.ZodString>;
    urgencia: z.ZodOptional<z.ZodNativeEnum<typeof Urgencia>>;
    entidad: z.ZodOptional<z.ZodString>;
    riesgo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    usuario: string;
    tipo?: TipoPqrs | undefined;
    tema?: string | undefined;
    subtema?: string | undefined;
    urgencia?: Urgencia | undefined;
    entidad?: string | undefined;
    riesgo?: string | undefined;
}, {
    usuario: string;
    tipo?: TipoPqrs | undefined;
    tema?: string | undefined;
    subtema?: string | undefined;
    urgencia?: Urgencia | undefined;
    entidad?: string | undefined;
    riesgo?: string | undefined;
}>;
export declare const pqrsRouteSchema: z.ZodObject<{
    usuario: z.ZodString;
}, "strip", z.ZodTypeAny, {
    usuario: string;
}, {
    usuario: string;
}>;
export declare const pqrsQuerySchema: z.ZodObject<{
    estado: z.ZodOptional<z.ZodNativeEnum<typeof EstadoPqrs>>;
    urgencia: z.ZodOptional<z.ZodNativeEnum<typeof Urgencia>>;
    tipo: z.ZodOptional<z.ZodNativeEnum<typeof TipoPqrs>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    tipo?: TipoPqrs | undefined;
    urgencia?: Urgencia | undefined;
    estado?: EstadoPqrs | undefined;
}, {
    tipo?: TipoPqrs | undefined;
    urgencia?: Urgencia | undefined;
    estado?: EstadoPqrs | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type TriageInput = z.infer<typeof triageInputSchema>;
export type TriageOutput = z.infer<typeof triageOutputSchema>;
export type PqrsCreateInput = z.infer<typeof pqrsCreateSchema>;
export type PqrsApproveInput = z.infer<typeof pqrsApproveSchema>;
export type PqrsCorrectInput = z.infer<typeof pqrsCorrectSchema>;
export type PqrsRouteInput = z.infer<typeof pqrsRouteSchema>;
export type PqrsQueryInput = z.infer<typeof pqrsQuerySchema>;
//# sourceMappingURL=triage.schema.d.ts.map