'use client';

export interface CatalogFiltersState {
  from?: string;
  to?: string;
  estado?: string;
  tipo?: string;
  canal?: string;
  urgencia?: string;
  entity?: string;
  search?: string;
  page: number;
}

interface CatalogFiltersProps {
  filters: CatalogFiltersState;
  onChange: (filters: CatalogFiltersState) => void;
}

const estados = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'corregido', label: 'Corregido' },
  { value: 'enrutado', label: 'Enrutado' },
];

const tipos = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Peticion', label: 'Petición' },
  { value: 'Queja', label: 'Queja' },
  { value: 'Reclamo', label: 'Reclamo' },
  { value: 'Sugerencia', label: 'Sugerencia' },
  { value: 'Felicitacion', label: 'Felicitación' },
];

const canales = [
  { value: '', label: 'Todos los canales' },
  { value: 'web', label: 'Web' },
  { value: 'email', label: 'Email' },
  { value: 'escrito', label: 'Escrito' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'api_externa', label: 'API Externa' },
];

const urgencias = [
  { value: '', label: 'Todas las urgencias' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Media', label: 'Media' },
  { value: 'Baja', label: 'Baja' },
];

function updateFilter(
  filters: CatalogFiltersState,
  onChange: CatalogFiltersProps['onChange'],
  changes: Partial<CatalogFiltersState>,
) {
  onChange({ ...filters, ...changes, page: 1 });
}

export function CatalogFilters({ filters, onChange }: CatalogFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col">
        <label htmlFor="catalog-from" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Desde
        </label>
        <input
          id="catalog-from"
          type="date"
          value={filters.from || ''}
          onChange={(e) => updateFilter(filters, onChange, { from: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="catalog-to" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Hasta
        </label>
        <input
          id="catalog-to"
          type="date"
          value={filters.to || ''}
          onChange={(e) => updateFilter(filters, onChange, { to: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="catalog-estado" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Estado
        </label>
        <select
          id="catalog-estado"
          value={filters.estado || ''}
          onChange={(e) => updateFilter(filters, onChange, { estado: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {estados.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="catalog-tipo" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Tipo
        </label>
        <select
          id="catalog-tipo"
          value={filters.tipo || ''}
          onChange={(e) => updateFilter(filters, onChange, { tipo: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {tipos.map((tipo) => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="catalog-canal" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Canal
        </label>
        <select
          id="catalog-canal"
          value={filters.canal || ''}
          onChange={(e) => updateFilter(filters, onChange, { canal: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {canales.map((canal) => (
            <option key={canal.value} value={canal.value}>
              {canal.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="catalog-urgencia" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Urgencia
        </label>
        <select
          id="catalog-urgencia"
          value={filters.urgencia || ''}
          onChange={(e) => updateFilter(filters, onChange, { urgencia: e.target.value || undefined })}
          className="border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          {urgencias.map((urgencia) => (
            <option key={urgencia.value} value={urgencia.value}>
              {urgencia.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col min-w-[180px]">
        <label htmlFor="catalog-entity" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Entidad
        </label>
        <input
          id="catalog-entity"
          type="text"
          value={filters.entity || ''}
          onChange={(e) => updateFilter(filters, onChange, { entity: e.target.value || undefined })}
          placeholder="Buscar entidad"
          className="border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col min-w-[220px] flex-1">
        <label htmlFor="catalog-search" className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
          Texto
        </label>
        <input
          id="catalog-search"
          type="text"
          value={filters.search || ''}
          onChange={(e) => updateFilter(filters, onChange, { search: e.target.value || undefined })}
          placeholder="Buscar por tema, resumen o contenido"
          className="border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={() => onChange({ page: 1 })}
        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
