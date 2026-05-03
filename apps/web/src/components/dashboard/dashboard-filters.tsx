'use client';

export interface DashboardFiltersState {
  from?: string;
  to?: string;
  canal?: string;
  tipo?: string;
  entidad?: string;
}

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  onChange: (filters: DashboardFiltersState) => void;
}

const canales = [
  { value: '', label: 'Todos los canales' },
  { value: 'web', label: 'Web' },
  { value: 'email', label: 'Email' },
  { value: 'escrito', label: 'Escrito' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'api_externa', label: 'API Externa' },
];

const tipos = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Peticion', label: 'Petición' },
  { value: 'Queja', label: 'Queja' },
  { value: 'Reclamo', label: 'Reclamo' },
  { value: 'Sugerencia', label: 'Sugerencia' },
  { value: 'Felicitacion', label: 'Felicitación' },
];

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Desde
        </label>
        <input
          type="date"
          value={filters.from || ''}
          onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Hasta
        </label>
        <input
          type="date"
          value={filters.to || ''}
          onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Canal
        </label>
        <select
          value={filters.canal || ''}
          onChange={(e) => onChange({ ...filters, canal: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {canales.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Tipo
        </label>
        <select
          value={filters.tipo || ''}
          onChange={(e) => onChange({ ...filters, tipo: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {tipos.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => onChange({})}
        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Limpiar filtros
      </button>

      <div className="ml-auto">
        <a
          href={`/api/reports-proxy?format=csv${filters.from ? '&from=' + filters.from : ''}${filters.to ? '&to=' + filters.to : ''}${filters.canal ? '&canal=' + filters.canal : ''}${filters.tipo ? '&tipo=' + filters.tipo : ''}${filters.entidad ? '&entidad=' + filters.entidad : ''}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#001834] text-white hover:bg-[#002856] transition-colors"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Exportar CSV
        </a>
      </div>
    </div>
  );
}
