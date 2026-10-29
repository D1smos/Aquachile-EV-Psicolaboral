import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Privacidad from './Privacidad.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Política de privacidad', () => {
  let contenedor = null;
  let raiz = null;

  afterEach(() => {
    if (raiz) {
      act(() => raiz.unmount());
      contenedor.remove();
      raiz = null;
      contenedor = null;
    }
  });

  it('informa responsable, conservación y apoyo automatizado', () => {
    contenedor = document.createElement('div');
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);

    act(() => {
      raiz.render(h(MemoryRouter, null, h(Privacidad)));
    });

    const texto = contenedor.textContent;
    expect(texto).toContain('reclutamiento@aquachile.cl');
    expect(texto).toContain('12 meses');
    expect(texto).toContain('apoyo automático');
    expect(texto).toContain('no reemplaza la revisión profesional');
  });
});
