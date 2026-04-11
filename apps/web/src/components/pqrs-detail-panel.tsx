'use client';

import { useState, useTransition } from 'react';
import { approvePqrs, correctPqrs, routePqrs } from '@/actions/pqrs.actions';

interface PqrsDetail {
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

const fieldGetters = {
  tipo: (d: PqrsDetail) => d.tipo,
  tema: (d: PqrsDetail) => d.tema,
  subtema: (d: PqrsDetail) => d.subtema,
  urgencia: (d: PqrsDetail) => d.urgencia,
  entidad: (d: PqrsDetail) => d.entidad,
  riesgo: (d: PqrsDetail) => d.riesgo,
} as const;

type EditableField = keyof typeof fieldGetters;

interface Props {
  detail: PqrsDetail | null;
  onDone: () => void;
}

export function PqrsDetailPanel({ detail, onDone }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  if (!detail) {
    return (
      <aside className="w-full lg:w-[420px] bg-white border-l border-gray-200 p-6">
        <p className="text-gray-500">Selecciona una PQRS para ver el detalle.</p>
      </aside>
    );
  }

  const onApprove = () => {
    startTransition(async () => {
      await approvePqrs(detail.id, 'admin-user');
      onDone();
    });
  };

  const onRoute = () => {
    startTransition(async () => {
      await routePqrs(detail.id, 'admin-user');
      onDone();
    });
  };

  const onSaveCorrection = () => {
    startTransition(async () => {
      await correctPqrs(detail.id, 'admin-user', form);
      setEditing(false);
      onDone();
    });
  };

  return (
    <aside className="w-full lg:w-[420px] bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-xl font-black text-[#191C1D]">Detalle PQRS</h3>
        <p className="text-xs text-gray-500 mt-1 font-mono">#{detail.id}</p>
      </div>

      <div className="space-y-5">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Texto original
          </p>
          <p className="text-sm leading-relaxed text-[#191C1D] bg-[#F8F9FA] p-4 rounded">
            {detail.texto}
          </p>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Sugerencia IA
          </p>
          <div className="space-y-2 text-sm">
            {([
              ['Tipo', 'tipo'],
              ['Tema', 'tema'],
              ['Subtema', 'subtema'],
              ['Urgencia', 'urgencia'],
              ['Entidad', 'entidad'],
              ['Riesgo', 'riesgo'],
            ] as const).map(([label, key]) => (
              <div key={key} className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-500">{label}</span>
                <div className="col-span-2">
                  {editing ? (
                    <input
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      defaultValue={fieldGetters[key as EditableField](detail) || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  ) : (
                    <span className="font-semibold text-[#191C1D]">
                      {fieldGetters[key as EditableField](detail) || 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Resumen y confianza
          </p>
          <p className="text-sm text-[#191C1D]">{detail.resumen || 'Sin resumen'}</p>
          <p className="text-xs text-gray-500 mt-1">
            Confianza: {detail.confianza ? `${Math.round(detail.confianza * 100)}%` : 'N/A'}
          </p>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {!editing ? (
          <>
            <button
              onClick={onApprove}
              disabled={isPending}
              className="w-full py-2.5 bg-[#001834] text-white font-bold rounded hover:bg-[#002d57] disabled:opacity-60"
            >
              Aprobar
            </button>
            <button
              onClick={() => setEditing(true)}
              className="w-full py-2.5 bg-[#F3F4F5] text-[#191C1D] font-bold rounded hover:bg-[#E7E8E9]"
            >
              Corregir
            </button>
            <button
              onClick={onRoute}
              disabled={isPending}
              className="w-full py-2.5 bg-[#BB0013] text-white font-bold rounded hover:opacity-90 disabled:opacity-60"
            >
              Enrutar
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSaveCorrection}
              disabled={isPending}
              className="w-full py-2.5 bg-[#001834] text-white font-bold rounded hover:bg-[#002d57] disabled:opacity-60"
            >
              Guardar correccion
            </button>
            <button
              onClick={() => setEditing(false)}
              className="w-full py-2.5 bg-[#F3F4F5] text-[#191C1D] font-bold rounded"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
