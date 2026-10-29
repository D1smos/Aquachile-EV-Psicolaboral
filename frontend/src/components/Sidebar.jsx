import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Marca from './Marca.jsx';

const SECCIONES = [
  { id: 'resumen', etiqueta: 'Resumen', icono: 'bi-grid-1x2-fill' },
  { id: 'metricas', etiqueta: 'Métricas', icono: 'bi-bar-chart-line-fill' },
  { id: 'candidatos', etiqueta: 'Candidatos', icono: 'bi-people-fill' },
];

const inicialesDe = (nombre) =>
  String(nombre ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || 'AC';

export default function Sidebar({ abierto = false, onCerrar }) {
  const { usuario, cerrarSesion } = useAuth();
  const { mostrarToast } = useToast();
  const navegar = useNavigate();
  const [activa, setActiva] = useState('resumen');

  const rol = usuario?.rol === 'psicologo' ? 'Evaluador' : 'Analista';

  useEffect(() => {
    const actualizar = () => {
      const metricas = document.getElementById('metricas');
      const candidatos = document.getElementById('candidatos');
      if (!metricas && !candidatos) {
        return;
      }

      const limite = window.scrollY + Math.min(96, window.innerHeight * 0.12);
      const inicioDe = (elemento) => elemento.getBoundingClientRect().top + window.scrollY;

      if (candidatos && limite >= inicioDe(candidatos) - 24) {
        setActiva('candidatos');
      } else if (metricas && limite >= inicioDe(metricas) - 24) {
        setActiva('metricas');
      } else {
        setActiva('resumen');
      }
    };

    actualizar();
    window.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);

    const panel = document.querySelector('.pagina-dashboard');
    const observador = panel ? new MutationObserver(actualizar) : null;
    observador?.observe(panel, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('scroll', actualizar);
      window.removeEventListener('resize', actualizar);
      observador?.disconnect();
    };
  }, []);

  const irASeccion = (id) => {
    setActiva(id);
    onCerrar?.();

    if (id === 'resumen') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const salir = () => {
    cerrarSesion();
    mostrarToast('Sesión cerrada correctamente', 'info');
    onCerrar?.();
    navegar('/login', { replace: true });
  };

  return (
    <aside
      id="menu-lateral"
      className={`menu-lateral${abierto ? ' menu-lateral-abierto' : ''}`}
      aria-label="Menú del panel"
    >
      <div className="menu-cabecera">
        <Link to="/dashboard" className="menu-marca" onClick={onCerrar}>
          <Marca />
        </Link>
        <button type="button" className="menu-cerrar" aria-label="Cerrar menú" onClick={onCerrar}>
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>

      <p className="menu-etiqueta">Panel interno</p>

      <nav className="menu-nav" aria-label="Secciones del panel">
        {SECCIONES.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            className={`menu-enlace${activa === seccion.id ? ' activo' : ''}`}
            aria-current={activa === seccion.id ? 'true' : undefined}
            onClick={() => irASeccion(seccion.id)}
          >
            <i className={`bi ${seccion.icono}`} aria-hidden="true" />
            <span>{seccion.etiqueta}</span>
          </button>
        ))}
      </nav>

      <div className="menu-secundario">
        <Link to="/" className="menu-enlace menu-enlace-suave" onClick={onCerrar}>
          <i className="bi bi-globe2" aria-hidden="true" />
          <span>Sitio público</span>
          <i className="bi bi-box-arrow-up-right menu-externo" aria-hidden="true" />
        </Link>
      </div>

      <div className="menu-pie">
        <div className="menu-usuario">
          <span className="menu-avatar" aria-hidden="true">
            {inicialesDe(usuario?.nombre)}
          </span>
          <div className="menu-usuario-datos">
            <strong>{usuario?.nombre ?? 'Usuario'}</strong>
            <small title={usuario?.email}>
              {rol} · {usuario?.email}
            </small>
          </div>
        </div>
        <button type="button" className="menu-salir" onClick={salir}>
          <i className="bi bi-box-arrow-right" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
