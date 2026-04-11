'use client';

import { useState } from 'react';

interface PqrsRecord {
  id: string;
  texto: string;
  canal: string;
  tipo: string | null;
  tema: string | null;
  subtema: string | null;
  urgencia: string | null;
  entidad: string | null;
  resumen: string | null;
  confianza: number | null;
  estado: string;
  createdAt: string;
}

interface PqrsTableProps {
  data: PqrsRecord[];
  total: number;
  page: number;
  totalPages: number;
  onSelect: (id: string) => void;
}

function UrgencyBadge({ urgencia }: { urgencia: string | null }) {
  if (urgencia === 'Alta') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E71520] text-white text-[10px] font-black uppercase border-l-4 border-white/30">
        <span className="material-symbols-outlined text-[12px]">priority_high</span>
        Alta
      </div>
    );
  }
  if (urgencia === 'Media') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFDBC9] text-[#331200] text-[10px] font-black uppercase">
        <span className="material-symbols-outlined text-[12px]">stat_1</span>
        Media
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E1E3E4] text-[#43474F] text-[10px] font-black uppercase">
      <span className="material-symbols-outlined text-[12px]">stat_minus_1</span>
      Baja
    </div>
  );
}

export function PqrsTable({ data, total, page, totalPages, onSelect }: PqrsTableProps) {
  const [filterUrgencia, setFilterUrgencia] = useState<string | null>(null);

  const filtered = filterUrgencia
    ? data.filter((p) => p.urgencia === filterUrgencia)
    : data;

  return (
    <div>
      <div className="bg-[#F3F4F5] p-6 mb-6 flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Filtrar por Urgencia
          </span>
          <div className="flex gap-2">
            {['Alta', 'Media', 'Baja'].map((u) => (
              <button
                key={u}
                onClick={() => setFilterUrgencia(filterUrgencia === u ? null : u)}
                className={`px-4 py-1.5 text-xs font-bold transition-all ${
                  filterUrgencia === u
                    ? 'bg-white border-2 border-[#BB0013] text-[#BB0013]'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {u === 'Alta' ? 'Alta Prioridad' : u}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">
            Mostrando {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} de {total}
          </span>
          <span className="text-xs text-gray-500">Pagina {page} de {totalPages}</span>
        </div>
      </div>

      <div className="bg-[#F3F4F5] overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#E7E8E9]">
              <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                ID
              </th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                Clasificacion
              </th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                Descripcion
              </th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                Urgencia
              </th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                Entidad
              </th>
              <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right">
                Confianza
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {filtered.map((pqrs) => (
              <tr
                key={pqrs.id}
                onClick={() => onSelect(pqrs.id)}
                className="bg-white hover:bg-[#D4E3FF]/20 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-5 font-mono text-xs font-bold text-[#254873]">
                  #{pqrs.id.substring(0, 8).toUpperCase()}
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-bold text-[#191C1D] bg-[#E1E3E4] px-2 py-1">
                    {pqrs.tipo || 'Sin clasificar'}
                  </span>
                </td>
                <td className="px-6 py-5 max-w-xs">
                  <p className="text-sm font-bold text-[#191C1D] truncate">
                    {pqrs.resumen || pqrs.texto.substring(0, 60)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                    {pqrs.texto.substring(0, 100)}...
                  </p>
                </td>
                <td className="px-6 py-5">
                  <UrgencyBadge urgencia={pqrs.urgencia} />
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-bold text-[#191C1D]">
                    {pqrs.entidad || 'Sin asignar'}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="text-sm font-bold text-[#191C1D]">
                    {pqrs.confianza ? `${Math.round(pqrs.confianza * 100)}%` : '-'}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron PQRS
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
