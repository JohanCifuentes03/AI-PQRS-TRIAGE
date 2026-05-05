'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EvaluationCaseResult } from '@/actions/evaluations.actions';

interface EvaluationLatencyChartProps {
  results: EvaluationCaseResult[];
}

export function EvaluationLatencyChart({ results }: EvaluationLatencyChartProps) {
  const data = results.map((result) => ({ caseId: result.caseId.replace('PQRS-', ''), latency: result.latencyMs }));

  if (!data.length) {
    return <div className="bg-white border border-gray-200 p-6 text-gray-500">Sin datos de latencia</div>;
  }

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-4">Latencia por caso</h3>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="caseId" angle={-45} textAnchor="end" height={90} tick={{ fontSize: 10 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
          <Tooltip formatter={(value) => [`${value} ms`, 'Latencia']} />
          <Bar dataKey="latency" fill="#F57C00" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
