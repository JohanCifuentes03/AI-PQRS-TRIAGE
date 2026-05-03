'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TopicDistributionProps {
  data: Array<{ tema: string; count: number }>;
}

export function TopicDistribution({ data }: TopicDistributionProps) {
  if (!data.length) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
          Distribución por Tema
        </h3>
        <p className="text-gray-400 text-sm">Sin datos disponibles</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 12);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
        Distribución por Tema
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(sorted.length * 32, 200)}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
          <YAxis
            type="category"
            dataKey="tema"
            tick={{ fontSize: 11 }}
            stroke="#9CA3AF"
            width={140}
          />
          <Tooltip
            contentStyle={{ border: '1px solid #E5E7EB', fontSize: 13 }}
            formatter={(value) => [String(value), 'PQRS']}
          />
          <Bar dataKey="count" fill="#001834" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
