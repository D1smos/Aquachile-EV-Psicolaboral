import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.jsx';
import { ToastProvider } from '../../context/ToastContext.jsx';
import Login from './Login.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function montar() {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  act(() => {
    raiz.render(
      h(
        MemoryRouter,
        { initialEntries: ['/login'] },
        h(
          ToastProvider,
          null,
          h(
            AuthProvider,
            null,
            h(
              Routes,
              null,
              h(Route, { path: 'login', element: h(Login) }),
              h(Route, { path: 'dashboard', element: h('p', null, 'Panel') }),
            ),
          ),
        ),
      ),
    );
  });

  return { contenedor, raiz };
}

describe('Login', () => {
  let montaje = null;

  afterEach(() => {
    if (montaje) {
      act(() => montaje.raiz.unmount());
      montaje.contenedor.remove();
      montaje = null;
    }
    localStorage.clear();
  });

  it('muestra las cuentas de demostración bajo el formulario', () => {
    montaje = montar();
    const { contenedor } = montaje;

    expect(contenedor.querySelectorAll('.login-demo-cuenta').length).toBe(2);
    expect(contenedor.querySelector('.login-demo').textContent).toContain(
      'evaluador@aquachile.cl',
    );
    expect(contenedor.querySelector('.login-demo').textContent).toContain(
      'analista@aquachile.cl',
    );
    expect(contenedor.querySelector('.login-demo').textContent).toContain('AquaChile2026!');
  });

  it('completa las credenciales al usar una cuenta demo', () => {
    montaje = montar();
    const { contenedor } = montaje;
    const boton = contenedor.querySelector('[aria-label="Usar cuenta de evaluador"]');

    act(() => {
      boton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(contenedor.querySelector('#email').value).toBe('evaluador@aquachile.cl');
    expect(contenedor.querySelector('#password').value).toBe('AquaChile2026!');
  });
});
