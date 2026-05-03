import { fireEvent, render, screen } from '@testing-library/react';
import { CatalogFilters } from './catalog-filters';

describe('CatalogFilters', () => {
  it('updates and clears filters', () => {
    const onChange = vi.fn();

    render(
      <CatalogFilters
        filters={{
          from: '2026-01-01',
          to: '2026-01-31',
          estado: 'aprobado',
          tipo: 'Queja',
          canal: 'web',
          urgencia: 'Alta',
          entity: 'IDU',
          search: 'alumbrado',
          page: 2,
        }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Entidad'), { target: { value: 'SDS' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ entity: 'SDS', page: 1 }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(onChange).toHaveBeenLastCalledWith({ page: 1 });
  });
});
