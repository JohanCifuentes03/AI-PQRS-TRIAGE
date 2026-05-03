'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { ReactNode } from 'react';

type TabKey = 'email' | 'api';

type EmailReaderConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  folder: string;
  frequencyMinutes: number;
  hasPassword?: boolean;
  state?: string;
};

type EmailReaderStatus = {
  configured: boolean;
  polling: boolean;
  state: string;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  frequencyMinutes: number | null;
};

type ApiInfo = {
  webhookUrl: string;
  apiKeyRequired: boolean;
  apiKey: string | null;
  apiKeyValue?: string;
};

const frequencyOptions = [1, 2, 5, 10];
const inputClassName =
  'w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#191C1D] outline-none transition focus:border-[#001834]';
const primaryButtonClassName =
  'px-5 py-2.5 bg-[#001834] text-white text-sm font-semibold transition hover:bg-[#002856] disabled:opacity-50';
const secondaryButtonClassName =
  'px-5 py-2.5 border border-gray-300 bg-white text-[#191C1D] text-sm font-semibold transition hover:bg-[#F8F9FA] disabled:opacity-50';

const fieldRows = [
  ['texto', 'string', 'Contenido principal de la PQRS a procesar.'],
  ['remitente', 'string', 'Correo o identificador del remitente.'],
  ['asunto', 'string', 'Resumen corto del caso.'],
  ['canalOrigen', 'string', 'Identificador del canal externo que originó la solicitud.'],
  ['adjuntos', 'array', 'Metadatos de adjuntos enviados por la integración.'],
];

export function IntegrationsConsole({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('email');
  const [isPending, startTransition] = useTransition();
  const [emailConfig, setEmailConfig] = useState<EmailReaderConfig>({
    host: '',
    port: 993,
    user: '',
    password: '',
    folder: 'INBOX',
    frequencyMinutes: 5,
  });
  const [emailStatus, setEmailStatus] = useState<EmailReaderStatus>({
    configured: false,
    polling: false,
    state: 'No configurado',
    lastSyncAt: null,
    lastSyncError: null,
    frequencyMinutes: null,
  });
  const [apiInfo, setApiInfo] = useState<ApiInfo>({
    webhookUrl: '',
    apiKeyRequired: false,
    apiKey: null,
  });
  const [notice, setNotice] = useState<string>('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);

    startTransition(async () => {
      const [configResponse, statusResponse, apiResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/email-reader/config`),
        fetch(`${apiBaseUrl}/email-reader/status`),
        fetch(`${apiBaseUrl}/ingest/api-info`),
      ]);

      const [configPayload, statusPayload, apiPayload] = await Promise.all([
        configResponse.json(),
        statusResponse.json(),
        apiResponse.json(),
      ]);

      if (configPayload.success && configPayload.data) {
        setEmailConfig((current: EmailReaderConfig) => ({
          ...current,
          ...configPayload.data,
          password: '',
        }));
      }

      if (statusPayload.success) {
        setEmailStatus(statusPayload.data);
      }

      if (apiPayload.success) {
        setApiInfo(apiPayload.data);
      }
    });
  }, [apiBaseUrl]);

  const webhookUrl = useMemo(() => {
    if (apiInfo.webhookUrl) {
      return apiInfo.webhookUrl;
    }

    return `${origin.replace(':3000', ':4000')}/ingest/webhook`;
  }, [apiInfo.webhookUrl, origin]);

  const curlExample = useMemo(() => {
    const tokenValue = apiInfo.apiKeyValue || '<API_KEY>';

    return [
      `curl -X POST "${webhookUrl}" \\`,
      '  -H "Content-Type: application/json" \\',
      `  -H "X-API-Key: ${tokenValue}" \\`,
      "  -d '{",
      '    "texto": "Solicito revisión de la respuesta emitida sobre el mantenimiento del parque del barrio.",',
      '    "remitente": "integracion@entidad.gov.co",',
      '    "asunto": "Seguimiento PQRS mantenimiento parque",',
      '    "canalOrigen": "crm_municipal",',
      '    "adjuntos": [{ "nombre": "radicado.pdf", "tipo": "application/pdf" }]',
      "  }'",
    ].join('\n');
  }, [apiInfo.apiKeyValue, webhookUrl]);

  const updateEmailField = <K extends keyof EmailReaderConfig>(key: K, value: EmailReaderConfig[K]) => {
    setEmailConfig((current) => ({ ...current, [key]: value }));
  };

  const runEmailAction = async (endpoint: string, body?: Record<string, unknown>) => {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.data?.error || payload.message || 'No se pudo completar la operación');
    }

    return payload.data;
  };

  const refreshState = async () => {
    const [statusResponse, apiResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/email-reader/status`),
      fetch(`${apiBaseUrl}/ingest/api-info`),
    ]);
    const [statusPayload, apiPayload] = await Promise.all([statusResponse.json(), apiResponse.json()]);

    if (statusPayload.success) {
      setEmailStatus(statusPayload.data);
    }

    if (apiPayload.success) {
      setApiInfo(apiPayload.data);
    }
  };

  const handleTest = () => {
    startTransition(async () => {
      try {
        const data = await runEmailAction('/email-reader/test', emailConfig);
        setEmailStatus((current) => ({ ...current, state: data.state, lastSyncError: data.error || null }));
        setNotice(data.success ? 'Conexión validada correctamente.' : data.error || 'La conexión no pudo validarse.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo validar la conexión.');
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const data = await runEmailAction('/email-reader/config', emailConfig);
        setEmailConfig((current) => ({ ...current, ...data, password: '' }));
        await refreshState();
        setNotice('Configuración guardada correctamente.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo guardar la configuración.');
      }
    });
  };

  const handleSync = () => {
    startTransition(async () => {
      try {
        const data = await runEmailAction('/email-reader/sync');
        await refreshState();
        setNotice(`Sincronización completada. Correos procesados: ${data.processed}.`);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo sincronizar.');
      }
    });
  };

  const handleRegenerate = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/ingest/regenerate-api-key`, { method: 'POST' });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'No se pudo regenerar el token.');
        }

        setApiInfo(payload.data);
        setNotice('Token regenerado correctamente. Copie el nuevo valor y actualice sus integraciones.');
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'No se pudo regenerar el token.');
      }
    });
  };

  const handleCopyToken = async () => {
    if (!apiInfo.apiKeyValue) {
      setNotice('Regenera el token para obtener un valor copiable.');
      return;
    }

    await navigator.clipboard.writeText(apiInfo.apiKeyValue);
    setNotice('Token copiado al portapapeles.');
  };

  const statusTone =
    emailStatus.state === 'Conectado'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : emailStatus.state === 'Error de conexion'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 bg-white">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'email', label: 'Correo Entrante' },
            { key: 'api', label: 'API Externa' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-[#BB0013] text-[#001834]'
                  : 'text-[#43474F] hover:bg-[#F8F9FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'email' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className={`inline-flex items-center border px-3 py-1.5 text-sm font-semibold ${statusTone}`}>
                  {emailStatus.state}
                </div>
                <div className="text-sm text-gray-500">
                  {emailStatus.lastSyncAt
                    ? `Última lectura: ${new Date(emailStatus.lastSyncAt).toLocaleString('es-CO')}`
                    : 'Aún no se ha ejecutado una lectura.'}
                </div>
                <div className="text-sm text-gray-500">
                  {emailStatus.polling ? 'Lectura programada activa' : 'Lectura programada inactiva'}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Host IMAP">
                  <input
                    value={emailConfig.host}
                    onChange={(event) => updateEmailField('host', event.target.value)}
                    placeholder="imap.gmail.com"
                    className={inputClassName}
                  />
                </Field>
                <Field label="Puerto">
                  <input
                    type="number"
                    value={emailConfig.port}
                    onChange={(event) => updateEmailField('port', Number(event.target.value) || 993)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Usuario">
                  <input
                    value={emailConfig.user}
                    onChange={(event) => updateEmailField('user', event.target.value)}
                    placeholder="pqrs@entidad.gov.co"
                    className={inputClassName}
                  />
                </Field>
                <Field label="App password">
                  <input
                    type="password"
                    value={emailConfig.password}
                    onChange={(event) => updateEmailField('password', event.target.value)}
                    placeholder={emailConfig.hasPassword ? '********' : 'Ingrese la App Password'}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Carpeta">
                  <input
                    value={emailConfig.folder}
                    onChange={(event) => updateEmailField('folder', event.target.value)}
                    className={inputClassName}
                  />
                </Field>
                <Field label="Frecuencia de lectura">
                  <select
                    value={emailConfig.frequencyMinutes}
                    onChange={(event) => updateEmailField('frequencyMinutes', Number(event.target.value))}
                    className={inputClassName}
                  >
                    {frequencyOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}min
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <p className="text-sm text-gray-500">
                Se recomienda usar una App Password para Gmail. Configurela en{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#001834] underline"
                >
                  https://myaccount.google.com/apppasswords
                </a>
              </p>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleTest} disabled={isPending} className={primaryButtonClassName}>
                  Probar conexion
                </button>
                <button type="button" onClick={handleSave} disabled={isPending} className={secondaryButtonClassName}>
                  Guardar configuracion
                </button>
                <button type="button" onClick={handleSync} disabled={isPending} className={secondaryButtonClassName}>
                  Sincronizar ahora
                </button>
              </div>

              {emailStatus.lastSyncError ? <p className="text-sm text-rose-700">{emailStatus.lastSyncError}</p> : null}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-4 border border-gray-200 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Webhook URL</p>
                    <p className="mt-2 break-all text-sm font-semibold text-[#001834]">{webhookUrl}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Token actual</p>
                    <p className="mt-2 text-sm font-semibold text-[#191C1D]">{apiInfo.apiKey || 'No configurado'}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={handleCopyToken} className={secondaryButtonClassName}>
                      Copiar token
                    </button>
                    <button type="button" onClick={handleRegenerate} disabled={isPending} className={primaryButtonClassName}>
                      Regenerar token
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 bg-[#F8F9FA] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Requisitos</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#43474F]">
                    <li>Use el header X-API-Key cuando exista un token configurado.</li>
                    <li>El campo texto debe contener al menos 10 caracteres.</li>
                    <li>Adjuntos se registran como metadatos y se limitan a nombre y tipo.</li>
                  </ul>
                </div>
              </div>

              <div className="border border-gray-200 bg-[#0F172A] p-5 text-sm text-slate-100">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ejemplo curl</p>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono">{curlExample}</pre>
              </div>

              <div className="border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-[#F8F9FA] text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Campo</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {fieldRows.map(([field, type, description]) => (
                      <tr key={field}>
                        <td className="px-4 py-3 font-semibold text-[#001834]">{field}</td>
                        <td className="px-4 py-3 text-[#43474F]">{type}</td>
                        <td className="px-4 py-3 text-[#43474F]">{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {notice ? <p className="text-sm text-[#43474F]">{notice}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</span>
      {children}
    </label>
  );
}
