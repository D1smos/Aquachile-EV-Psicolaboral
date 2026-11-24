import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalTextoDocumento from './ModalTextoDocumento.jsx';
import { obtenerTextoDocumento, reprocesarDocumento } from '../services/analisisIA.js';

vi.mock('../services/analisisIA.js', () => ({
  obtenerTextoDocumento: vi.fn(),
  reprocesarDocumento: vi.fn(),
}));

const archivo = { id: 'a-1', nombreOriginal: 'cv-ana.pdf', tipo: 'cv' };
const documento = {
  estado: 'ok',
  texto: 'Experiencia en producción y manejo de planillas.',
  anosExperiencia: 6,
  caracteres: 48,
  palabrasClave: ['produccion', 'planillas'],
};

const montar = (extra = {}) =>
  render(
    <ModalTextoDocumento
      candidatoId="c-1"
      archivo={archivo}
      puedeEvaluar
      onCerrar={vi.fn()}
      onReprocesado={vi.fn()}
      {...extra}
    />,
  );

describe('ModalTextoDocumento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerTextoDocumento.mockResolvedValue(documento);
    reprocesarDocumento.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);

  it('muestra el texto extraído, metadatos y palabras clave', async () => {
    montar();
    expect(await screen.findByText(documento.texto)).toBeInTheDocument();
    expect(screen.getAllByText('Texto extraído').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('6 años detectados')).toBeInTheDocument();
    expect(screen.getByText('48 caracteres')).toBeInTheDocument();
    expect(screen.getByText('produccion')).toBeInTheDocument();
    expect(obtenerTextoDocumento).toHaveBeenCalledWith('c-1', 'a-1');
  });

  it('reprocesa el documento y notifica el resultado', async () => {
    const user = userEvent.setup();
    const onReprocesado = vi.fn();
    montar({ onReprocesado });
    await screen.findByText(documento.texto);
    await user.click(screen.getByRole('button', { name: /Reprocesar texto/i }));
    await waitFor(() => expect(reprocesarDocumento).toHaveBeenCalledWith('c-1', 'a-1'));
    await waitFor(() => expect(obtenerTextoDocumento).toHaveBeenCalledTimes(2));
    expect(onReprocesado).toHaveBeenCalled();
  });

  it('muestra el error de extracción, permite reintentar y cierra con Escape', async () => {
    const user = userEvent.setup();
    const onCerrar = vi.fn();
    obtenerTextoDocumento.mockRejectedValueOnce(new Error('Texto no disponible'));
    montar({ onCerrar, puedeEvaluar: false });
    expect(await screen.findByRole('alert')).toHaveTextContent('Texto no disponible');
    expect(screen.queryByRole('button', { name: /Reprocesar texto/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Reintentar/i }));
    expect(await screen.findByText(documento.texto)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCerrar).toHaveBeenCalled();
  });

  it('describe documentos sin texto útil y cierra al pulsar fuera o el botón', async () => {
    const user = userEvent.setup();
    const onCerrar = vi.fn();
    obtenerTextoDocumento.mockResolvedValue({
      estado: 'sin_texto',
      texto: null,
      error: 'Sin texto útil',
      anosExperiencia: 0,
      caracteres: 0,
      palabrasClave: [],
    });
    const { container } = montar({ onCerrar });
    expect(await screen.findAllByText('Sin texto útil')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /^Cerrar$/i }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(container.querySelector('.modal-overlay'));
    expect(onCerrar).toHaveBeenCalledTimes(2);
    fireEvent.mouseDown(container.querySelector('.modal-panel'));
    expect(onCerrar).toHaveBeenCalledTimes(2);
  });

  it('registra fallos al reprocesar', async () => {
    const user = userEvent.setup();
    reprocesarDocumento.mockRejectedValueOnce(new Error('No se pudo reprocesar'));
    montar();
    await screen.findByText(documento.texto);
    await user.click(screen.getByRole('button', { name: /Reprocesar texto/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo reprocesar');
  });
});
