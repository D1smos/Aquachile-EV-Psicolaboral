import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Postulacion from './Postulacion.jsx';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  mostrarToast: vi.fn(),
}));

vi.mock('../../services/api.js', () => ({
  api: {
    get: mocks.apiGet,
    post: mocks.apiPost,
  },
}));

vi.mock('../../context/ToastContext.jsx', () => ({
  useToast: () => ({ mostrarToast: mocks.mostrarToast }),
}));

const CATALOGO = {
  familiasCargos: {
    'Técnico B/C': ['Monitor Producción', 'Operador Sala Control'],
    'Profesional A': ['Líder Desarrollo Producción'],
  },
  formaciones: ['Técnico', 'Profesional'],
  disponibilidades: ['Inmediata', '30 días'],
  estados: ['Pendiente', 'En Proceso', 'Aprobado', 'Rechazado'],
};

const CANDIDATO = {
  id: 'c1',
  folio: 'AQ-2026-ABCD1234',
  nombre: 'Camila Rojas Peña',
  cargo: 'Monitor Producción',
  estado: 'Pendiente',
};

function renderizar() {
  render(
    <MemoryRouter>
      <Postulacion />
    </MemoryRouter>,
  );
}

async function completarFormulario(user) {
  await user.type(screen.getByLabelText('Nombre y apellido'), 'Camila Rojas Peña');
  await user.type(screen.getByLabelText('RUT'), '184529130');
  await user.type(screen.getByLabelText('Correo electrónico'), 'camila@correo.cl');
  await user.type(screen.getByLabelText('Teléfono móvil'), '955112233');
  await user.selectOptions(screen.getByLabelText('Familia de cargo'), 'Técnico B/C');
  await user.selectOptions(screen.getByLabelText('Cargo'), 'Monitor Producción');
  await user.selectOptions(screen.getByLabelText('Formación académica'), 'Técnico');
  await user.selectOptions(screen.getByLabelText('Disponibilidad'), 'Inmediata');
  await user.type(screen.getByLabelText('Años de experiencia relacionada'), '4');
  await user.upload(
    screen.getByLabelText('Currículum vitae (obligatorio)'),
    new File(['%PDF-1.4 prueba'], 'cv.pdf', { type: 'application/pdf' }),
  );
  await user.click(screen.getByLabelText(/He leído y acepto/));
}

describe('Postulación pública', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiGet.mockResolvedValue(CATALOGO);
    mocks.apiPost.mockReset();
    mocks.mostrarToast.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('carga las familias y los cargos del catálogo', async () => {
    const user = userEvent.setup();
    renderizar();

    const familia = await screen.findByLabelText('Familia de cargo');
    expect(within(familia).getByRole('option', { name: 'Técnico B/C' })).toBeInTheDocument();

    await user.selectOptions(familia, 'Técnico B/C');

    const cargo = screen.getByLabelText('Cargo');
    expect(within(cargo).getByRole('option', { name: 'Monitor Producción' })).toBeInTheDocument();
  });

  it('valida los campos obligatorios antes de enviar', async () => {
    const user = userEvent.setup();
    renderizar();

    await screen.findByLabelText('Familia de cargo');
    await user.click(screen.getByRole('button', { name: /Enviar postulación/i }));

    expect(await screen.findByText('Ingresa tu nombre y apellido')).toBeInTheDocument();
    expect(screen.getByText(/Adjunta tu CV/)).toBeInTheDocument();
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });

  it('formatea el RUT y el teléfono mientras se escriben', async () => {
    const user = userEvent.setup();
    renderizar();

    await screen.findByLabelText('Familia de cargo');
    await user.type(screen.getByLabelText('RUT'), '184529130');
    await user.type(screen.getByLabelText('Teléfono móvil'), '955112233');

    expect(screen.getByLabelText('RUT')).toHaveValue('18.452.913-0');
    expect(screen.getByLabelText('Teléfono móvil')).toHaveValue('9 5511 2233');
  });

  it('registra la postulación y muestra el folio', async () => {
    const user = userEvent.setup();
    mocks.apiPost.mockResolvedValue({ candidato: CANDIDATO });
    renderizar();

    await screen.findByLabelText('Familia de cargo');
    await completarFormulario(user);
    await user.click(screen.getByRole('button', { name: /Enviar postulación/i }));

    expect(await screen.findByText('¡Postulación registrada!')).toBeInTheDocument();
    expect(screen.getByText('AQ-2026-ABCD1234')).toBeInTheDocument();
    expect(mocks.apiPost).toHaveBeenCalledWith('/postulaciones', expect.any(FormData));
  });
});
