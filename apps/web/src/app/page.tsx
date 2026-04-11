export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Civic Sentinel
        </h1>
        <p className="text-gray-600 mb-8">
          Sistema de triage inteligente para PQRS
        </p>
        <div className="space-x-4">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-900 text-white rounded hover:bg-blue-800"
          >
            Bandeja de Solicitudes
          </a>
          <a
            href="/analytics"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
          >
            Analytics
          </a>
        </div>
      </div>
    </div>
  );
}
