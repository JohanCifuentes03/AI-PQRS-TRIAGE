'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPqrsList } from '@/actions/pqrs.actions';
import { CatalogFilters, type CatalogFiltersState } from './catalog-filters';
import { CatalogTable, type CatalogMeta, type CatalogRecord } from './catalog-table';

const PAGE_SIZE = 20;

function normalizeText(value: string | null | undefined) {
  return (value || '').toLocaleLowerCase();
}

function matchesDateRange(record: CatalogRecord, from?: string, to?: string) {
  const createdAt = new Date(record.createdAt).getTime();
  if (Number.isNaN(createdAt)) return false;

  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
  const toTime = to ? new Date(`${to}T23:59:59`).getTime() : null;

  if (fromTime && createdAt < fromTime) return false;
  if (toTime && createdAt > toTime) return false;
  return true;
}

function exportSelection(rows: CatalogRecord[], format: 'csv' | 'json') {
  const filename = `catalogo-pqrs-${new Date().toISOString().slice(0, 10)}.${format}`;
  const content =
    format === 'json'
      ? JSON.stringify(rows, null, 2)
      : [
          ['id', 'fecha', 'tipo', 'tema', 'urgencia', 'canal', 'estado', 'entidad', 'resumen'].join(','),
          ...rows.map((row) =>
            [
              row.id,
              row.createdAt,
              row.tipo || '',
              row.tema || '',
              row.urgencia || '',
              row.canal,
              row.estado,
              row.entidad || '',
              (row.resumen || row.texto).replaceAll('"', '""'),
            ]
              .map((value) => `"${value}"`)
              .join(','),
          ),
        ].join('\n');

  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function CatalogCards({
  data,
  selectedIds,
  onSelectionChange,
}: {
  data: CatalogRecord[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {data.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <div key={item.id} className="bg-white border border-gray-200 p-5 hover:border-[#003A7D] transition-colors">
            <div className="flex items-start gap-3 justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{item.estado}</p>
                <h3 className="text-lg font-bold mt-1">{item.tema || 'Sin tema'}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.tipo || 'Sin tipo'} · {item.entidad || 'Sin entidad'}</p>
              </div>
              <input
                type="checkbox"
                aria-label={`Seleccionar ${item.id}`}
                checked={selected}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectionChange([...selectedIds, item.id]);
                    return;
                  }

                  onSelectionChange(selectedIds.filter((id) => id !== item.id));
                }}
                className="h-4 w-4 mt-1"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-2 py-1 bg-gray-100 text-gray-700">{item.canal}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700">{item.urgencia || 'Sin urgencia'}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700">{new Date(item.createdAt).toLocaleDateString('es-CO')}</span>
            </div>
            <p className="mt-4 text-sm text-gray-600 line-clamp-3">{item.resumen || item.texto}</p>
            <div className="mt-4 font-mono text-xs text-[#254873]">#{item.id.slice(0, 8).toUpperCase()}</div>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="bg-white border border-gray-200 p-12 text-center text-gray-500 xl:col-span-2">
          No se encontraron PQRS
        </div>
      )}
    </div>
  );
}

export function CatalogContent() {
  const [filters, setFilters] = useState<CatalogFiltersState>({ page: 1 });
  const [rows, setRows] = useState<CatalogRecord[]>([]);
  const [meta, setMeta] = useState<CatalogMeta>({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = {
        estado: filters.estado,
        urgencia: filters.urgencia,
        tipo: filters.tipo,
        canal: filters.canal,
        page: filters.page,
        limit: PAGE_SIZE,
      };
      const response = await fetchPqrsList(query);
      setRows(response.data);
      setMeta(response.meta);
    } catch {
      setRows([]);
      setMeta({ total: 0, page: filters.page, limit: PAGE_SIZE, totalPages: 1 });
      setError('No fue posible cargar el catálogo en este momento.');
    } finally {
      setLoading(false);
    }
  }, [filters.canal, filters.estado, filters.page, filters.tipo, filters.urgencia]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setSelectedIds([]);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const entity = normalizeText(filters.entity);
    const search = normalizeText(filters.search);

    return rows.filter((row) => {
      if (!matchesDateRange(row, filters.from, filters.to)) return false;
      if (entity && !normalizeText(row.entidad).includes(entity)) return false;
      if (!search) return true;

      const haystack = [row.tema, row.subtema, row.resumen, row.texto, row.entidad]
        .map((value) => normalizeText(value))
        .join(' ');

      return haystack.includes(search);
    });
  }, [filters.entity, filters.from, filters.search, filters.to, rows]);

  const selectedRows = useMemo(
    () => filteredRows.filter((row) => selectedIds.includes(row.id)),
    [filteredRows, selectedIds],
  );

  return (
    <div className="space-y-6">
      <CatalogFilters filters={filters} onChange={setFilters} />

      <div className="bg-white border border-gray-200 p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#191C1D]">{meta.total} PQRS en el archivo</p>
          <p className="text-sm text-gray-500">
            {filteredRows.length} visibles en la página actual · {selectedRows.length} seleccionadas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-sm border transition-colors ${viewMode === 'table' ? 'bg-[#001834] text-white border-[#001834]' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Tabla
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 text-sm border transition-colors ${viewMode === 'cards' ? 'bg-[#001834] text-white border-[#001834]' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Tarjetas
          </button>
          <button
            type="button"
            disabled={selectedRows.length === 0}
            onClick={() => exportSelection(selectedRows, 'csv')}
            className="px-4 py-2 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Exportar selección CSV
          </button>
          <button
            type="button"
            disabled={selectedRows.length === 0}
            onClick={() => exportSelection(selectedRows, 'json')}
            className="px-4 py-2 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Exportar selección JSON
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 p-12 text-center text-gray-500">
          Cargando catálogo...
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 p-12 text-center text-red-700">{error}</div>
      ) : viewMode === 'table' ? (
        <CatalogTable
          data={filteredRows}
          meta={meta}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      ) : (
        <CatalogCards data={filteredRows} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
      )}
    </div>
  );
}
