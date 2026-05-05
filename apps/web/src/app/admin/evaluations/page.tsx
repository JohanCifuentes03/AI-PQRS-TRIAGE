import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { EvaluationRunSummary } from './components/EvaluationRunSummary';

export default async function EvaluationsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D]">
      <Sidebar />
      <Topbar />

      <main className="ml-64 mt-16 p-8 min-h-screen">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight">Evaluaciones</h2>
          <p className="text-gray-600 mt-2 max-w-3xl">
            Reportes automáticos del pipeline multiagente generados por consola. Esta vista solo lee el último JSON/CSV producido por <code>pnpm eval:run</code>.
          </p>
        </div>
        <EvaluationRunSummary />
      </main>
    </div>
  );
}
