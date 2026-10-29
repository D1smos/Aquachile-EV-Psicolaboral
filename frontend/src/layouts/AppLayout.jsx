import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Sidebar from '../components/Sidebar.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const { pathname } = useLocation();
  const privada = pathname.startsWith('/dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuAbierto) {
      return undefined;
    }

    const alRedimensionar = () => {
      if (window.innerWidth >= 1024) {
        setMenuAbierto(false);
      }
    };

    const overflowAnterior = document.body.style.overflow;
    const alPresionar = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alPresionar);
    window.addEventListener('resize', alRedimensionar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', alPresionar);
      window.removeEventListener('resize', alRedimensionar);
    };
  }, [menuAbierto]);

  if (privada) {
    return (
      <div className="app-layout app-layout-privado">
        <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

        {menuAbierto && (
          <button
            type="button"
            className="menu-overlay"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          />
        )}

        <div className="app-contenido-privado">
          <header className="barra-privada-movil">
            <button
              type="button"
              className="boton-menu-privado"
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              aria-controls="menu-lateral"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((abierto) => !abierto)}
            >
              <i className={`bi ${menuAbierto ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true" />
            </button>
            <span className="barra-privada-titulo">Panel de gestión</span>
          </header>

          <main className="layout-main contenido-privado animar-entrada">
            <Outlet />
          </main>

          <Footer compacto />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main key={pathname} className="layout-main animar-entrada">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
