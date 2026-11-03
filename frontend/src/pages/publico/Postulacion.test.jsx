import { act, createElement as h } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
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

function respuestaCatalogo() {
  return Promise.resolve(CATALOGO);
}

async function montar() {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(h(MemoryRouter, null, h(Postulacion)));
    await new Promise((resolver) => setTimeout(resolver, 0));
  });

  return { contenedor, raiz };
}

function escribir(elemento, valor) {
  let prototipo = HTMLInputElement.prototype;
  if (elemento instanceof HTMLSelectElement) {
    prototipo = HTMLSelectElement.prototype;
  } else if (elemento instanceof HTMLTextAreaElement) {
    prototipo = HTMLTextAreaElement.prototype;
  }
  const descriptor = Object.getOwnPropertyDescriptor(prototipo, 'value');
  descriptor.set.call(elemento, valor);
  elemento.dispatchEvent(
    new Event(elemento instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }),
  );
}

function escribirCampo(contenedor, selector, valor) {
  act(() => escribir(contenedor.querySelector(selector), valor));
}

function marcarConsentimiento(contenedor) {
  const checkbox = contenedor.querySelector('#aceptaPrivacidad');
  act(() => checkbox.click());
}

function seleccionarArchivo(contenedor, selector, archivo) {
  const input = contenedor.querySelector(selector);
  Object.defineProperty(input, 'files', { configurable: true, value: [archivo] });
  act(() => input.dispatchEvent(new Event('change', { bubbles: true })));
}

function completarFormulario(contenedor) {
  escribirCampo(contenedor, '#nombre', 'Camila Rojas Peña');
  escribirCampo(contenedor, '#rut', '184529130');
  escribirCampo(contenedor, '#correo', 'camila.rojas@correo.cl');
  escribirCampo(contenedor, '#telefono', '955112233');
  escribirCampo(contenedor, '#familiaCargo', 'Técnico B/C');
  escribirCampo(contenedor, '#cargo', 'Monitor Producción');
  escribirCampo(contenedor, '#formacion', 'Técnico');
  escribirCampo(contenedor, '#disponibilidad', 'Inmediata');
  escribirCampo(contenedor, '#aniosExperiencia', '4');
  escribirCampo(contenedor, '#motivacion', 'Busco aportar mi experiencia en planta.');
  marcarConsentimiento(contenedor);
  seleccionarArchivo(
    contenedor,
    '#cv',
    new File(['%PDF-1.4 postulación de prueba'], 'cv.pdf', { type: 'application/pdf' }),
  );
}

async function enviar(contenedor) {
  const formulario = contenedor.querySelector('form');
  await act(async () => {
    formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolver) => setTimeout(resolver, 0));
  });
}

describe('Postulación pública', () => {
  let montaje = null;

  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiGet.mockImplementation(respuestaCatalogo);
    mocks.apiPost.mockReset();
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

  it('carga las familias y los cargos del catálogo', async () => {
    montaje = await montar();
    const familia = montaje.contenedor.querySelector('#familiaCargo');

    expect([...familia.options].map((opcion) => opcion.value)).toContain('Técnico B/C');

    act(() => escribir(familia, 'Técnico B/C'));

    const cargo = montaje.contenedor.querySelector('#cargo');
    expect([...cargo.options].map((opcion) => opcion.value)).toContain('Monitor Producción');
  });

  it('valida los campos obligatorios antes de enviar', async () => {
    montaje = await montar();

    await enviar(montaje.contenedor);

    expect(montaje.contenedor.querySelectorAll('.error-campo').length).toBeGreaterThan(5);
    expect(montaje.contenedor.textContent).toContain('Ingresa tu nombre y apellido');
    expect(montaje.contenedor.textContent).toContain('Adjunta tu CV');
    expect(montaje.contenedor.textContent).toContain('Debes aceptar la política de privacidad');
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });

  it('formatea el RUT y el teléfono mientras se escriben', async () => {
    montaje = await montar();

    escribirCampo(montaje.contenedor, '#rut', '184529130');
    escribirCampo(montaje.contenedor, '#telefono', '955112233');

    expect(montaje.contenedor.querySelector('#rut').value).toBe('18.452.913-0');
    expect(montaje.contenedor.querySelector('#telefono').value).toBe('9 5511 2233');
  });

  it('rechaza un CV con formato no permitido', async () => {
    montaje = await montar();

    seleccionarArchivo(
      montaje.contenedor,
      '#cv',
      new File(['contenido'], 'cv.exe', { type: 'application/x-msdownload' }),
    );

    expect(montaje.contenedor.textContent).toContain('Formato no permitido');
    expect(mocks.mostrarToast).toHaveBeenCalledWith(
      'El CV debe ser PDF, DOC o DOCX de hasta 5 MB',
      'error',
    );
  });

  it('registra la postulación, guarda el folio y muestra la confirmación', async () => {
    mocks.apiPost.mockResolvedValue({ candidato: CANDIDATO });
    montaje = await montar();
    completarFormulario(montaje.contenedor);

    await enviar(montaje.contenedor);

    expect(mocks.apiPost).toHaveBeenCalledTimes(1);
    expect(mocks.apiPost.mock.calls[0][0]).toBe('/postulaciones');
    expect(montaje.contenedor.textContent).toContain('¡Postulación registrada!');
    expect(montaje.contenedor.textContent).toContain('AQ-2026-ABCD1234');
    expect(JSON.parse(localStorage.getItem('aquachile_ultima_postulacion'))).toMatchObject({
      folio: 'AQ-2026-ABCD1234',
      rut: '18.452.913-0',
    });
  });

  it('muestra los errores de campo devueltos por la API', async () => {
    mocks.apiPost.mockRejectedValue(
      Object.assign(new Error('Revisa los datos de la postulación'), {
        detalle: [{ campo: 'correo', mensaje: 'El correo ya está registrado' }],
      }),
    );
    montaje = await montar();
    completarFormulario(montaje.contenedor);

    await enviar(montaje.contenedor);

    expect(montaje.contenedor.textContent).toContain('El correo ya está registrado');
    expect(mocks.mostrarToast).toHaveBeenCalledWith('Revisa los datos de la postulación', 'error');
  });
});
