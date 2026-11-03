import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import Navbar from './Navbar.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CLAVE_USUARIO = 'aquachile_usuario';

function montar(ruta = '/') {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  act(() => {
    raiz.render(
      h(
        MemoryRouter,
        { initialEntries: [ruta] },
        h(
          ToastProvider,
          null,
          h(
            AuthProvider,
            null,
            h(
              'div',
              null,
              h(Navbar),
              h(
                Routes,
                null,
                h(Route, { index: true, element: h('h1', null, 'Inicio') }),
                h(Route, { path: 'postulacion', element: h('h1', null, 'Postulación') }),
                h(Route, { path: 'dashboard', element: h('h1', null, 'Dashboard') }),
              ),
            ),
          ),
        ),
      ),
    );
  });

  return { contenedor, raiz };
}

describe('Navbar', () => {
  let montaje = null;

  afterEach(() => {
    if (montaje) {
      act(() => montaje.raiz.unmount());
      montaje.contenedor.remove();
      montaje = null;
    }
    localStorage.clear();
  });

  it('muestra los enlaces públicos y el acceso al login sin sesión', () => {
    montaje = montar('/');
    const enlaces = [...montaje.contenedor.querySelectorAll('.enlace-nav')].map(
      (nodo) => nodo.textContent,
    );

    expect(enlaces).toEqual(['Inicio', 'Postulación', 'Consultar estado']);
    expect(montaje.contenedor.textContent).toContain('Iniciar sesión');
    expect(montaje.contenedor.querySelector('a[href="/dashboard"]')).toBeNull();
  });

  it('navega a la postulación al hacer clic y marca el enlace activo', () => {
    montaje = montar('/');
    const enlace = [...montaje.contenedor.querySelectorAll('.enlace-nav')].find(
      (nodo) => nodo.textContent === 'Postulación',
    );

    act(() => {
      enlace.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(montaje.contenedor.querySelector('h1').textContent).toBe('Postulación');
    expect(montaje.contenedor.querySelector('.enlace-nav.active').textContent).toBe('Postulación');
  });

  it('muestra el acceso al panel y cerrar sesión cuando hay usuario', () => {
    localStorage.setItem(
      CLAVE_USUARIO,
      JSON.stringify({ id: 'u1', nombre: 'Ana Pérez', email: 'ana@aquachile.cl', rol: 'analista' }),
    );
    montaje = montar('/');
    const { contenedor } = montaje;

    expect(contenedor.textContent).toContain('Dashboard');
    expect(contenedor.textContent).toContain('Cerrar sesión');
    expect(contenedor.querySelector('a[href="/dashboard"]')).not.toBeNull();
  });
});
