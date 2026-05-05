'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EvaluationCaseResult } from '@/actions/evaluations.actions';

interface EvaluationCostChartProps {
  results: EvaluationCaseResult[];
}

export function EvaluationCostChart({ results }: EvaluationCostChartProps) {
  const data = results.map((result) => ({
    caseId: result.caseId.replace('PQRS-', ''),
    cost: result.cost.estimatedTotalCostUsd,
  }));

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-4">Costo estimado por caso</h3>
      <p className="text-sm text-gray-500 mb-4">Valores aproximados cuando el proveedor no entrega tokens reales.</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="caseId" tick={{ fontSize: 11 }} stroke="#6B7280" />
          <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
          <Tooltip formatter={(value) => [`${value} USD`, 'Costo estimado']} />
          <Bar dataKey="cost" fill="#BB0013" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
