import { IntegrationsConsole } from '@/components/integrations/integrations-console';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_SERVER_API_URL || 'http://localhost:4000';

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D]">
      <Sidebar />
      <Topbar />

      <main className="ml-64 mt-16 min-h-screen p-8">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight">Integraciones</h2>
          <p className="mt-2 max-w-3xl text-gray-600">
            Configure canales automáticos de entrada para correo IMAP y sistemas externos con webhook.
          </p>
        </div>

        <IntegrationsConsole apiBaseUrl={apiBaseUrl} />
      </main>
    </div>
  );
}
