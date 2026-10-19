import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function PantallaCargando() {
  return (
    <div className="pantalla-carga" role="status" aria-live="polite">
      <div className="spinner-border text-primary" aria-hidden="true" />
      <p>Verificando sesión…</p>
    </div>
  );
}

export default function RutaProtegida({ children }) {
  const { autenticado, verificando } = useAuth();
  const ubicacion = useLocation();

  if (verificando) {
    return <PantallaCargando />;
  }

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ origen: `${ubicacion.pathname}${ubicacion.search}` }}
      />
    );
  }

  return children;
}
