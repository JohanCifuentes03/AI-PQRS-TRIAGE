import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/components/channel-badge', () => ({
  ChannelBadge: ({ canal }: { canal: string }) => <span>{canal}</span>,
}));

import { CatalogTable } from './catalog-table';

const data = [
  {
    id: 'abc123456789',
    texto: 'Texto de prueba sobre servicio publico',
    canal: 'web',
    tipo: 'Queja',
    tema: 'Infraestructura',
    subtema: 'Alumbrado',
    urgencia: 'Alta',
    entidad: 'IDU',
    riesgo: null,
    resumen: 'Resumen 1',
    confianza: 0.91,
    estado: 'aprobado',
    createdAt: '2026-01-03T10:00:00.000Z',
  },
  {
    id: 'def987654321',
    texto: 'Texto de prueba sobre salud',
    canal: 'email',
    tipo: 'Peticion',
    tema: 'Salud',
    subtema: 'EPS',
    urgencia: 'Baja',
    entidad: 'SDS',
    riesgo: null,
    resumen: 'Resumen 2',
    confianza: 0.55,
    estado: 'corregido',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
];

describe('CatalogTable', () => {
  it('renders rows, selection, and badges', () => {
    const onSelectionChange = vi.fn();
    render(
      <CatalogTable
        data={data}
        meta={{ total: 2, page: 1, limit: 20, totalPages: 1 }}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
        onPageChange={() => undefined}
      />, 
    );

    expect(screen.getByText('Resumen 1')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('aprobado')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    expect(onSelectionChange).toHaveBeenCalledWith(['abc123456789']);
  });

  it('sorts rows when a sortable header is clicked', () => {
    render(
      <CatalogTable
        data={data}
        meta={{ total: 2, page: 1, limit: 20, totalPages: 1 }}
        selectedIds={[]}
        onSelectionChange={() => undefined}
        onPageChange={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /fecha/i }));

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('01/01/2026');
  });

  it('shows empty state when no data is available', () => {
    render(
      <CatalogTable
        data={[]}
        meta={{ total: 0, page: 1, limit: 20, totalPages: 1 }}
        selectedIds={[]}
        onSelectionChange={() => undefined}
        onPageChange={() => undefined}
      />,
    );

    expect(screen.getByText('No se encontraron PQRS')).toBeInTheDocument();
  });
});
