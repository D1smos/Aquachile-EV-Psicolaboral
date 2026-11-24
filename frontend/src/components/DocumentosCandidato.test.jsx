import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../context/ToastContext.jsx';
import DocumentosCandidato from './DocumentosCandidato.jsx';
import {
  obtenerTextoDocumento,
  reprocesarDocumento,
  subirDocumentoCandidato,
} from '../services/analisisIA.js';

vi.mock('../services/analisisIA.js', () => ({
  obtenerTextoDocumento: vi.fn(),
  reprocesarDocumento: vi.fn(),
  subirDocumentoCandidato: vi.fn(),
}));

const candidato = {
  id: 'c-1',
  nombre: 'Ana Pérez',
  archivos: [
    {
      id: 'a-1',
      tipo: 'cv',
      nombreOriginal: 'cv-ana.pdf',
      tamano: 500,
      creadoEn: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'a-2',
      tipo: 'antecedentes',
      nombreOriginal: 'certificado.pdf',
      tamano: 2048,
      creadoEn: '2026-01-11T10:00:00.000Z',
    },
    {
      id: 'a-3',
      tipo: 'informe',
      nombreOriginal: 'informe.pdf',
      tamano: 2 * 1024 * 1024,
      creadoEn: '2026-01-12T10:00:00.000Z',
    },
    {
      id: 'a-4',
      tipo: 'otro',
      nombreOriginal: 'raro.bin',
      tamano: 'sin-tamano',
      creadoEn: '2026-01-13T10:00:00.000Z',
    },
  ],
};

const documentoOk = {
  estado: 'ok',
  texto: 'Experiencia de cuatro años en producción.',
  anosExperiencia: 4,
  caracteres: 42,
  palabrasClave: ['produccion', 'turnos'],
};

const metadatosMock = (_, archivoId) => {
  if (archivoId === 'a-2') {
    return Promise.reject(Object.assign(new Error('Sin texto'), { codigo: 404 }));
  }
  if (archivoId === 'a-3') {
    return Promise.reject(Object.assign(new Error('Error de extracción'), { codigo: 500 }));
  }
  if (archivoId === 'a-4') {
    return Promise.resolve({ ...documentoOk, texto: 'Texto del cuarto documento.', palabrasClave: [] });
  }
  return Promise.resolve(documentoOk);
};

const montar = (extra = {}) =>
  render(
    <ToastProvider>
      <DocumentosCandidato
        candidato={candidato}
        puedeEvaluar
        onActualizado={vi.fn()}
        onAbrirArchivo={vi.fn()}
        {...extra}
      />
    </ToastProvider>,
  );

describe('DocumentosCandidato', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerTextoDocumento.mockImplementation(metadatosMock);
    reprocesarDocumento.mockResolvedValue({ ok: true });
    subirDocumentoCandidato.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it('lista documentos, tamaños, estados de extracción y palabras clave', async () => {
    montar();
    expect((await screen.findAllByText('Texto extraído')).length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByText('Sin texto útil')).toBeInTheDocument();
    expect(await screen.findByText('Error de extracción')).toBeInTheDocument();
    expect(screen.getByText('500 B')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Currículum').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('produccion')).toBeInTheDocument();
    expect(screen.getByText('turnos')).toBeInTheDocument();
  });

  it('abre previsualización, descarga, texto y reprocesa documentos', async () => {
    const user = userEvent.setup();
    const onAbrirArchivo = vi.fn();
    const onActualizado = vi.fn();
    montar({ onAbrirArchivo, onActualizado });
    await screen.findAllByText('Texto extraído');
    const fila = screen.getByText('cv-ana.pdf').closest('tr');
    await user.click(within(fila).getByRole('button', { name: /Ver/i }));
    expect(onAbrirArchivo).toHaveBeenCalledWith(candidato.archivos[0], 'preview');
    await user.click(within(fila).getByRole('button', { name: /Descargar/i }));
    expect(onAbrirArchivo).toHaveBeenCalledWith(candidato.archivos[0], 'download');

    await user.click(within(fila).getByRole('button', { name: /Texto/i }));
    expect(await screen.findByText(documentoOk.texto)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cerrar texto extraído/i }));

    await user.click(within(fila).getByRole('button', { name: /Reprocesar/i }));
    await waitFor(() => expect(reprocesarDocumento).toHaveBeenCalledWith('c-1', 'a-1'));
    await waitFor(() => expect(onActualizado).toHaveBeenCalled());
    expect(await screen.findByText('Documento reprocesado.')).toBeInTheDocument();
  });

  it('valida la selección, sube documentos y reporta errores', async () => {
    const user = userEvent.setup();
    const onActualizado = vi.fn();
    montar({ onActualizado });
    await screen.findAllByText('Texto extraído');

    await user.click(screen.getByRole('button', { name: /Cargar documento/i }));
    expect(await screen.findByText('Selecciona un documento para cargar.')).toBeInTheDocument();
    expect(subirDocumentoCandidato).not.toHaveBeenCalled();

    const archivo = new File(['%PDF-1.4'], 'nuevo.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('Nuevo documento'), archivo);
    await user.selectOptions(screen.getByLabelText('Tipo'), 'antecedentes');
    await user.click(screen.getByRole('button', { name: /Cargar documento/i }));
    await waitFor(() => expect(subirDocumentoCandidato).toHaveBeenCalledWith('c-1', expect.any(FormData)));
    expect(await screen.findByText('Documento cargado y procesado.')).toBeInTheDocument();
    expect(onActualizado).toHaveBeenCalled();

    subirDocumentoCandidato.mockRejectedValueOnce(new Error('No se pudo cargar'));
    await user.upload(screen.getByLabelText('Nuevo documento'), archivo);
    await user.click(screen.getByRole('button', { name: /Cargar documento/i }));
    expect(await screen.findByText('No se pudo cargar')).toBeInTheDocument();
  });

  it('reporta fallos al reprocesar y oculta acciones sin permisos', async () => {
    const user = userEvent.setup();
    reprocesarDocumento.mockRejectedValueOnce(new Error('No se pudo reprocesar'));
    montar();
    await screen.findAllByText('Texto extraído');
    const fila = screen.getByText('cv-ana.pdf').closest('tr');
    await user.click(within(fila).getByRole('button', { name: /Reprocesar/i }));
    expect(await screen.findByText('No se pudo reprocesar')).toBeInTheDocument();
  });

  it('sin documentos muestra un estado vacío y sin permisos no hay formulario', () => {
    montar({ candidato: { id: 'c-2', archivos: [] }, puedeEvaluar: false, onAbrirArchivo: undefined });
    expect(screen.getByText('Sin documentos adjuntos.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nuevo documento')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reprocesar/i })).not.toBeInTheDocument();
  });
});
