import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { ToastProvider } from './ToastContext.jsx';
import { api } from '../services/api.js';
import RutaProtegida from '../components/RutaProtegida.jsx';

vi.mock('../services/api.js', async (importOriginal) => ({ ...(await importOriginal()), api: { get: vi.fn(), post: vi.fn() } }));
function Probe() { const auth = useAuth(); return <><span>{auth.autenticado ? 'autenticado' : 'anonimo'}</span><button onClick={() => auth.cerrarSesion()}>Salir</button><button onClick={() => auth.iniciarSesion({ email: 'a@b.cl', password: '123' })}>Entrar</button></>; }
function Location() { const location = useLocation(); return <p>{location.pathname}{location.state?.origen}</p>; }
function mount(path = '/', child = <Probe />) { return render(<MemoryRouter initialEntries={[path]}><ToastProvider><AuthProvider><Routes><Route path="*" element={child} /><Route path="/login" element={<Location />} /></Routes></AuthProvider></ToastProvider></MemoryRouter>); }
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(cleanup);
describe('AuthContext y ruta protegida', () => {
  it('inicia y cierra sesión guardando y limpiando credenciales', async () => {
    const user = userEvent.setup(); api.post.mockResolvedValue({ token: 'jwt', usuario: { id: 1, nombre: 'Eva' } });
    mount(); await user.click(screen.getByText('Entrar')); await screen.findByText('autenticado');
    expect(localStorage.getItem('aquachile_token')).toBe('jwt'); expect(JSON.parse(localStorage.getItem('aquachile_usuario')).nombre).toBe('Eva');
    await user.click(screen.getByText('Salir')); expect(screen.getByText('anonimo')).toBeInTheDocument(); expect(localStorage.getItem('aquachile_token')).toBeNull();
  });
  it('valida un token existente y limpia la sesión vencida', async () => {
    localStorage.setItem('aquachile_token', 'expirado'); localStorage.setItem('aquachile_usuario', '{'); api.get.mockRejectedValue(new Error('401'));
    mount(); await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/perfil')); await screen.findByText('anonimo');
    expect(localStorage.getItem('aquachile_usuario')).toBeNull(); expect(localStorage.getItem('aquachile_token')).toBeNull();
  });
  it('protege la ruta y conserva destino; muestra verificación', async () => {
    localStorage.setItem('aquachile_token', 'jwt'); let reject; api.get.mockReturnValue(new Promise((_, r) => { reject = r; }));
    const view = mount('/privado?tab=1', <RutaProtegida><b>Secreto</b></RutaProtegida>);
    expect(screen.getByRole('status')).toBeInTheDocument(); reject(new Error('401'));
    await waitFor(() => expect(screen.getByText('/login/privado?tab=1')).toBeInTheDocument()); expect(screen.queryByText('Secreto')).toBeNull(); view.unmount();
  });
});
