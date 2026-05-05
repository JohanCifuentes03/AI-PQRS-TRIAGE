'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EvaluationSummary } from '@/actions/evaluations.actions';

interface EvaluationScoresChartProps {
  summary: EvaluationSummary;
}

export function EvaluationScoresChart({ summary }: EvaluationScoresChartProps) {
  const accuracyData = [
    { name: 'Tipo', value: Math.round(summary.accuracy_tipo * 100) },
    { name: 'Tema', value: Math.round(summary.accuracy_tema * 100) },
    { name: 'Subtema', value: Math.round(summary.accuracy_subtema * 100) },
    { name: 'Urgencia', value: Math.round(summary.accuracy_urgencia * 100) },
    { name: 'Riesgo', value: Math.round(summary.accuracy_riesgo * 100) },
    { name: 'Entidad', value: Math.round(summary.accuracy_entidad * 100) },
    { name: 'Duplicado', value: Math.round(summary.accuracy_duplicado * 100) },
  ];

  const judgeData = [
    { name: 'Overall', value: summary.judge_overall_score },
    { name: 'Resumen', value: summary.summary_score },
    { name: 'Privacidad', value: summary.privacy_score },
    { name: 'Ética', value: summary.ethics_score },
    { name: 'Trazabilidad', value: summary.traceability_score },
  ].filter((item): item is { name: string; value: number } => item.value !== null);

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-xl font-bold mb-4">Calidad por dimensión</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={accuracyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6B7280" />
          <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
          <Bar dataKey="value" fill="#001834" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <h3 className="text-xl font-bold mt-8 mb-4">Scores del judge</h3>
      {judgeData.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={judgeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="#6B7280" />
            <Tooltip formatter={(value) => [`${value}/5`, 'Score']} />
            <Bar dataKey="value" fill="#003A7D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500">Judge no ejecutado para este reporte.</p>
      )}
    </div>
  );
}
