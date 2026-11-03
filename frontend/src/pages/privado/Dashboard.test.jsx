import { act, createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard.jsx';

const mocks = vi.hoisted(() => ({
  rol: 'psicologo',
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiEliminar: vi.fn(),
  apiDescargar: vi.fn(),
  mostrarToast: vi.fn(),
}));

vi.mock('../../services/api.js', () => ({
  api: {
    get: mocks.apiGet,
    post: mocks.apiPost,
    patch: mocks.apiPatch,
    eliminar: mocks.apiEliminar,
    descargar: mocks.apiDescargar,
  },
}));

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ usuario: { nombre: 'Ana Evaluadora', rol: mocks.rol } }),
}));

vi.mock('../../context/ToastContext.jsx', () => ({
  useToast: () => ({ mostrarToast: mocks.mostrarToast }),
}));

const ahora = new Date();
const fechaActual = (dia) =>
  new Date(ahora.getFullYear(), ahora.getMonth(), dia).toISOString();
const fechaAntigua = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 10).toISOString();

const NOMBRES = [
  'Ana Pérez',
  'Bruno Díaz',
  'María González',
  'Diego Soto',
  'Elena Rojas',
  'Felipe Muñoz',
  'Gabriela Vega',
  'Hugo Silva',
  'Inés Torres',
  'Javier Rivas',
];

const ESTADOS = [
  'Aprobado',
  'Aprobado',
  'En Proceso',
  'En Proceso',
  'En Proceso',
  'Pendiente',
  'Pendiente',
  'Pendiente',
  'Rechazado',
  'Rechazado',
];

const CANDIDATOS = NOMBRES.map((nombre, indice) => {
  const evaluado = indice < 4;
  return {
    id: `c${indice + 1}`,
    folio: `AQ-2026-0000000${indice + 1}`,
    nombre,
    rut: `18.452.91${indice}-0`,
    correo: `candidato${indice + 1}@correo.cl`,
    telefono: `95511223${indice}`,
    cargo: indice % 2 === 0 ? 'Monitor Producción' : 'Analista de Sistemas',
    familiaCargo: indice % 2 === 0 ? 'Técnico B/C' : 'Profesional B/C',
    estado: ESTADOS[indice],
    puntaje: evaluado ? 80 : null,
    idoneidad: evaluado ? 'Idóneo' : null,
    respuestas: evaluado ? { p1: 5 } : null,
    fechaPostulacion: indice >= 8 ? fechaAntigua : fechaActual(10 - indice),
  };
});

const CATALOGO = {
  familiasCargos: {
    'Técnico B/C': ['Monitor Producción'],
    'Profesional B/C': ['Analista de Sistemas'],
  },
  estados: ['Pendiente', 'En Proceso', 'Aprobado', 'Rechazado'],
  formaciones: ['Técnico', 'Profesional'],
  disponibilidades: ['Inmediata'],
};

const CUESTIONARIO = {
  dimensiones: [],
  preguntas: [],
  opciones: [1, 2, 3, 4, 5],
};

function respuestaOk(ruta) {
  if (ruta === '/candidatos') {
    return Promise.resolve({ candidatos: CANDIDATOS });
  }
  if (ruta === '/catalogos') {
    return Promise.resolve(CATALOGO);
  }
  if (ruta === '/catalogos/evaluacion') {
    return Promise.resolve(CUESTIONARIO);
  }
  return Promise.resolve({});
}

async function montar() {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(h(Dashboard));
    await new Promise((resolver) => setTimeout(resolver, 0));
  });

  return { contenedor, raiz };
}

function escribir(elemento, valor) {
  const prototipo =
    elemento instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototipo, 'value');
  descriptor.set.call(elemento, valor);
  elemento.dispatchEvent(
    new Event(elemento instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }),
  );
}

function hacerClic(elemento) {
  elemento.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

describe('Dashboard', () => {
  let montaje = null;

  beforeEach(() => {
    mocks.rol = 'psicologo';
    mocks.apiGet.mockReset();
    mocks.apiGet.mockImplementation(respuestaOk);
    mocks.apiPost.mockReset();
    mocks.apiPatch.mockReset();
    mocks.apiEliminar.mockReset();
    mocks.apiDescargar.mockReset();
    mocks.mostrarToast.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    if (montaje) {
      act(() => montaje.raiz.unmount());
      montaje.contenedor.remove();
      montaje = null;
    }
  });

  it('carga métricas y muestra la primera página de candidatos', async () => {
    montaje = await montar();
    const valores = [...montaje.contenedor.querySelectorAll('.kpi-valor')].map((nodo) =>
      nodo.textContent.trim(),
    );

    expect(valores).toHaveLength(4);
    expect(valores[0]).toBe('10');
    expect(valores[1]).toBe('8');
    expect(valores[2]).toContain('40');
    expect(valores[3]).toBe('2');
    expect(montaje.contenedor.querySelectorAll('.tabla-aqua tbody tr')).toHaveLength(8);
    expect(montaje.contenedor.textContent).toContain('Ana Pérez');
  });

  it('filtra sin distinguir tildes y actualiza el total', async () => {
    montaje = await montar();
    const buscador = montaje.contenedor.querySelector('#filtro-busqueda');

    act(() => escribir(buscador, 'maria'));

    expect(montaje.contenedor.textContent).toContain('María González');
    expect(montaje.contenedor.textContent).toContain('1 candidato');
    expect(montaje.contenedor.querySelectorAll('.tabla-aqua tbody tr')).toHaveLength(1);
    expect(montaje.contenedor.textContent).not.toContain('Ana Pérez');
  });

  it('pagina los candidatos de ocho en ocho', async () => {
    montaje = await montar();
    const siguiente = [...montaje.contenedor.querySelectorAll('button')].find((boton) =>
      boton.textContent.includes('Siguiente'),
    );

    act(() => hacerClic(siguiente));

    expect(montaje.contenedor.textContent).toContain('Página 2 de 2');
    expect(montaje.contenedor.querySelectorAll('.tabla-aqua tbody tr')).toHaveLength(2);
    expect(montaje.contenedor.textContent).toContain('Inés Torres');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    mocks.apiGet.mockRejectedValue(new Error('No se pudo cargar el panel'));
    montaje = await montar();

    expect(montaje.contenedor.textContent).toContain('No se pudo cargar el panel');

    mocks.apiGet.mockImplementation(respuestaOk);
    const reintentar = [...montaje.contenedor.querySelectorAll('button')].find((boton) =>
      boton.textContent.includes('Reintentar'),
    );

    await act(async () => {
      hacerClic(reintentar);
      await new Promise((resolver) => setTimeout(resolver, 0));
    });

    expect(montaje.contenedor.textContent).toContain('Ana Pérez');
    expect(montaje.contenedor.textContent).not.toContain('No se pudo cargar el panel');
  });

  it('oculta las acciones de edición para el analista', async () => {
    mocks.rol = 'analista';
    montaje = await montar();
    const titulos = [...montaje.contenedor.querySelectorAll('button')].map(
      (boton) => boton.getAttribute('title') ?? '',
    );

    expect(montaje.contenedor.textContent).not.toContain('Nuevo candidato');
    expect(montaje.contenedor.textContent).not.toContain('Editar');
    expect(montaje.contenedor.textContent).not.toContain('Eliminar');
    expect(titulos).not.toContain('Evaluar candidato');
    expect(montaje.contenedor.textContent).toContain('Historial');
  });

  it('mantiene las acciones completas para el evaluador', async () => {
    montaje = await montar();
    const titulos = [...montaje.contenedor.querySelectorAll('button')].map(
      (boton) => boton.getAttribute('title') ?? '',
    );

    expect(montaje.contenedor.textContent).toContain('Nuevo candidato');
    expect(titulos).toContain('Evaluar candidato');
    expect(montaje.contenedor.textContent).toContain('Editar');
    expect(montaje.contenedor.textContent).toContain('Eliminar');
  });
});
