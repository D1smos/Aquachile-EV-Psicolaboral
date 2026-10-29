import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import TablaCandidatos from './TablaCandidatos.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const candidato = {
  id: 'c1',
  folio: 'AQ-2026-ABCD1234',
  nombre: 'Ana Pérez',
  rut: '12.345.678-5',
  correo: 'ana@example.com',
  cargo: 'Monitor Producción',
  familiaCargo: 'Técnico B/C',
  estado: 'Pendiente',
  puntaje: null,
  idoneidad: null,
  fechaPostulacion: '2026-10-01T10:00:00.000Z',
};

function montar(puedeEvaluar) {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  act(() => {
    raiz.render(
      h(TablaCandidatos, {
        candidatos: [candidato],
        hayFiltros: false,
        onLimpiar: () => {},
        onEvaluar: () => {},
        onHistorial: () => {},
        onEditar: () => {},
        onInforme: () => {},
        onEliminar: () => {},
        puedeEvaluar,
      }),
    );
  });

  return { contenedor, raiz };
}

describe('TablaCandidatos', () => {
  let montaje = null;

  afterEach(() => {
    if (montaje) {
      act(() => montaje.raiz.unmount());
      montaje.contenedor.remove();
      montaje = null;
    }
  });

  it('oculta evaluar, editar y eliminar para el analista', () => {
    montaje = montar(false);
    const texto = montaje.contenedor.textContent;

    expect(texto).toContain('Historial');
    expect(texto).toContain('PDF');
    expect(texto).not.toContain('Evaluar');
    expect(texto).not.toContain('Editar');
    expect(texto).not.toContain('Eliminar');
  });

  it('mantiene las acciones completas para el evaluador', () => {
    montaje = montar(true);
    const texto = montaje.contenedor.textContent;

    expect(texto).toContain('Evaluar');
    expect(texto).toContain('Editar');
    expect(texto).toContain('Historial');
    expect(texto).toContain('PDF');
    expect(texto).toContain('Eliminar');
  });
});
