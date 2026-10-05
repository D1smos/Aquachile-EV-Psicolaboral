import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const usuarioRaw = localStorage.getItem('usuario');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          AquaChile <span className="text-primary">Psicolaboral</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Inicio</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/postulacion">Postular</Link>
            </li>

            {/* Enlaces visibles únicamente con sesión activa */}
            {token && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/empresa/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/empresa/candidatos">Candidatos</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/empresa/evaluaciones">Evaluaciones</Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            {token ? (
              <>
                <span className="text-light small">
                  👤 {usuario?.nombre || 'Usuario'}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm fw-bold">
                Acceso Reclutadores
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}