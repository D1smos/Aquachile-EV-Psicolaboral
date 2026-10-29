import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Marca from './Marca.jsx';

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  const cerrarMenu = () => setMenuAbierto(false);

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
          <NavLink to="/consulta" className="enlace-nav" onClick={cerrarMenu}>
            Consultar estado
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
              Iniciar sesión
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
