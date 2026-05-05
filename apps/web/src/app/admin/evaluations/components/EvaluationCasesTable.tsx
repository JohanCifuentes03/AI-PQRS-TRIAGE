'use client';

import { EvaluationCaseResult, EvaluationJudgeResult } from '@/actions/evaluations.actions';

export type EvaluationCaseFilter = 'all' | 'failed' | 'entity' | 'privacy' | 'latency';

interface EvaluationCasesTableProps {
  results: EvaluationCaseResult[];
  filter: EvaluationCaseFilter;
  onFilterChange: (filter: EvaluationCaseFilter) => void;
}

const filters: Array<{ key: EvaluationCaseFilter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'failed', label: 'Solo fallidos' },
  { key: 'entity', label: 'Errores de entidad' },
  { key: 'privacy', label: 'Baja privacidad' },
  { key: 'latency', label: 'Alta latencia' },
];

export function EvaluationCasesTable({ results, filter, onFilterChange }: EvaluationCasesTableProps) {
  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <h3 className="text-xl font-bold">Casos evaluados</h3>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onFilterChange(item.key)}
              className={`px-3 py-2 text-xs font-bold border ${filter === item.key ? 'bg-[#001834] text-white border-[#001834]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              {['ID', 'Estado', 'Tipo', 'Entidad', 'Judge', 'Latencia', 'Error principal', 'Recomendación'].map((header) => (
                <th key={header} className="py-3 px-2 text-xs uppercase tracking-wider text-gray-500 font-bold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const judge = getJudge(result);
              return (
                <tr key={result.caseId} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                  <td className="py-3 px-2 font-bold text-[#001834]">{result.caseId}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 text-xs font-bold ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <p className="text-gray-500">Esp: {String(result.expected.tipo ?? '-')}</p>
                    <p>Act: {String(result.actual.tipo ?? '-')}</p>
                  </td>
                  <td className="py-3 px-2 max-w-xs">
                    <p className="text-gray-500">Esp: {String(result.expected.entidad ?? '-')}</p>
                    <p>Act: {String(result.actual.entidad ?? '-')}</p>
                  </td>
                  <td className="py-3 px-2">{judge ? `${judge.overall_score}/5` : '-'}</td>
                  <td className="py-3 px-2">{result.latencyMs} ms</td>
                  <td className="py-3 px-2 max-w-sm text-gray-600">{judge?.main_error || result.errors[0] || '-'}</td>
                  <td className="py-3 px-2 max-w-sm text-gray-600">{judge?.recommendation || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getJudge(result: EvaluationCaseResult): EvaluationJudgeResult | null {
  if (!result.judgeResult || 'judge_error' in result.judgeResult) return null;
  return result.judgeResult;
}
