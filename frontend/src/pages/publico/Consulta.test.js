import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Consulta from './Consulta.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function montar() {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  act(() => {
    raiz.render(h(MemoryRouter, null, h(Consulta)));
  });

  return { contenedor, raiz };
}

function escribir(input, valor) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor.set.call(input, valor);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('Consulta pública', () => {
  let montaje = null;
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    if (montaje) {
      act(() => montaje.raiz.unmount());
      montaje.contenedor.remove();
      montaje = null;
    }
    globalThis.fetch = fetchOriginal;
  });

  it('valida folio y RUT antes de consultar', () => {
    montaje = montar();
    const formulario = montaje.contenedor.querySelector('form');

    act(() => {
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(montaje.contenedor.querySelectorAll('.error-campo').length).toBe(2);
    expect(montaje.contenedor.textContent).toContain('folio completo');
    expect(montaje.contenedor.textContent).toContain('RUT válido');
  });

  it('muestra el estado sin exponer datos personales sensibles', async () => {
    montaje = montar();
    const { contenedor } = montaje;
    const folio = contenedor.querySelector('#consulta-folio');
    const rut = contenedor.querySelector('#consulta-rut');

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          candidato: {
            folio: 'AQ-2026-ABCD1234',
            nombre: 'Ana Pérez',
            cargo: 'Monitor Producción',
            familiaCargo: 'Técnico B/C',
            estado: 'En Proceso',
            fechaPostulacion: '2026-10-01T10:00:00.000Z',
            fechaActualizacion: '2026-10-03T10:00:00.000Z',
            correo: 'ana@example.com',
            telefono: '912345678',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    act(() => {
      escribir(folio, 'AQ-2026-ABCD1234');
      escribir(rut, '12.345.678-5');
    });

    await act(async () => {
      contenedor
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((resolver) => setTimeout(resolver, 0));
    });

    expect(contenedor.textContent).toContain('Monitor Producción');
    expect(contenedor.textContent).toContain('En Proceso');
    expect(contenedor.textContent).toContain('AQ-2026-ABCD1234');
    expect(contenedor.textContent).not.toContain('ana@example.com');
    expect(contenedor.textContent).not.toContain('912345678');
  });
});
