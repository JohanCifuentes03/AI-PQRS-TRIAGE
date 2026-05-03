'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendsChartProps {
  data: Array<{ date: string; count: number }>;
}

export function TrendsChart({ data }: TrendsChartProps) {
  if (!data.length) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-xl font-bold mb-4">Volumen PQRS</h3>
        <p className="text-gray-500">Sin datos disponibles</p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
  }));

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-4">Volumen PQRS (últimos 30 días)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
          <Tooltip
            contentStyle={{ border: '1px solid #E5E7EB', fontSize: 14 }}
            formatter={(value) => [String(value), 'PQRS']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#001834"
            fill="#001834"
            fillOpacity={0.1}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
