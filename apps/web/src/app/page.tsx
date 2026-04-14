import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { InboxShell } from '@/components/inbox-shell';
import { IngestForm } from '@/components/ingest-form';
import { fetchPqrsList } from '@/actions/pqrs.actions';

export default async function HomePage() {
  let pqrs = {
    data: [],
    meta: { total: 0, page: 1, totalPages: 1 },
  } as {
    data: Array<{
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
    }>;
    meta: { total: number; page: number; totalPages: number };
  };

  try {
    pqrs = await fetchPqrsList({ estado: 'pendiente', page: 1, limit: 20 });
  } catch {
    // API may still be booting; render empty state instead of 500
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D]">
      <Sidebar />
      <Topbar />

      <main className="ml-64 mt-16 p-8 min-h-screen">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight">Bandeja de Solicitudes</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Revisa y clasifica PQRS ciudadanas. Valida la sugerencia IA antes de aprobar o corregir.
            </p>
          </div>
        </div>

        <IngestForm />

        <InboxShell
          data={pqrs.data}
          total={pqrs.meta.total}
          page={pqrs.meta.page}
          totalPages={pqrs.meta.totalPages}
        />
      </main>
    </div>
  );
}
