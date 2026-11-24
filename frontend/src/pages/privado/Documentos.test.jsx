import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext.jsx';
import Documentos from './Documentos.jsx';
import { api } from '../../services/api.js';

const mocks = vi.hoisted(() => ({ rol: { valor: 'psicologo' } }));

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ usuario: { rol: mocks.rol.valor } }),
}));

vi.mock('../../components/ModalTextoDocumento.jsx', () => ({
  default: ({ archivo, onCerrar, onReprocesado }) => (
    <div data-testid="modal-texto">
      <span>{archivo.nombreOriginal}</span>
      <button type="button" onClick={onCerrar}>cerrar modal</button>
      <button type="button" onClick={onReprocesado}>reprocesado</button>
    </div>
  ),
}));

vi.mock('../../services/api.js', () => ({
  api: {
    get: vi.fn(),
    abrir: vi.fn(),
    descargar: vi.fn(),
  },
}));

const archivos = [
  {
    id: 'a-1',
    candidatoId: 'c-1',
    candidatoNombre: 'Ana Pérez',
    folio: 'AQ-2026-AAAA1111',
    nombreOriginal: 'cv-ana.pdf',
    tipo: 'cv',
    tamano: 900,
    creadoEn: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'a-2',
    candidatoId: 'c-2',
    candidatoNombre: 'Luis Soto',
    folio: 'AQ-2026-BBBB2222',
    nombreOriginal: 'antecedentes.pdf',
    tipo: 'antecedentes',
    tamano: 2048,
    creadoEn: '2026-01-11T10:00:00.000Z',
  },
  {
    id: 'a-3',
    candidatoId: 'c-3',
    candidatoNombre: 'María Paz',
    folio: 'AQ-2026-CCCC3333',
    nombreOriginal: 'informe.pdf',
    tipo: 'otro',
    tamano: 2 * 1024 * 1024,
    creadoEn: '2026-01-12T10:00:00.000Z',
  },
];

const respuestaListado = { total: 20, archivos };

const montar = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <Documentos />
      </ToastProvider>
    </MemoryRouter>,
  );

describe('Página de documentos', () => {
  let openSpy;
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rol.valor = 'psicologo';
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    api.get.mockImplementation((ruta) => {
      if (ruta.startsWith('/archivos?')) {
        return Promise.resolve(respuestaListado);
      }
      if (ruta.includes('a-1')) {
        return Promise.resolve({ url: 'https://storage.local/cv-ana.pdf' });
      }
      if (ruta.includes('a-2')) {
        return Promise.resolve({ previewUrl: '/api/candidatos/c-2/archivos/a-2/preview' });
      }
      return Promise.resolve({ descargaUrl: '/api/candidatos/c-3/archivos/a-3' });
    });
    api.abrir.mockResolvedValue(undefined);
    api.descargar.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    openSpy.mockRestore();
  });

  it('carga documentos, aplica filtros, limpia y pagina', async () => {
    const user = userEvent.setup();
    montar();
    expect(screen.getByRole('status')).toHaveTextContent(/Cargando documentos/i);
    expect(await screen.findByText('cv-ana.pdf')).toBeInTheDocument();
    expect(screen.getByText('20 documentos')).toBeInTheDocument();
    expect(screen.getByText('900 B')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    expect(screen.getAllByText('Currículum').length).toBeGreaterThanOrEqual(2);

    await user.type(screen.getByLabelText(/Candidato, folio o archivo/i), 'ana');
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('q=ana')),
    );
    await user.selectOptions(screen.getByLabelText('Tipo'), 'cv');
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('tipo=cv')),
    );
    await user.type(screen.getByLabelText('Cargado desde'), '2026-01-01');
    await user.type(screen.getByLabelText('Hasta'), '2026-01-31');
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('hasta=2026-01-31')),
    );

    await user.click(screen.getByRole('button', { name: /Limpiar/i }));
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith('/archivos?pagina=1&porPagina=15'),
    );

    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Siguiente/i }));
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('pagina=2')),
    );
    await user.click(screen.getByRole('button', { name: /Anterior/i }));
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('pagina=1')),
    );
  });

  it('abre el texto, previsualiza y descarga archivos', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText('cv-ana.pdf');

    const filaAna = screen.getByText('cv-ana.pdf').closest('tr');
    await user.click(within(filaAna).getByRole('button', { name: /^Ver$/i }));
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith('https://storage.local/cv-ana.pdf', '_blank', 'noopener'));

    const filaLuis = screen.getByText('antecedentes.pdf').closest('tr');
    await user.click(within(filaLuis).getByRole('button', { name: /^Ver$/i }));
    await waitFor(() =>
      expect(api.abrir).toHaveBeenCalledWith('/api/candidatos/c-2/archivos/a-2/preview'),
    );

    const filaMaria = screen.getByText('informe.pdf').closest('tr');
    await user.click(within(filaMaria).getByRole('button', { name: /Descargar/i }));
    await waitFor(() =>
      expect(api.descargar).toHaveBeenCalledWith('/api/candidatos/c-3/archivos/a-3', 'informe.pdf'),
    );

    await user.click(within(filaAna).getByRole('button', { name: /Ver texto extraído/i }));
    expect(screen.getByTestId('modal-texto')).toHaveTextContent('cv-ana.pdf');
    await user.click(screen.getByRole('button', { name: /cerrar modal/i }));
    expect(screen.queryByTestId('modal-texto')).not.toBeInTheDocument();

    await user.click(within(filaAna).getByRole('button', { name: /Ver texto extraído/i }));
    await user.click(screen.getByRole('button', { name: /reprocesado/i }));
    await waitFor(() => expect(api.get.mock.calls.at(-1)[0]).toMatch(/^\/archivos\?/));
  });

  it('muestra errores de carga y permite reintentar', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValueOnce(new Error('No se pudo cargar documentos'));
    montar();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar documentos');
    await user.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(await screen.findByText('cv-ana.pdf')).toBeInTheDocument();
  });

  it('muestra vacíos con y sin filtros', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation((ruta) => {
      if (ruta.startsWith('/archivos?')) {
        return Promise.resolve({ total: 0, archivos: [] });
      }
      return Promise.reject(new Error('Archivo no disponible'));
    });
    montar();
    expect(await screen.findByText('Todavía no hay documentos cargados.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Candidato, folio o archivo/i), 'sin-resultados');
    expect(await screen.findByText('No hay documentos que coincidan con los filtros.')).toBeInTheDocument();
  });
});
