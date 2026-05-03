'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DistributionChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
  colors: string[];
}

export function DistributionChart({ title, data, colors }: DistributionChartProps) {
  if (!data.length) {
    return (
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-500">Sin datos disponibles</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) =>
              total > 0 ? `${name}: ${Math.round((value / total) * 100)}%` : name
            }
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [String(value), 'Cantidad']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
