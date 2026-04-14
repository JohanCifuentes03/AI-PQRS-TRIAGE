import { apiClient } from '@/lib/api-client';

export async function fetchPqrsList(params?: {
  estado?: string;
  urgencia?: string;
  tipo?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.estado) searchParams.set('estado', params.estado);
  if (params?.urgencia) searchParams.set('urgencia', params.urgencia);
  if (params?.tipo) searchParams.set('tipo', params.tipo);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  return apiClient<{
    data: Array<{
      id: string;
      texto: string;
      canal: string;
      tipo: string | null;
      tema: string | null;
      subtema: string | null;
      urgencia: string | null;
      entidad: string | null;
      riesgo: string | null;
      resumen: string | null;
      confianza: number | null;
      estado: string;
      createdAt: string;
    }>;
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(`/pqrs?${searchParams.toString()}`);
}

export async function fetchPqrsDetail(id: string) {
  return apiClient<{
    data: {
      id: string;
      texto: string;
      sourceType?: string | null;
      pipelineTrace?: {
        runId: string;
        startedAt: string;
        finishedAt: string;
        totalMs: number;
        steps: Array<{
          agent: string;
          status: 'ok' | 'fallback' | 'error';
          durationMs: number;
          output: Record<string, unknown>;
        }>;
      } | null;
      canal: string;
      tipo: string | null;
      tema: string | null;
      subtema: string | null;
      urgencia: string | null;
      entidad: string | null;
      riesgo: string | null;
      resumen: string | null;
      confianza: number | null;
      estado: string;
      createdAt: string;
      updatedAt: string;
    };
  }>(`/pqrs/${id}`);
}

export async function fetchPqrsTrace(id: string) {
  return apiClient<{
    data: {
      pqrsId: string;
      estado: string;
      sourceType: string | null;
      pipelineTrace:
        | {
            runId: string;
            startedAt: string;
            finishedAt: string;
            totalMs: number;
            steps: Array<{
              agent: string;
              status: 'ok' | 'fallback' | 'error';
              durationMs: number;
              output: Record<string, unknown>;
            }>;
          }
        | null;
      auditLogs: Array<{
        id: string;
        accion: string;
        usuario: string;
        detalles: Record<string, unknown> | null;
        createdAt: string;
      }>;
    };
  }>(`/pqrs/${id}/trace`);
}

export async function approvePqrs(id: string, usuario: string) {
  return apiClient<{ success: boolean }>(`/pqrs/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario }),
  });
}

export async function correctPqrs(
  id: string,
  usuario: string,
  corrections: Record<string, string>,
) {
  return apiClient<{ success: boolean }>(`/pqrs/${id}/correct`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario, ...corrections }),
  });
}

export async function routePqrs(id: string, usuario: string) {
  return apiClient<{ success: boolean }>(`/pqrs/${id}/route`, {
    method: 'PATCH',
    body: JSON.stringify({ usuario }),
  });
}

export async function submitTriage(texto: string, canal: string) {
  return apiClient<{ success: boolean; data: Record<string, unknown> }>('/triage', {
    method: 'POST',
    body: JSON.stringify({ texto, canal }),
  });
}
