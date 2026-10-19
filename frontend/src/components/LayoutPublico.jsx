import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Marca({ compacta = false }) {
  return (
    <span className={`marca ${compacta ? 'marca-compacta' : ''}`}>
      <span className="marca-logo" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="38" height="38" focusable="false">
          <circle cx="20" cy="20" r="18" fill="currentColor" opacity="0.15" />
          <path
            d="M7 25c3.6-4.6 7.2-4.6 10.8 0s7.2 4.6 10.8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M7 16c3.6-4.6 7.2-4.6 10.8 0s7.2 4.6 10.8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>
      <span className="marca-texto">
        <strong>AquaChile</strong>
        {!compacta && <small>Evaluaciones Psicolaborales</small>}
      </span>
    </span>
  );
}

export default function LayoutPublico() {
  const { usuario, cerrarSesion } = useAuth();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="app-publica">
      <header className="barra-nav">
        <div className="contenedor barra-nav-interna">
          <Link to="/" className="enlace-marca" onClick={cerrarMenu}>
            <Marca />
          </Link>

          <button
            type="button"
            className="boton-menu"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`navegacion ${menuAbierto ? 'navegacion-abierta' : ''}`}>
            <NavLink to="/" end className="enlace-nav" onClick={cerrarMenu}>
              Inicio
            </NavLink>
            <NavLink to="/postulacion" className="enlace-nav" onClick={cerrarMenu}>
              Postulación
            </NavLink>

            {usuario ? (
              <>
                <NavLink to="/dashboard" className="enlace-nav" onClick={cerrarMenu}>
                  Dashboard
                </NavLink>
                <button
                  type="button"
                  className="boton boton-secundario boton-sm"
                  onClick={() => {
                    cerrarMenu();
                    cerrarSesion();
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <NavLink to="/login" className="boton boton-primario boton-sm" onClick={cerrarMenu}>
                Ingresar
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main key={ubicacion.pathname} className="contenido-principal animar-entrada">
        <Outlet />
      </main>

      <footer className="pie-pagina">
        <div className="contenedor pie-interno">
          <Marca compacta />
          <p className="pie-texto">
            Plataforma interna de gestión de evaluaciones psicolaborales · Proceso de selección
            AquaChile
          </p>
          <p className="pie-legal">
            © {new Date().getFullYear()} AquaChile. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
