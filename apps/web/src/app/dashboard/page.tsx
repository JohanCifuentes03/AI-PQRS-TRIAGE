import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D]">
      <Sidebar />
      <Topbar />

      <main className="ml-64 mt-16 p-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight">Dashboard</h2>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Vista general del sistema de triage PQRS: indicadores clave, distribuciones y tendencias.
          </p>
        </div>
        <DashboardContent />
      </main>
    </div>
  );
}
