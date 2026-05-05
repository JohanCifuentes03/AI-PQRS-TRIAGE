'use client';

import { EvaluationReport } from '@/actions/evaluations.actions';

interface EvaluationKpiCardsProps {
  report: EvaluationReport;
}

export function EvaluationKpiCards({ report }: EvaluationKpiCardsProps) {
  const judgeScore = report.summary.judge_overall_score === null
    ? report.summary.judge_error_count > 0
      ? `Error (${report.summary.judge_error_count})`
      : 'N/A'
    : `${report.summary.judge_overall_score}/5`;
  const kpis = [
    { label: 'Total casos', value: report.totalCases, color: 'text-[#001834]' },
    { label: 'Aprobados', value: report.passedCases, color: 'text-[#2E7D32]' },
    { label: 'Fallidos', value: report.failedCases, color: 'text-[#BB0013]' },
    { label: 'Accuracy tipo', value: `${Math.round(report.summary.accuracy_tipo * 100)}%`, color: 'text-[#003A7D]' },
    { label: 'Accuracy entidad', value: `${Math.round(report.summary.accuracy_entidad * 100)}%`, color: 'text-[#003A7D]' },
    { label: 'Score judge', value: judgeScore, color: report.summary.judge_error_count > 0 ? 'text-[#BB0013]' : 'text-[#001834]' },
    { label: 'Latencia p95', value: `${report.summary.p95_latency_ms} ms`, color: 'text-[#F57C00]' },
    { label: 'Costo estimado', value: `${report.summary.estimated_total_cost_usd} USD`, color: 'text-[#001834]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white p-5 border border-gray-200">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{kpi.label}</p>
          <p className={`text-2xl font-black mt-2 ${kpi.color}`}>{kpi.value}</p>
        </div>
      ))}
    </div>
  );
}
