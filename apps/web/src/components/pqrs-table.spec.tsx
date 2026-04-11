import { render, screen, fireEvent } from '@testing-library/react';
import { PqrsTable } from './pqrs-table';

const data = [
  {
    id: 'abc12345',
    texto: 'Texto de prueba 1',
    canal: 'web',
    tipo: 'Queja',
    tema: 'Infraestructura',
    subtema: 'Alumbrado',
    urgencia: 'Alta',
    entidad: 'IDU',
    resumen: 'Resumen 1',
    confianza: 0.92,
    estado: 'pendiente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'def67890',
    texto: 'Texto de prueba 2',
    canal: 'web',
    tipo: 'Peticion',
    tema: 'Salud',
    subtema: 'EPS',
    urgencia: 'Baja',
    entidad: 'SDS',
    resumen: 'Resumen 2',
    confianza: 0.5,
    estado: 'pendiente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ghi24680',
    texto: 'Texto de prueba 3',
    canal: 'web',
    tipo: 'Reclamo',
    tema: 'Convivencia',
    subtema: 'Ruido',
    urgencia: 'Media',
    entidad: 'Gobierno',
    resumen: 'Resumen 3',
    confianza: null,
    estado: 'pendiente',
    createdAt: new Date().toISOString(),
  },
];

describe('PqrsTable', () => {
  it('renders rows and confidence values', () => {
    render(
      <PqrsTable data={data} total={2} page={1} totalPages={1} onSelect={() => undefined} />,
    );

    expect(screen.getByText('Resumen 1')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('filters by urgency when button clicked', () => {
    render(
      <PqrsTable data={data} total={2} page={1} totalPages={1} onSelect={() => undefined} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Alta Prioridad' }));

    expect(screen.getByText('Resumen 1')).toBeInTheDocument();
    expect(screen.queryByText('Resumen 2')).not.toBeInTheDocument();
  });

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn();
    render(<PqrsTable data={data} total={2} page={1} totalPages={1} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('#ABC12345'));
    expect(onSelect).toHaveBeenCalledWith('abc12345');
  });

  it('shows media and baja urgency badges', () => {
    render(
      <PqrsTable data={data} total={3} page={1} totalPages={1} onSelect={() => undefined} />,
    );

    expect(screen.getAllByText('Media').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Baja').length).toBeGreaterThan(0);
  });

  it('toggles urgency filter off when clicked twice', () => {
    render(
      <PqrsTable data={data} total={3} page={1} totalPages={1} onSelect={() => undefined} />,
    );

    const button = screen.getByRole('button', { name: 'Alta Prioridad' });
    fireEvent.click(button);
    expect(screen.queryByText('Resumen 2')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText('Resumen 2')).toBeInTheDocument();
  });

  it('renders empty state when no records', () => {
    render(
      <PqrsTable data={[]} total={0} page={1} totalPages={1} onSelect={() => undefined} />,
    );

    expect(screen.getByText('No se encontraron PQRS')).toBeInTheDocument();
  });
});
