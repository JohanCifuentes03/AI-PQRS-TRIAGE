'use client';

import { useEffect, useState } from 'react';
import { fetchPqrsDetail } from '@/actions/pqrs.actions';
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
}

interface Props {
  data: PqrsRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export function InboxShell({ data, total, page, totalPages }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PqrsRecord | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    fetchPqrsDetail(selectedId).then((res) => setDetail(res.data));
  }, [selectedId]);

  return (
    <div className="flex gap-0">
      <div className="flex-1 min-w-0">
        <PqrsTable
          data={data}
          total={total}
          page={page}
          totalPages={totalPages}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>
      <PqrsDetailPanel
        detail={detail}
        onDone={async () => {
          if (!selectedId) return;
          const refreshed = await fetchPqrsDetail(selectedId);
          setDetail(refreshed.data);
        }}
      />
    </div>
  );
}
