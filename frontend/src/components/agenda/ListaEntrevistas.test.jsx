import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ListaEntrevistas from './ListaEntrevistas.jsx';

const ENTREVISTA = {
  id: 'e1',
  candidatoNombre: 'Ana Pérez',
  folio: 'AQ-2026-00000001',
  cargo: 'Monitor Producción',
  titulo: 'Entrevista inicial',
  fechaInicio: '2026-12-01T13:00:00.000Z',
  fechaFin: '2026-12-01T14:00:00.000Z',
  estado: 'programada',
  estadoSync: 'sincronizada',
  evaluadorEmail: 'evaluador@aquachile.cl',
  lugar: 'Sala 1',
  meetUrl: 'https://meet.google.com/abc-defg-hij',
};

describe('ListaEntrevistas', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra el estado de sincronización y dispara las acciones', async () => {
    const usuario = userEvent.setup();
    const onEditar = vi.fn();
    const onEliminar = vi.fn();
    const onSincronizar = vi.fn();
    render(
      <ListaEntrevistas
        entrevistas={[ENTREVISTA]}
        puedeEvaluar
        onEditar={onEditar}
        onEliminar={onEliminar}
        onSincronizar={onSincronizar}
      />,
    );

    expect(screen.getByText('Entrevista inicial')).toBeInTheDocument();
    expect(screen.getByText('Sincronizada')).toBeInTheDocument();
    expect(screen.getByText(/Sala 1/)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /Editar/ }));
    await usuario.click(screen.getByRole('button', { name: /Sincronizar/ }));
    await usuario.click(screen.getByRole('button', { name: /Eliminar/ }));
    expect(onEditar).toHaveBeenCalledWith(ENTREVISTA);
    expect(onSincronizar).toHaveBeenCalledWith(ENTREVISTA);
    expect(onEliminar).toHaveBeenCalledWith(ENTREVISTA);
  });

  it('muestra un estado vacío cuando no hay entrevistas', () => {
    render(<ListaEntrevistas entrevistas={[]} />);
    expect(screen.getByText('Sin entrevistas en este período')).toBeInTheDocument();
  });

  it('informa un error de sincronización', () => {
    render(
      <ListaEntrevistas
        entrevistas={[{ ...ENTREVISTA, estadoSync: 'error', errorSync: 'Token expirado' }]}
      />,
    );
    expect(screen.getByText('Error de sincronización')).toBeInTheDocument();
    expect(screen.getByText(/Token expirado/)).toBeInTheDocument();
  });
});
