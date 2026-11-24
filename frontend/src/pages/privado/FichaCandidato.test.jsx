import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FichaCandidato from './FichaCandidato.jsx';
import { api } from '../../services/api.js';

const mocks = vi.hoisted(() => ({ mostrarToast: vi.fn(), rol: { valor: 'psicologo' } }));

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ usuario: { rol: mocks.rol.valor } }),
}));

vi.mock('../../context/ToastContext.jsx', () => ({
  useToast: () => ({ mostrarToast: mocks.mostrarToast }),
}));

vi.mock('../../components/ia/PanelAnalisisIA.jsx', () => ({
  default: () => <div>Panel de análisis IA</div>,
}));

vi.mock('../../components/DocumentosCandidato.jsx', () => ({
  default: ({ onAbrirArchivo, onActualizado }) => (
    <div data-testid="documentos-candidato">
      <button type="button" onClick={() => onAbrirArchivo({ id: 'a-1', nombreOriginal: 'cv.pdf' }, 'preview')}>
        abrir preview
      </button>
      <button type="button" onClick={() => onAbrirArchivo({ id: 'a-2', nombreOriginal: 'otro.pdf' }, 'download')}>
        abrir descarga
      </button>
      <button type="button" onClick={onActualizado}>recargar ficha</button>
    </div>
  ),
}));

vi.mock('../../services/api.js', () => ({
  api: {
    get: vi.fn(),
    descargar: vi.fn(),
    abrir: vi.fn(),
  },
}));

const candidato = {
  id: 'c-1',
  folio: 'AQ-2026-AAAA1111',
  nombre: 'Ana Pérez',
  rut: '12.345.678-5',
  correo: 'ana@example.cl',
  telefono: '+56912345678',
  familiaCargo: 'Técnico B/C',
  cargo: 'Monitor Producción',
  formacion: 'Técnico',
  disponibilidad: 'Inmediata',
  aniosExperiencia: 6,
  estado: 'Aprobado',
  fechaPostulacion: '2026-01-10T10:00:00.000Z',
  fechaActualizacion: '2026-01-12T10:00:00.000Z',
  consentimiento: true,
  motivacion: 'Aportar en producción.',
  puntaje: 87,
  idoneidad: 'Idóneo',
  evaluadoPor: 'evaluador@example.cl',
  fechaEvaluacion: '2026-01-11T10:00:00.000Z',
  observaciones: 'Buena comunicación.',
  archivos: [],
};

const historial = [
  {
    id: 'h-1',
    etapaAnterior: null,
    etapaNueva: 'Pendiente',
    creadoEn: '2026-01-10T10:00:00.000Z',
    responsable: 'sistema',
    motivo: 'Registro inicial',
  },
  {
    id: 'h-2',
    etapaAnterior: 'Pendiente',
    etapaNueva: 'Aprobado',
    creadoEn: '2026-01-11T10:00:00.000Z',
    responsable: null,
    motivo: null,
  },
];

const montar = () =>
  render(
    <MemoryRouter initialEntries={['/candidatos/c-1/ficha']}>
      <Routes>
        <Route path="/candidatos/:id/ficha" element={<FichaCandidato />} />
      </Routes>
    </MemoryRouter>,
  );

const ficha = (extra = {}) => ({ candidato: { ...candidato, ...extra }, historial });

describe('Ficha del candidato', () => {
  let openSpy;
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rol.valor = 'psicologo';
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.spyOn(window, 'print').mockImplementation(() => {});
    api.get.mockImplementation((ruta) => {
      if (ruta.endsWith('/ficha')) {
        return Promise.resolve(ficha());
      }
      if (ruta.includes('a-1')) {
        return Promise.resolve({ url: 'https://storage.local/cv.pdf' });
      }
      return Promise.resolve({});
    });
    api.descargar.mockResolvedValue(undefined);
    api.abrir.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    openSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('muestra la ficha completa, el historial y la navegación interna', async () => {
    montar();
    expect(screen.getByRole('status')).toHaveTextContent(/Cargando ficha/i);
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText(/AQ-2026-AAAA1111/)).toBeInTheDocument();
    expect(screen.getByText('87 %')).toBeInTheDocument();
    expect(screen.getByText('Idóneo')).toBeInTheDocument();
    expect(screen.getByText('Aceptado')).toBeInTheDocument();
    expect(screen.getByText('Aportar en producción.')).toBeInTheDocument();
    expect(screen.getByText('Buena comunicación.')).toBeInTheDocument();
    expect(screen.getByText('Registro · Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Pendiente → Aprobado')).toBeInTheDocument();
    expect(screen.getByText('Registro inicial')).toBeInTheDocument();
    expect(screen.getByText('Panel de análisis IA')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Agendar entrevista/i })).toBeInTheDocument();
  });

  it('imprime, descarga el PDF y comparte por distintas vías', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Ana Pérez');

    await user.click(screen.getByRole('button', { name: /Imprimir/i }));
    expect(window.print).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Descargar PDF/i }));
    await waitFor(() =>
      expect(api.descargar).toHaveBeenCalledWith('/candidatos/c-1/informe.pdf', 'ficha-AQ-2026-AAAA1111.pdf'),
    );
    expect(mocks.mostrarToast).toHaveBeenCalledWith('Ficha PDF descargada', 'exito');

    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    await user.click(screen.getByRole('button', { name: /Compartir/i }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    delete navigator.share;

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    await user.click(screen.getByRole('button', { name: /Compartir/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(mocks.mostrarToast).toHaveBeenCalledWith('Enlace copiado al portapapeles', 'exito');

    writeText.mockRejectedValueOnce(new Error('sin permiso'));
    await user.click(screen.getByRole('button', { name: /Compartir/i }));
    await waitFor(() =>
      expect(mocks.mostrarToast).toHaveBeenCalledWith(
        expect.stringMatching(/No se pudo compartir/),
        'advertencia',
      ),
    );
  });

  it('abre archivos, recarga la ficha y reporta fallos', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('Ana Pérez');

    await user.click(screen.getByRole('button', { name: /abrir preview/i }));
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://storage.local/cv.pdf', '_blank', 'noopener'));

    await user.click(screen.getByRole('button', { name: /abrir descarga/i }));
    await waitFor(() =>
      expect(api.descargar).toHaveBeenCalledWith(undefined, 'otro.pdf'),
    );

    const llamadas = api.get.mock.calls.length;
    await user.click(screen.getByRole('button', { name: /recargar ficha/i }));
    await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThan(llamadas));

    api.descargar.mockRejectedValueOnce(new Error('PDF no disponible'));
    await user.click(screen.getByRole('button', { name: /Descargar PDF/i }));
    await waitFor(() =>
      expect(mocks.mostrarToast).toHaveBeenCalledWith('PDF no disponible', 'error'),
    );
  });

  it('muestra el error de carga y reintenta', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValueOnce(new Error('Ficha no encontrada'));
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent('Ficha no encontrada');
    await user.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
  });

  it('sin datos muestra el mensaje de ficha inexistente y sin permisos no agenda', async () => {
    mocks.rol.valor = 'analista';
    api.get.mockResolvedValueOnce({});
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent(/No se encontró la ficha/i);
  });
});
