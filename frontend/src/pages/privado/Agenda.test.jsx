import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Agenda from './Agenda.jsx';

const mocks = vi.hoisted(() => ({
  listarEntrevistas: vi.fn(),
  crearEntrevista: vi.fn(),
  actualizarEntrevista: vi.fn(),
  eliminarEntrevista: vi.fn(),
  sincronizarEntrevista: vi.fn(),
  obtenerEstadoGoogle: vi.fn(),
  obtenerUrlConexionGoogle: vi.fn(),
  desconectarGoogle: vi.fn(),
  apiGet: vi.fn(),
  mostrarToast: vi.fn(),
  rol: 'psicologo',
}));

vi.mock('../../services/api.js', () => ({
  api: {
    get: mocks.apiGet,
  },
}));

vi.mock('../../services/calendario.js', () => ({
  listarEntrevistas: mocks.listarEntrevistas,
  crearEntrevista: mocks.crearEntrevista,
  actualizarEntrevista: mocks.actualizarEntrevista,
  eliminarEntrevista: mocks.eliminarEntrevista,
  sincronizarEntrevista: mocks.sincronizarEntrevista,
  obtenerEstadoGoogle: mocks.obtenerEstadoGoogle,
  obtenerUrlConexionGoogle: mocks.obtenerUrlConexionGoogle,
  desconectarGoogle: mocks.desconectarGoogle,
}));

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ usuario: { nombre: 'Ana Evaluadora', rol: mocks.rol } }),
}));

vi.mock('../../context/ToastContext.jsx', () => ({
  useToast: () => ({ mostrarToast: mocks.mostrarToast }),
}));

const CANDIDATOS = [
  {
    id: 'c1',
    nombre: 'Ana Pérez',
    folio: 'AQ-2026-00000001',
    correo: 'ana@correo.cl',
    cargo: 'Monitor Producción',
  },
];

const ENTREVISTA = {
  id: 'e1',
  candidatoId: 'c1',
  candidatoNombre: 'Ana Pérez',
  folio: 'AQ-2026-00000001',
  cargo: 'Monitor Producción',
  titulo: 'Entrevista inicial',
  fechaInicio: '2026-12-01T13:00:00.000Z',
  fechaFin: '2026-12-01T14:00:00.000Z',
  estado: 'programada',
  estadoSync: 'sincronizada',
  evaluadorEmail: 'evaluador@aquachile.cl',
  meetUrl: 'https://meet.google.com/abc-defg-hij',
};

const renderAgenda = () =>
  render(
    <MemoryRouter initialEntries={['/agenda']}>
      <Agenda />
    </MemoryRouter>,
  );

describe('Agenda', () => {
  beforeEach(() => {
    mocks.rol = 'psicologo';
    mocks.apiGet.mockReset();
    mocks.listarEntrevistas.mockReset();
    mocks.crearEntrevista.mockReset();
    mocks.actualizarEntrevista.mockReset();
    mocks.eliminarEntrevista.mockReset();
    mocks.sincronizarEntrevista.mockReset();
    mocks.obtenerEstadoGoogle.mockReset();
    mocks.obtenerUrlConexionGoogle.mockReset();
    mocks.desconectarGoogle.mockReset();
    mocks.mostrarToast.mockReset();

    mocks.apiGet.mockResolvedValue({ candidatos: CANDIDATOS });
    mocks.listarEntrevistas.mockResolvedValue({ entrevistas: [ENTREVISTA] });
    mocks.obtenerEstadoGoogle.mockResolvedValue({
      habilitado: false,
      configurado: false,
      conectado: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('muestra la agenda con sus métricas y entrevistas', async () => {
    renderAgenda();

    expect(await screen.findByRole('heading', { name: 'Agenda' })).toBeInTheDocument();
    expect(await screen.findByText('Entrevista inicial')).toBeInTheDocument();
    expect(screen.getAllByText(/Ana Pérez/).length).toBeGreaterThan(0);
    expect(screen.getByText('Entrevistas')).toBeInTheDocument();
    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    expect(screen.getByText(/se guardan localmente/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Entrar a Meet/ })).toHaveAttribute(
      'href',
      ENTREVISTA.meetUrl,
    );
  });

  it('agenda una entrevista desde el modal', async () => {
    mocks.crearEntrevista.mockResolvedValue({
      ok: true,
      mensaje: 'Entrevista agendada',
      entrevista: { ...ENTREVISTA, id: 'e2', titulo: 'Entrevista inicial' },
      sincronizada: false,
    });
    const usuario = userEvent.setup();
    renderAgenda();

    await screen.findByText('Entrevista inicial');
    await usuario.click(screen.getByRole('button', { name: /Nueva entrevista/ }));
    const dialogo = await screen.findByRole('dialog');
    expect(dialogo).toBeInTheDocument();

    await usuario.selectOptions(within(dialogo).getByLabelText('Candidato'), 'c1');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Agendar entrevista' }));

    await waitFor(() => expect(mocks.crearEntrevista).toHaveBeenCalledTimes(1));
    const enviado = mocks.crearEntrevista.mock.calls[0][0];
    expect(enviado.candidatoId).toBe('c1');
    expect(new Date(enviado.fechaInicio).getTime()).toBeLessThan(
      new Date(enviado.fechaFin).getTime(),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('oculta las acciones de escritura al analista', async () => {
    mocks.rol = 'analista';
    renderAgenda();

    await screen.findByText('Entrevista inicial');
    expect(screen.queryByRole('button', { name: /Nueva entrevista/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
  });
});
