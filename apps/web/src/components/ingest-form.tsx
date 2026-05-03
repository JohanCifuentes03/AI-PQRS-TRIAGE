'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';

export function IngestForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');
  const [texto, setTexto] = useState('');
  const [fileAttached, setFileAttached] = useState(false);

  const canal = texto.trim().length > 0 ? 'presencial' : (fileAttached ? 'escrito' : 'presencial');

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      setMessage('Procesando...');
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setMessage(payload.message || 'No se pudo procesar la PQRS');
        return;
      }

      setMessage('PQRS triageada y guardada correctamente. Actualizando bandeja...');
      setTimeout(() => window.location.reload(), 700);
    });
  };

  return (
    <form
      className="bg-white border border-gray-200 p-6 mb-6 space-y-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit(formData);
      }}
    >
      <h3 className="text-sm font-bold text-[#001834] uppercase tracking-wide">
        Registrar PQRS manualmente
      </h3>

      <input type="hidden" name="canal" value={canal} />

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Adjuntar documento (opcional)
        </label>
        <input
          name="file"
          type="file"
          accept=".pdf,.txt,.jpg,.jpeg,.png,text/plain,application/pdf,image/jpeg,image/png"
          onChange={(e) => setFileAttached(e.target.files && e.target.files.length > 0 ? true : false)}
          className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#001834] file:text-white file:cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Texto de la solicitud
        </label>
        <textarea
          name="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escriba o pegue aqui el contenido de la PQRS..."
          className="w-full border border-gray-300 px-3 py-2.5 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-[#001834]"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-[#001834] text-white text-sm font-semibold hover:bg-[#002856] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Procesando...' : 'Procesar PQRS'}
        </button>
        {message ? (
          <span className={`text-sm ${message.includes('correctamente') ? 'text-emerald-700' : 'text-red-600'}`}>
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
