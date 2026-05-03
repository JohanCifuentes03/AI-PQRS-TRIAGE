import { apiClient } from '@/lib/api-client';

interface StatsFilters {
  from?: string;
  to?: string;
  canal?: string;
  tipo?: string;
  entidad?: string;
}

function buildStatsParams(filters?: StatsFilters): string {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.canal) params.set('canal', filters.canal);
  if (filters?.tipo) params.set('tipo', filters.tipo);
  if (filters?.entidad) params.set('entidad', filters.entidad);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchStatsOverview(filters?: StatsFilters) {
  return apiClient<{
    success: boolean;
    data: {
      total: number;
      pending: number;
      approved: number;
      corrected: number;
      routed: number;
      avgConfidence: number;
      resolutionRate: number;
    };
  }>(`/stats/overview${buildStatsParams(filters)}`);
}

export async function fetchStatsByChannel(filters?: StatsFilters) {
  return apiClient<{
    success: boolean;
    data: Array<{ canal: string; count: number }>;
  }>(`/stats/by-channel${buildStatsParams(filters)}`);
}

export async function fetchStatsByType(filters?: StatsFilters) {
  return apiClient<{
    success: boolean;
    data: Array<{ tipo: string; count: number }>;
  }>(`/stats/by-type${buildStatsParams(filters)}`);
}

export async function fetchStatsByUrgency(filters?: StatsFilters) {
  return apiClient<{
    success: boolean;
    data: Array<{ urgencia: string; count: number }>;
  }>(`/stats/by-urgency${buildStatsParams(filters)}`);
}

export async function fetchStatsByEntity(filters?: StatsFilters) {
  return apiClient<{
    success: boolean;
    data: Array<{ entidad: string; count: number }>;
  }>(`/stats/by-entity${buildStatsParams(filters)}`);
}

export async function fetchStatsByTopic(filters?: StatsFilters) {
  return apiClient<{
    success: boolean;
    data: Array<{ tema: string; count: number }>;
  }>(`/stats/by-topic${buildStatsParams(filters)}`);
}

export async function fetchStatsTrends(filters?: StatsFilters) {
  return apiClient<{
    success: boolean;
    data: Array<{ date: string; count: number }>;
  }>(`/stats/trends${buildStatsParams(filters)}`);
}
