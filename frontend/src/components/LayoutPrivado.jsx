import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Marca } from './LayoutPublico.jsx';

export default function LayoutPrivado({ children }) {
  const { usuario, cerrarSesion } = useAuth();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();

  const salir = () => {
    cerrarSesion();
    mostrarToast('Sesión cerrada correctamente', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-privada">
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

      <main className="contenido-principal contenido-privado animar-entrada">{children}</main>

      <footer className="pie-pagina pie-compacto">
        <div className="contenedor pie-interno">
          <p className="pie-legal">
            © {new Date().getFullYear()} AquaChile · Gestión de Evaluaciones Psicolaborales
          </p>
        </div>
      </footer>
    </div>
  );
}
