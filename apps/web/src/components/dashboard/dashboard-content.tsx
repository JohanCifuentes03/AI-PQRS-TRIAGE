'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchStatsOverview,
  fetchStatsByChannel,
  fetchStatsByType,
  fetchStatsByUrgency,
  fetchStatsByEntity,
  fetchStatsByTopic,
  fetchStatsTrends,
} from '@/actions/stats.actions';
import { fetchPqrsList } from '@/actions/pqrs.actions';
import { KpiCards } from './kpi-cards';
import { TrendsChart } from './trends-chart';
import { DistributionChart } from './distribution-chart';
import { EntityLoadChart } from './entity-load-chart';
import { TopicDistribution } from './topic-distribution';
import { RecentPqrsTable } from './recent-pqrs-table';
import { DashboardFilters, type DashboardFiltersState } from './dashboard-filters';

export function DashboardContent() {
  const [filters, setFilters] = useState<DashboardFiltersState>({});
  const [overview, setOverview] = useState<{
    total: number;
    pending: number;
    approved: number;
    corrected: number;
    routed: number;
    avgConfidence: number;
    resolutionRate: number;
  } | null>(null);
  const [channelData, setChannelData] = useState<Array<{ canal: string; count: number }>>([]);
  const [typeData, setTypeData] = useState<Array<{ tipo: string; count: number }>>([]);
  const [urgencyData, setUrgencyData] = useState<Array<{ urgencia: string; count: number }>>([]);
  const [entityData, setEntityData] = useState<Array<{ entidad: string; count: number }>>([]);
  const [topicData, setTopicData] = useState<Array<{ tema: string; count: number }>>([]);
  const [trendsData, setTrendsData] = useState<Array<{ date: string; count: number }>>([]);
  const [recentPqrs, setRecentPqrs] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const filterParams = {
    from: filters.from,
    to: filters.to,
    canal: filters.canal,
    tipo: filters.tipo,
    entidad: filters.entidad,
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, channelRes, typeRes, urgencyRes, entityRes, topicRes, trendsRes, pqrsRes] =
        await Promise.allSettled([
          fetchStatsOverview(filterParams),
          fetchStatsByChannel(filterParams),
          fetchStatsByType(filterParams),
          fetchStatsByUrgency(filterParams),
          fetchStatsByEntity(filterParams),
          fetchStatsByTopic(filterParams),
          fetchStatsTrends(filterParams),
          fetchPqrsList({ page: 1, limit: 10 }),
        ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (channelRes.status === 'fulfilled') setChannelData(channelRes.value.data);
      if (typeRes.status === 'fulfilled') setTypeData(typeRes.value.data);
      if (urgencyRes.status === 'fulfilled') setUrgencyData(urgencyRes.value.data);
      if (entityRes.status === 'fulfilled') setEntityData(entityRes.value.data);
      if (topicRes.status === 'fulfilled') setTopicData(topicRes.value.data);
      if (trendsRes.status === 'fulfilled') setTrendsData(trendsRes.value.data);
      if (pqrsRes.status === 'fulfilled') setRecentPqrs(pqrsRes.value.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <DashboardFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500 text-lg">Cargando dashboard...</div>
        </div>
      ) : (
        <>
          <KpiCards overview={overview} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendsChart data={trendsData} />
            <DistributionChart
              title="Distribución por Tipo"
              data={typeData.map((d) => ({ name: d.tipo, value: d.count }))}
              colors={['#001834', '#003A7D', '#0066FF', '#4D94FF', '#99C2FF']}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionChart
              title="Distribución por Canal"
              data={channelData.map((d) => ({ name: d.canal, value: d.count }))}
              colors={['#001834', '#BB0013', '#2E7D32', '#F57C00', '#7B1FA2']}
            />
            <DistributionChart
              title="Distribución por Urgencia"
              data={urgencyData.map((d) => ({ name: d.urgencia, value: d.count }))}
              colors={['#C62828', '#F57C00', '#2E7D32']}
            />
          </div>

          <EntityLoadChart data={entityData} />
          <TopicDistribution data={topicData} />

          <RecentPqrsTable pqrs={recentPqrs} />
        </>
      )}
    </div>
  );
}
