const canalConfig: Record<string, { label: string; bg: string; text: string }> = {
  web: { label: 'Web', bg: 'bg-slate-100', text: 'text-slate-700' },
  email: { label: 'Correo', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  escrito: { label: 'Escrito', bg: 'bg-amber-50', text: 'text-amber-700' },
  presencial: { label: 'Presencial', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  api_externa: { label: 'API', bg: 'bg-zinc-100', text: 'text-zinc-600' },
};

export function ChannelBadge({ canal }: { canal: string }) {
  const config = canalConfig[canal] || { label: canal, bg: 'bg-zinc-100', text: 'text-zinc-600' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
