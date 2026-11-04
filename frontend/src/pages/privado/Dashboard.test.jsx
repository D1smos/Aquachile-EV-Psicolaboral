import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const fecha = new Date().toISOString();

const CANDIDATOS = [
  {
    id: 'c1',
    folio: 'AQ-2026-00000001',
    nombre: 'Ana Pérez',
    rut: '18.452.913-0',
    correo: 'ana@correo.cl',
    telefono: '955112233',
    cargo: 'Monitor Producción',
    familiaCargo: 'Técnico B/C',
    estado: 'Aprobado',
    puntaje: 80,
    idoneidad: 'Idóneo',
    respuestas: { p1: 5 },
    fechaPostulacion: fecha,
  },
  {
    id: 'c2',
    folio: 'AQ-2026-00000002',
    nombre: 'María González',
    rut: '19.876.543-2',
    correo: 'maria@correo.cl',
    telefono: '955112234',
    cargo: 'Analista de Sistemas',
    familiaCargo: 'Profesional B/C',
    estado: 'En Proceso',
    puntaje: null,
    idoneidad: null,
    respuestas: null,
    fechaPostulacion: fecha,
  },
  {
    id: 'c3',
    folio: 'AQ-2026-00000003',
    nombre: 'Diego Soto',
    rut: '20.123.456-7',
    correo: 'diego@correo.cl',
    telefono: '955112235',
    cargo: 'Monitor Producción',
    familiaCargo: 'Técnico B/C',
    estado: 'Pendiente',
    puntaje: null,
    idoneidad: null,
    respuestas: null,
    fechaPostulacion: fecha,
  },
];

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

describe('Dashboard', () => {
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
    cleanup();
  });

  it('muestra las métricas y los candidatos', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();

    const total = screen.getByText('Total candidatos').closest('article');
    expect(within(total).getByText('3')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Diego Soto')).toBeInTheDocument();
  });

  it('filtra por nombre sin distinguir tildes', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const buscador = await screen.findByLabelText('Nombre, RUT o correo');
    await user.type(buscador, 'maria');

    expect(await screen.findByText('María González')).toBeInTheDocument();
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument();
    expect(screen.getByText('1 candidato')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando falla la carga', async () => {
    mocks.apiGet.mockRejectedValue(new Error('No se pudo cargar el panel'));

    render(<Dashboard />);

    expect(await screen.findByText('No se pudo cargar el panel')).toBeInTheDocument();
  });

  it('oculta las acciones de edición para el analista', async () => {
    mocks.rol = 'analista';
    render(<Dashboard />);

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.queryByText('Nuevo candidato')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Evaluar candidato')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Ver historial de etapas' })).toHaveLength(3);
  });
});
