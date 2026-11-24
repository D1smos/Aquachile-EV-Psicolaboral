import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

const montar = (ruta = '/ruta-inexistente') =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );

describe('App', () => {
  afterEach(cleanup);

  it('muestra la página 404 y los enlaces de recuperación', () => {
    montar();
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ir al inicio/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Postular/i })).toHaveAttribute('href', '/postulacion');
  });

  it('mantiene la navegación pública en la ruta de inicio', () => {
    montar('/login');
    expect(screen.getByRole('heading', { name: /Ingresa a tu panel/i })).toBeInTheDocument();
  });
});
