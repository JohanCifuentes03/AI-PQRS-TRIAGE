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

interface EntityLoadChartProps {
  data: Array<{ entidad: string; count: number }>;
}

export function EntityLoadChart({ data }: EntityLoadChartProps) {
  if (!data.length) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-xl font-bold mb-4">Carga por Entidad</h3>
        <p className="text-gray-500">Sin datos disponibles</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 15);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-4">Carga por Entidad</h3>
      <ResponsiveContainer width="100%" height={Math.max(sorted.length * 35, 200)}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis
            type="category"
            dataKey="entidad"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            width={180}
          />
          <Tooltip formatter={(value) => [String(value), 'PQRS']} />
          <Bar dataKey="count" fill="#001834" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
