'use client';

import { useMemo, useState } from 'react';
import { ChannelBadge } from '@/components/channel-badge';

export interface CatalogRecord {
  id: string;
  texto: string;
  canal: string;
  tipo: string | null;
  tema: string | null;
  subtema: string | null;
  urgencia: string | null;
  entidad: string | null;
  riesgo: string | null;
  resumen: string | null;
  confianza: number | null;
  estado: string;
  createdAt: string;
}

export interface CatalogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CatalogTableProps {
  data: CatalogRecord[];
  meta: CatalogMeta;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onPageChange: (page: number) => void;
}

type SortKey = 'createdAt' | 'id' | 'tipo' | 'tema' | 'urgencia' | 'canal' | 'estado' | 'entidad';

const urgenciaColors: Record<string, string> = {
  Alta: 'bg-red-100 text-red-800',
  Media: 'bg-yellow-100 text-yellow-800',
  Baja: 'bg-green-100 text-green-800',
};

const estadoColors: Record<string, string> = {
  pendiente: 'bg-orange-100 text-orange-800',
  aprobado: 'bg-green-100 text-green-800',
  corregido: 'bg-red-100 text-red-800',
  enrutado: 'bg-blue-100 text-blue-800',
};

const sortLabels: Record<SortKey, string> = {
  createdAt: 'Fecha',
  id: 'ID',
  tipo: 'Tipo',
  tema: 'Tema',
  urgencia: 'Urgencia',
  canal: 'Canal',
  estado: 'Estado',
  entidad: 'Entidad',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear());
  return `${day}/${month}/${year}`;
}

function truncateId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function compareValues(a: CatalogRecord, b: CatalogRecord, key: SortKey) {
  if (key === 'createdAt') {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  const left = String((a[key] as string | null) || '').toLocaleLowerCase();
  const right = String((b[key] as string | null) || '').toLocaleLowerCase();
  return left.localeCompare(right, 'es');
}

function SortButton({
  label,
  active,
  descending,
  onClick,
}: {
  label: string;
  active: boolean;
  descending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-extrabold uppercase tracking-widest hover:text-[#001834]"
    >
      {label}
      <span aria-hidden="true" className="text-[10px]">
        {active ? (descending ? '↓' : '↑') : '↕'}
      </span>
    </button>
  );
}

export function CatalogTable({
  data,
  meta,
  selectedIds,
  onSelectionChange,
  onPageChange,
}: CatalogTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [descending, setDescending] = useState(true);

  const sortedRows = useMemo(() => {
    const rows = [...data].sort((a, b) => compareValues(a, b, sortKey));
    return descending ? rows.reverse() : rows;
  }, [data, descending, sortKey]);

  const allSelected = sortedRows.length > 0 && sortedRows.every((row) => selectedIds.includes(row.id));

  const rangeStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const rangeEnd = Math.min(meta.page * meta.limit, meta.total);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setDescending((current) => !current);
      return;
    }

    setSortKey(key);
    setDescending(key === 'createdAt');
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left bg-gray-50">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos"
                  checked={allSelected}
                  onChange={(e) =>
                    onSelectionChange(e.target.checked ? sortedRows.map((row) => row.id) : [])
                  }
                  className="h-4 w-4"
                />
              </th>
              {(['createdAt', 'id', 'tipo', 'tema', 'urgencia', 'canal', 'estado', 'entidad'] as const).map((key) => (
                <th
                  key={key}
                  className="py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-bold"
                >
                  <SortButton
                    label={sortLabels[key]}
                    active={sortKey === key}
                    descending={descending}
                    onClick={() => toggleSort(key)}
                  />
                </th>
              ))}
              <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-500 font-bold">
                Resumen
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="py-4 px-4 align-top">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${item.id}`}
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectionChange([...selectedIds, item.id]);
                        return;
                      }

                      onSelectionChange(selectedIds.filter((id) => id !== item.id));
                    }}
                    className="h-4 w-4"
                  />
                </td>
                <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                <td className="py-4 px-4 font-mono text-xs font-bold text-[#254873] whitespace-nowrap">
                  {truncateId(item.id)}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">{item.tipo || '-'}</td>
                <td className="py-4 px-4 max-w-[180px] truncate">{item.tema || '-'}</td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-bold ${urgenciaColors[item.urgencia || ''] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {item.urgencia || '-'}
                  </span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <ChannelBadge canal={item.canal} />
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-bold capitalize ${estadoColors[item.estado] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {item.estado}
                  </span>
                </td>
                <td className="py-4 px-4 max-w-[180px] truncate">{item.entidad || '-'}</td>
                <td className="py-4 px-4 max-w-[280px]">
                  <p className="truncate text-gray-700">{item.resumen || item.texto}</p>
                </td>
              </tr>
            ))}
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron PQRS
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          Mostrando {rangeStart}-{rangeEnd} de {meta.total} resultados
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="px-3 py-2 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {meta.page} de {Math.max(meta.totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="px-3 py-2 text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
