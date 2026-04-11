import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { InboxShell } from '@/components/inbox-shell';
import { fetchPqrsList } from '@/actions/pqrs.actions';

export default async function HomePage() {
  const pqrs = await fetchPqrsList({ estado: 'pendiente', page: 1, limit: 20 });

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
