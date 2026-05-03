import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { CatalogContent } from '@/components/catalog/catalog-content';

export default async function CatalogPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D]">
      <Sidebar />
      <Topbar />
      <main className="ml-64 mt-16 p-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight">Catálogo PQRS</h2>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Historial completo de PQRS procesadas. Usa los filtros para buscar y analizar.
          </p>
        </div>
        <CatalogContent />
      </main>
    </div>
  );
}
