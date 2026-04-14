'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchPqrsDetail, fetchPqrsList } from '@/actions/pqrs.actions';
import { PqrsTable } from './pqrs-table';
import { PqrsDetailPanel } from './pqrs-detail-panel';

interface PqrsRecord {
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
  updatedAt?: string;
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
}

interface Props {
  data: PqrsRecord[];
  page: number;
  totalPages: number;
}

export function InboxShell({ data, page, totalPages }: Props) {
  const [rows, setRows] = useState<PqrsRecord[]>(data);
  const [selectedId, setSelectedId] = useState<string | null>(data[0]?.id || null);
  const [detail, setDetail] = useState<PqrsRecord | null>(null);
  const [toast, setToast] = useState<string>('');

  useEffect(() => {
    setRows(data);
  }, [data]);

  useEffect(() => {
    if (!selectedId) return;
    fetchPqrsDetail(selectedId)
      .then((res) => setDetail(res.data as PqrsRecord))
      .catch(() => setDetail(null));
  }, [selectedId]);

  const effectiveTotal = useMemo(() => rows.length, [rows]);

  const handleActionDone = async (nextState?: string) => {
    if (!selectedId) return;

    const refreshed = await fetchPqrsDetail(selectedId);
    const updated = refreshed.data as PqrsRecord;
    setDetail(updated);

    if (nextState && nextState !== 'pendiente') {
      setRows((prev) => prev.filter((r) => r.id !== selectedId));
      setToast(`PQRS ${nextState} y retirada de la bandeja pendiente.`);
      const next = rows.find((r) => r.id !== selectedId);
      setSelectedId(next?.id || null);
    } else {
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setToast('Cambios guardados correctamente.');
    }

    setTimeout(() => setToast(''), 2200);

    await fetchPqrsList({ estado: 'pendiente', page, limit: 20 }).catch(() => undefined);
  };

  return (
    <div className="flex gap-0 relative">
      {toast ? (
        <div className="absolute right-4 top-4 z-40 bg-[#001834] text-white text-xs font-bold px-3 py-2 rounded shadow">
          {toast}
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <PqrsTable
          data={rows}
          total={effectiveTotal}
          page={page}
          totalPages={Math.max(1, totalPages)}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>
      <PqrsDetailPanel detail={detail} onActionDone={handleActionDone} />
    </div>
  );
}
