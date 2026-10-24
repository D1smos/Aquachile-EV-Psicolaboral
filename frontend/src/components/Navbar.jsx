import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Marca from './Marca.jsx';

export default function Navbar({ privada = false }) {
  const { usuario, cerrarSesion } = useAuth();
  const { mostrarToast } = useToast();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  const cerrarMenu = () => setMenuAbierto(false);

  const salir = () => {
    cerrarSesion();
    mostrarToast('Sesión cerrada correctamente', 'info');
    navegar('/login', { replace: true });
  };

  if (privada) {
    return (
      <header className="barra-nav barra-privada">
        <div className="contenedor barra-nav-interna">
          <Link to="/dashboard" className="enlace-marca">
            <Marca />
          </Link>

          <div className="barra-usuario">
            <span className="usuario-chip">
              <i className="bi bi-person-circle" aria-hidden="true" />
              <span className="usuario-datos">
                <strong>{usuario?.nombre}</strong>
                <small>{usuario?.email}</small>
              </span>
            </span>
            <button type="button" className="boton boton-secundario boton-sm" onClick={salir}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" /> Salir
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
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
  );
}
