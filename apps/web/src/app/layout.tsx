import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI PQRS Triage - Civic Sentinel',
  description: 'Sistema de triage inteligente para PQRS - Bogota Te Escucha',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
