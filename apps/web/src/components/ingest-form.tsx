'use client';

import { useState, useTransition } from 'react';
import type { FormEvent } from 'react';

export function IngestForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');

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
      className="bg-white border border-gray-200 p-4 mb-6 grid gap-3"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit(formData);
      }}
    >
      <h3 className="text-sm font-bold text-[#191C1D]">Ingresar nueva PQRS</h3>
      <textarea
        name="texto"
        placeholder="Pega aqui el texto de la PQRS..."
        className="border border-gray-300 rounded p-2 text-sm min-h-[90px]"
      />
      <div className="text-xs text-gray-500">o sube un archivo .pdf o .txt</div>
      <input name="file" type="file" accept=".pdf,.txt,text/plain,application/pdf" />
      <select name="canal" className="border border-gray-300 rounded p-2 text-sm w-52">
        <option value="web">web</option>
        <option value="escrito">escrito</option>
        <option value="presencial">presencial</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="w-fit px-4 py-2 bg-[#001834] text-white rounded font-bold disabled:opacity-60"
      >
        {isPending ? 'Procesando...' : 'Triagear PQRS'}
      </button>
      {message ? <p className="text-xs text-gray-600">{message}</p> : null}
    </form>
  );
}
