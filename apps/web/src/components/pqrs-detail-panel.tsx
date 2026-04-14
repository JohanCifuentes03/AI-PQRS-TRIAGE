'use client';

import { useMemo, useState, useTransition } from 'react';
import { approvePqrs, correctPqrs, fetchPqrsTrace, routePqrs } from '@/actions/pqrs.actions';

interface PqrsDetail {
  id: string;
  texto: string;
  sourceType?: string | null;
  pipelineTrace?: {
    runId: string;
    startedAt: string;
    finishedAt: string;
    totalMs: number;
    steps: Array<{
      agent: string;
      status: 'ok' | 'fallback' | 'error';
      durationMs: number;
      output: Record<string, unknown>;
    }>;
  } | null;
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
  updatedAt?: string;
}

interface Props {
  detail: PqrsDetail | null;
  onActionDone: (nextState?: string) => Promise<void>;
}

function statusBadgeClass(estado: string) {
  if (estado === 'aprobado') return 'bg-emerald-100 text-emerald-800';
  if (estado === 'corregido') return 'bg-amber-100 text-amber-800';
  if (estado === 'enrutado') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

export function PqrsDetailPanel({ detail, onActionDone }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [showTrace, setShowTrace] = useState(false);
  const [trace, setTrace] = useState<Awaited<ReturnType<typeof fetchPqrsTrace>>['data'] | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const fields = useMemo(
    () => [
      ['Tipo', 'tipo', detail?.tipo ?? 'N/A'],
      ['Tema', 'tema', detail?.tema ?? 'N/A'],
      ['Subtema', 'subtema', detail?.subtema ?? 'N/A'],
      ['Urgencia', 'urgencia', detail?.urgencia ?? 'N/A'],
      ['Entidad', 'entidad', detail?.entidad ?? 'N/A'],
      ['Riesgo', 'riesgo', detail?.riesgo ?? 'N/A'],
    ] as const,
    [detail],
  );

  if (!detail) {
    return (
      <aside className="w-full lg:w-[450px] bg-white border-l border-gray-200 p-6">
        <p className="text-gray-500">Selecciona una PQRS para ver el detalle.</p>
      </aside>
    );
  }

  const runAction = async (fn: () => Promise<unknown>, okMsg: string, nextState?: string) => {
    setMessage('Procesando accion...');
    try {
      await fn();
      setMessage(okMsg);
      await onActionDone(nextState);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la accion');
    }
  };

  const onApprove = () => {
    startTransition(async () => {
      await runAction(
        () => approvePqrs(detail.id, 'admin-user'),
        'PQRS aprobada correctamente.',
        'aprobado',
      );
    });
  };

  const onRoute = () => {
    startTransition(async () => {
      await runAction(
        () => routePqrs(detail.id, 'admin-user'),
        'PQRS enrutada correctamente.',
        'enrutado',
      );
    });
  };

  const onSaveCorrection = () => {
    startTransition(async () => {
      await runAction(
        () => correctPqrs(detail.id, 'admin-user', form),
        'Correccion guardada correctamente.',
        'corregido',
      );
      setEditing(false);
      setForm({});
    });
  };

  const onOpenTrace = () => {
    startTransition(async () => {
      const payload = await fetchPqrsTrace(detail.id);
      setTrace(payload.data);
      setShowTrace(true);
    });
  };

  return (
    <aside className="w-full lg:w-[450px] bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-black text-[#191C1D]">Detalle PQRS</h3>
          <span className={`text-xs px-2 py-1 rounded font-bold ${statusBadgeClass(detail.estado)}`}>
            {detail.estado}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 font-mono">#{detail.id}</p>
        <p className="text-xs text-gray-500 mt-1">Origen: {detail.sourceType || 'manual_text'}</p>
      </div>

      <div className="space-y-5">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Texto original</p>
          <p className="text-sm leading-relaxed text-[#191C1D] bg-[#F8F9FA] p-4 rounded">{detail.texto}</p>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Sugerencia IA</p>
            <button
              onClick={onOpenTrace}
              className="text-xs font-bold text-blue-700 hover:underline"
              disabled={isPending}
            >
              Ver ejecucion IA
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {fields.map(([label, key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-500">{label}</span>
                <div className="col-span-2">
                  {editing ? (
                    <input
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      defaultValue={String(value)}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  ) : (
                    <span className="font-semibold text-[#191C1D]">{value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Resumen y confianza</p>
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
              {isPending ? 'Procesando...' : 'Aprobar'}
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
              {isPending ? 'Procesando...' : 'Enrutar'}
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
              onClick={() => {
                setEditing(false);
                setForm({});
              }}
              className="w-full py-2.5 bg-[#F3F4F5] text-[#191C1D] font-bold rounded"
            >
              Cancelar
            </button>
          </>
        )}
      </div>

      {message ? <p className="mt-4 text-xs text-gray-600">{message}</p> : null}

      {showTrace && trace ? (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-black">Ejecucion Multiagente IA</h4>
              <button onClick={() => setShowTrace(false)} className="text-sm font-bold text-gray-600">
                Cerrar
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Run ID: {trace.pipelineTrace?.runId || 'N/A'}</p>
            <div className="space-y-3">
              {(trace.pipelineTrace?.steps || []).map((step, idx) => (
                <div key={`${step.agent}-${idx}`} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm">{step.agent}</p>
                    <span
                      className={`text-[10px] px-2 py-1 rounded font-bold ${
                        step.status === 'ok'
                          ? 'bg-emerald-100 text-emerald-700'
                          : step.status === 'fallback'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {step.status} - {step.durationMs}ms
                    </span>
                  </div>
                  <pre className="mt-2 text-xs bg-gray-50 p-2 overflow-x-auto">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h5 className="font-bold mb-2">Audit log reciente</h5>
              {(trace.auditLogs || []).length === 0 ? (
                <p className="text-xs text-gray-500">Sin acciones registradas.</p>
              ) : (
                <ul className="space-y-2">
                  {trace.auditLogs.map((log) => (
                    <li key={log.id} className="text-xs border border-gray-200 rounded p-2">
                      <strong>{log.accion}</strong> por {log.usuario} -{' '}
                      {new Date(log.createdAt).toLocaleString('es-CO')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
