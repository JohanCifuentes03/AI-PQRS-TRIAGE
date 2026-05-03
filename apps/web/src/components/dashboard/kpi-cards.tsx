'use client';

interface KpiCardsProps {
  overview: {
    total: number;
    pending: number;
    approved: number;
    corrected: number;
    routed: number;
    avgConfidence: number;
    resolutionRate: number;
  } | null;
}

const kpis: Array<{
  key: string;
  label: string;
  color: string;
  bg: string;
  suffix?: string;
}> = [
  { key: 'total', label: 'Total PQRS', color: 'text-[#001834]', bg: 'bg-white' },
  { key: 'pending', label: 'Pendientes', color: 'text-[#F57C00]', bg: 'bg-white' },
  { key: 'approved', label: 'Aprobadas', color: 'text-[#2E7D32]', bg: 'bg-white' },
  { key: 'corrected', label: 'Corregidas', color: 'text-[#BB0013]', bg: 'bg-white' },
  { key: 'routed', label: 'Enrutadas', color: 'text-[#003A7D]', bg: 'bg-white' },
  { key: 'resolutionRate', label: 'Tasa Resolución', color: 'text-[#001834]', bg: 'bg-white', suffix: '%' },
  { key: 'avgConfidence', label: 'Confianza Promedio', color: 'text-[#001834]', bg: 'bg-white', suffix: '%' },
];

export function KpiCards({ overview }: KpiCardsProps) {
  if (!overview) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {kpis.map((kpi) => {
      const raw = overview[kpi.key as keyof typeof overview];
      const value =
        typeof raw === 'number'
          ? kpi.key === 'avgConfidence' || kpi.key === 'resolutionRate'
            ? Math.round(raw)
            : raw
          : 0;

      return (
        <div key={kpi.key} className={`${kpi.bg} p-5 border border-gray-200`}>
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">
            {kpi.label}
          </p>
          <p className={`text-3xl font-black mt-2 ${kpi.color}`}>
            {value}
            {kpi.suffix ?? ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}
