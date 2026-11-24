import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Ofertas from './Ofertas.jsx';

const mocks = vi.hoisted(() => ({ listar: vi.fn(), detalle: vi.fn() }));
vi.mock('../../services/api.js', () => ({ api: { ofertasPublicas: mocks.listar, ofertaPublica: mocks.detalle } }));

const oferta = { id: 'of-1', titulo: 'Operador de Planta', categoria: 'Operaciones', familiaCargo: 'Técnico B/C', modalidad: 'Presencial', ubicacion: 'Puerto Montt', fechaPublicacion: '2026-11-23', cupos: 2, descripcion: 'Operación segura.', funciones: 'Monitorear la línea.', requisitos: 'Experiencia en planta.', beneficios: 'Capacitación.', sueldo: 'A convenir' };

function RutaActual() {
  const ubicacion = useLocation();
  return <output data-testid="ruta-actual">{`${ubicacion.pathname}${ubicacion.search}`}</output>;
}

describe('Portal público de ofertas', () => {
  beforeEach(() => {
    mocks.listar.mockReset().mockResolvedValue({ ofertas: [oferta] });
    mocks.detalle.mockReset().mockResolvedValue({ oferta });
  });
  afterEach(cleanup);

  it('filtra, muestra el detalle completo y navega a postulación con la oferta precargada', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><Ofertas /><RutaActual /></MemoryRouter>);
    expect(await screen.findByText('Operador de Planta')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: /buscar ofertas/i }), 'operador');
    await waitFor(() => expect(mocks.listar).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'operador' })));
    await user.click(screen.getByRole('button', { name: /ver detalles/i }));
    expect(await screen.findByText('Monitorear la línea.')).toBeInTheDocument();
    expect(screen.getByText('A convenir')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /postular/i }));
    expect(screen.getByTestId('ruta-actual').textContent).toContain('/postulacion?');
    expect(screen.getByTestId('ruta-actual').textContent).toContain('oferta_id=of-1');
    expect(screen.getByTestId('ruta-actual').textContent).toContain('cargo=Operador');
  });
});
