import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Inicio from './Inicio.jsx';
import { api } from '../../services/api.js';
vi.mock('../../services/api.js', () => ({ api: { post: vi.fn() } }));
const key = 'aquachile_ultima_postulacion';
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); }); afterEach(cleanup);
const mount = () => render(<MemoryRouter><Inicio /></MemoryRouter>);
describe('Inicio', () => {
  it('muestra enlaces y etapas vacías sin seguimiento', () => { mount(); expect(screen.getByRole('heading', { name: /psicolaborales/i })).toBeInTheDocument(); expect(screen.getAllByText(/Comenzar postulación/i).length).toBeGreaterThan(0); expect(screen.getByText('Etapa 0 de 3')).toBeInTheDocument(); expect(api.post).not.toHaveBeenCalled(); });
  it('actualiza seguimiento remoto y etapa finalizada', async () => { localStorage.setItem(key, JSON.stringify({ folio: 'F-123', rut: '12345678-5', nombre: 'Ana' })); api.post.mockResolvedValue({ candidato: { estado: 'Aprobado', cargo: 'Operadora' } }); mount(); await screen.findByText('Etapa 3 de 3'); expect(screen.getByText(/Proceso finalizado/)).toBeInTheDocument(); expect(JSON.parse(localStorage.getItem(key)).cargo).toBe('Operadora'); });
  it('elimina seguimiento cuando el folio no existe', async () => { localStorage.setItem(key, JSON.stringify({ folio: 'F-404', rut: '123' })); const error = Object.assign(new Error('no'), { codigo: 404 }); api.post.mockRejectedValue(error); mount(); await waitFor(() => expect(localStorage.getItem(key)).toBeNull()); expect(screen.getByText('Etapa 0 de 3')).toBeInTheDocument(); });
  it('conserva el seguimiento ante errores distintos de 404', async () => { const item = { folio: 'F-1', rut: '123', nombre: 'Leo', cargo: 'Técnico', estado: 'En Proceso' }; localStorage.setItem(key, JSON.stringify(item)); api.post.mockRejectedValue(new Error('offline')); mount(); await screen.findByText('Etapa 2 de 3'); expect(localStorage.getItem(key)).toContain('F-1'); });
});
