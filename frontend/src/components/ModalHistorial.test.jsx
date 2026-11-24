import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import ModalHistorial from './ModalHistorial.jsx';
vi.mock('../services/api.js', () => ({ api: { get: vi.fn() } }));
const candidato = { id: 2, nombre: 'Luis Soto', folio: 'F-2', cargo: 'Técnico' }; const close = vi.fn();
beforeEach(() => { vi.clearAllMocks(); document.body.style.overflow = ''; }); afterEach(cleanup);
const mount = () => render(<ToastProvider><ModalHistorial candidato={candidato} onCerrar={close} /></ToastProvider>);
describe('ModalHistorial', () => {
  it('muestra movimientos, registro inicial, cambio y actualización', async () => {
    api.get.mockResolvedValue({ historial: [{ id: 1, etapaNueva: 'Pendiente', creadoEn: '2026-03-01' }, { id: 2, etapaAnterior: 'Pendiente', etapaNueva: 'En Proceso', creadoEn: '2026-03-02', responsable: 'Eva', motivo: 'Entrevista' }, { id: 3, etapaAnterior: 'En Proceso', etapaNueva: 'En Proceso', creadoEn: '2026-03-03' }] });
    mount(); expect(await screen.findByText(/Registro/)).toBeInTheDocument(); expect(screen.getByText(/Pendiente.*En Proceso/)).toBeInTheDocument(); expect(screen.getByText(/Actualización de ficha/)).toBeInTheDocument(); expect(screen.getByText('Entrevista')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' }); expect(close).toHaveBeenCalled(); expect(document.body.style.overflow).toBe('hidden');
  });
  it('muestra estado vacío y permite cerrar', async () => { api.get.mockResolvedValue({ historial: [] }); mount(); expect(await screen.findByText(/Aún no hay movimientos/)).toBeInTheDocument(); await userEvent.setup().click(screen.getByRole('button', { name: 'Cerrar' })); expect(close).toHaveBeenCalled(); });
  it('cierra y notifica errores de carga', async () => { api.get.mockRejectedValue(new Error('Historial privado')); mount(); await screen.findByText('Historial de etapas'); await vi.waitFor(() => expect(close).toHaveBeenCalled()); });
});
