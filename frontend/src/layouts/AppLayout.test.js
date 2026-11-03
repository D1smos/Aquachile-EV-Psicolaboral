import { act, createElement as h } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import AppLayout from './AppLayout.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const CLAVE_USUARIO = 'aquachile_usuario';

const usuarioDemo = {
  id: 'u1',
  nombre: 'Ana Pérez',
  email: 'ana@aquachile.cl',
  rol: 'psicologo',
};

function montar(ruta) {
  const contenedor = document.createElement('div');
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  const pagina = (texto) => h('p', { id: 'pagina' }, texto);

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
              Routes,
              null,
              h(
                Route,
                { element: h(AppLayout) },
                h(Route, { index: true, element: pagina('Inicio') }),
                h(Route, { path: 'postulacion', element: pagina('Postulación') }),
                h(Route, { path: 'dashboard', element: pagina('Panel') }),
              ),
            ),
          ),
        ),
      ),
    );
  });

  return { contenedor, raiz };
}

describe('AppLayout', () => {
  let montaje = null;

  afterEach(() => {
    if (montaje) {
      act(() => montaje.raiz.unmount());
      montaje.contenedor.remove();
      montaje = null;
    }
    localStorage.clear();
  });

  it('renderiza navbar, contenido y footer', () => {
    montaje = montar('/');
    const { contenedor } = montaje;

    expect(contenedor.querySelector('.app-layout')).not.toBeNull();
    expect(contenedor.querySelector('.barra-nav')).not.toBeNull();
    expect(contenedor.querySelector('.layout-main')).not.toBeNull();
    expect(contenedor.querySelector('.pie-pagina')).not.toBeNull();
  });

  it('muestra la página hija dentro del Outlet', () => {
    montaje = montar('/postulacion');

    expect(montaje.contenedor.querySelector('#pagina').textContent).toBe('Postulación');
  });

  it('navega entre rutas manteniendo el marco', () => {
    montaje = montar('/');
    const enlace = [...montaje.contenedor.querySelectorAll('.enlace-nav')].find(
      (nodo) => nodo.textContent === 'Postulación',
    );

    act(() => {
      enlace.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    });

    expect(montaje.contenedor.querySelector('#pagina').textContent).toBe('Postulación');
    expect(montaje.contenedor.querySelector('.barra-nav')).not.toBeNull();
    expect(montaje.contenedor.querySelector('.pie-pagina')).not.toBeNull();
  });

  it('abre y cierra el menú hamburguesa', () => {
    montaje = montar('/');
    const boton = montaje.contenedor.querySelector('.boton-menu');
    const navegacion = montaje.contenedor.querySelector('.navegacion');

    expect(boton.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      boton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(navegacion.classList.contains('navegacion-abierta')).toBe(true);

    act(() => {
      boton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(boton.getAttribute('aria-expanded')).toBe('false');
    expect(navegacion.classList.contains('navegacion-abierta')).toBe(false);
  });

  it('sin sesión muestra enlaces públicos e Ingresar', () => {
    montaje = montar('/');
    const textos = [...montaje.contenedor.querySelectorAll('.enlace-nav')].map(
      (nodo) => nodo.textContent,
    );

    expect(textos).toEqual(['Inicio', 'Postulación', 'Consultar estado']);
    expect(montaje.contenedor.querySelector('.navegacion').textContent).toContain(
      'Iniciar sesión',
    );
    expect(montaje.contenedor.querySelector('.barra-privada')).toBeNull();
    expect(montaje.contenedor.querySelector('.pie-compacto')).toBeNull();
  });

  it('con sesión en la ruta privada muestra sidebar, usuario y pie compacto', () => {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuarioDemo));
    montaje = montar('/dashboard');
    const { contenedor } = montaje;

    expect(contenedor.querySelector('.menu-lateral')).not.toBeNull();
    expect(contenedor.querySelector('.menu-usuario-datos strong').textContent).toBe('Ana Pérez');
    expect(contenedor.querySelector('.menu-usuario-datos small').textContent).toContain(
      'Evaluador',
    );
    expect(contenedor.textContent).toContain('Cerrar sesión');
    expect(contenedor.querySelector('.navegacion')).toBeNull();
    expect(contenedor.querySelector('.barra-nav')).toBeNull();
    expect(contenedor.querySelector('.pie-compacto')).not.toBeNull();
    expect(contenedor.querySelector('.layout-main').classList.contains('contenido-privado')).toBe(true);
    expect(contenedor.querySelector('.app-layout-privado').classList.contains('tema-rol-evaluador')).toBe(true);
  });

  it('aplica el tema visual de analista sin quitar el sidebar', () => {
    localStorage.setItem(
      CLAVE_USUARIO,
      JSON.stringify({ ...usuarioDemo, rol: 'analista' }),
    );
    montaje = montar('/dashboard');
    const { contenedor } = montaje;

    expect(contenedor.querySelector('.app-layout-privado').classList.contains('tema-rol-analista')).toBe(true);
    expect(contenedor.querySelector('.menu-lateral')).not.toBeNull();
    expect(contenedor.querySelector('.menu-usuario-datos small').textContent).toContain('Analista');
  });

  it('abre y cierra el menú lateral en móvil', () => {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuarioDemo));
    montaje = montar('/dashboard');
    const { contenedor } = montaje;
    const boton = contenedor.querySelector('.boton-menu-privado');
    const menu = contenedor.querySelector('.menu-lateral');

    expect(boton.getAttribute('aria-expanded')).toBe('false');
    expect(menu.classList.contains('menu-lateral-abierto')).toBe(false);

    act(() => {
      boton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(menu.classList.contains('menu-lateral-abierto')).toBe(true);
    expect(contenedor.querySelector('.menu-overlay')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    act(() => {
      contenedor
        .querySelector('.menu-cerrar')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(boton.getAttribute('aria-expanded')).toBe('false');
    expect(menu.classList.contains('menu-lateral-abierto')).toBe(false);
    expect(contenedor.querySelector('.menu-overlay')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('cierra el menú lateral con Escape', () => {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuarioDemo));
    montaje = montar('/dashboard');
    const { contenedor } = montaje;
    const boton = contenedor.querySelector('.boton-menu-privado');

    act(() => {
      boton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(contenedor.querySelector('.menu-lateral-abierto')).not.toBeNull();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(contenedor.querySelector('.menu-lateral-abierto')).toBeNull();
    expect(contenedor.querySelector('.menu-overlay')).toBeNull();
  });
});
