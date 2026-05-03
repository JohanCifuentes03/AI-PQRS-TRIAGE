'use client';

import Link from 'next/link';

interface RecentPqrsTableProps {
  pqrs: Array<Record<string, unknown>>;
}

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

export function RecentPqrsTable({ pqrs }: RecentPqrsTableProps) {
  if (!pqrs.length) return null;

  return (
    <div className="bg-white border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">PQRS Recientes</h3>
        <Link href="/" className="text-sm text-[#003A7D] font-medium hover:underline">
          Ver todas →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="py-3 px-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                Fecha
              </th>
              <th className="py-3 px-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                Tipo
              </th>
              <th className="py-3 px-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                Urgencia
              </th>
              <th className="py-3 px-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                Canal
              </th>
              <th className="py-3 px-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                Estado
              </th>
              <th className="py-3 px-2 text-xs uppercase tracking-wider text-gray-500 font-bold">
                Resumen
              </th>
            </tr>
          </thead>
          <tbody>
            {pqrs.map((item) => {
              const urgencia = String(item.urgencia ?? '');
              const estado = String(item.estado ?? '');
              return (
                <tr key={String(item.id)} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-gray-600">
                    {item.createdAt
                      ? new Date(String(item.createdAt)).toLocaleDateString('es-CO')
                      : '-'}
                  </td>
                  <td className="py-3 px-2">{String(item.tipo ?? '-')}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold ${urgenciaColors[urgencia] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {urgencia || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-2 capitalize">{String(item.canal ?? '-')}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold ${estadoColors[estado] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {estado}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-600 max-w-xs truncate">
                    {String(item.resumen ?? '-')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
