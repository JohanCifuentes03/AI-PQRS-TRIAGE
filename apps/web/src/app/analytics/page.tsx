import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { fetchPqrsList } from '@/actions/pqrs.actions';

export default async function AnalyticsPage() {
  const all = await fetchPqrsList({ page: 1, limit: 100 });
  const records = all.data;

  const byTema = records.reduce<Record<string, number>>((acc, item) => {
    const key = item.tema || 'Sin tema';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const approved = records.filter((r) => r.estado === 'aprobado').length;
  const corrected = records.filter((r) => r.estado === 'corregido').length;
  const total = records.length || 1;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D]">
      <Sidebar />
      <Topbar />

      <main className="ml-64 mt-16 p-8 min-h-screen space-y-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">Analytics</h2>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Panel de patrones ciudadanos: distribucion por tema, volumen y calidad de clasificacion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 border border-gray-200">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total PQRS</p>
            <p className="text-4xl font-black mt-2">{records.length}</p>
          </div>
          <div className="bg-white p-6 border border-gray-200">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Aprobadas</p>
            <p className="text-4xl font-black mt-2">{approved}</p>
          </div>
          <div className="bg-white p-6 border border-gray-200">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Corregidas</p>
            <p className="text-4xl font-black mt-2">{corrected}</p>
          </div>
          <div className="bg-white p-6 border border-gray-200">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Tasa aprobacion</p>
            <p className="text-4xl font-black mt-2">{Math.round((approved / total) * 100)}%</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-xl font-bold mb-4">Distribucion por tema</h3>
          <div className="space-y-3">
            {Object.entries(byTema)
              .sort((a, b) => b[1] - a[1])
              .map(([tema, count]) => (
                <div key={tema}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{tema}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 bg-[#001834]"
                      style={{ width: `${Math.max((count / total) * 100, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
