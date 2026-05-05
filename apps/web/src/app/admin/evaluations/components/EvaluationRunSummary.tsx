'use client';

import { useEffect, useMemo, useState } from 'react';
import { EvaluationReport, fetchLatestEvaluation } from '@/actions/evaluations.actions';
import { EvaluationCasesTable, EvaluationCaseFilter } from './EvaluationCasesTable';
import { EvaluationCostChart } from './EvaluationCostChart';
import { EvaluationKpiCards } from './EvaluationKpiCards';
import { EvaluationLatencyChart } from './EvaluationLatencyChart';
import { EvaluationScoresChart } from './EvaluationScoresChart';

export function EvaluationRunSummary() {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EvaluationCaseFilter>('all');

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const response = await fetchLatestEvaluation();
        setReport(response.data);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el reporte');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  const filteredResults = useMemo(() => {
    if (!report) return [];
    return report.results.filter((result) => {
      if (filter === 'failed') return !result.passed;
      if (filter === 'entity') return result.deterministicScores.entidadCorrect === false;
      if (filter === 'privacy') {
        return Boolean(result.judgeResult && !('judge_error' in result.judgeResult) && result.judgeResult.privacy_score < 4.5);
      }
      if (filter === 'latency') return result.latencyMs > report.summary.p95_latency_ms;
      return true;
    });
  }, [filter, report]);

  if (loading) {
    return <div className="bg-white border border-gray-200 p-8 text-gray-500">Cargando reporte de evaluación...</div>;
  }

  if (error || !report) {
    return (
      <div className="bg-white border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-[#BB0013]">Reporte no disponible</h3>
        <p className="text-gray-600 mt-2">Ejecuta <code>pnpm eval:run --no-judge</code> o <code>pnpm eval:run</code> y vuelve a abrir esta página.</p>
        {error ? <p className="text-sm text-gray-500 mt-2">Detalle: {error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Última ejecución</p>
          <h3 className="text-2xl font-black mt-1">{report.runId}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Dataset {report.dataset} · {new Date(report.createdAt).toLocaleString('es-CO')}
          </p>
        </div>
        <span className={`px-4 py-2 text-sm font-black ${report.status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {report.status}
        </span>
      </div>

      {report.thresholdFailures?.length ? (
        <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          <p className="font-bold">Umbrales fallidos</p>
          <ul className="list-disc ml-5 mt-2">
            {report.thresholdFailures.map((failure) => <li key={failure}>{failure}</li>)}
          </ul>
        </div>
      ) : null}

      {report.summary.judge_error_count > 0 || report.summary.entity_judge_error_count > 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-900">
          <p className="font-bold">Judge no completado</p>
          <p className="mt-1">
            Judge general con error: {report.summary.judge_error_count} casos · Judge de entidad con error: {report.summary.entity_judge_error_count} casos.
            Revisa que <code>OPENAI_API_KEY</code> esté configurada antes de ejecutar <code>pnpm eval:run</code>.
          </p>
        </div>
      ) : null}

      <EvaluationKpiCards report={report} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EvaluationScoresChart summary={report.summary} />
        <EvaluationLatencyChart results={report.results} />
      </div>

      <EvaluationCostChart results={report.results} />

      <EvaluationCasesTable
        filter={filter}
        onFilterChange={setFilter}
        results={filteredResults}
      />
    </div>
  );
}
