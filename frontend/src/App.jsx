import React, { useState, useEffect } from 'react';
import Inicio from './Inicio';
import Evaluaciones from './Evaluaciones';

// Componentes temporales (Placeholders) mientras desarrollamos cada módulo
const Postular = () => (
  <div className="card shadow-sm border-0 p-5 m-4 text-center rounded-4 bg-white">
    <div className="fs-1 text-primary mb-2">📋</div>
    <h3 className="fw-bold">Portal de Postulaciones</h3>
    <p className="text-muted">Formulario para registro de nuevos postulantes.</p>
  </div>
);

const Candidatos = () => (
  <div className="card shadow-sm border-0 p-5 m-4 text-center rounded-4 bg-white">
    <div className="fs-1 text-primary mb-2">👥</div>
    <h3 className="fw-bold">Nómina de Candidatos</h3>
    <p className="text-muted">Buscador centralizado y gestión de estados de postulantes.</p>
  </div>
);

const Dashboard = () => (
  <div className="card shadow-sm border-0 p-5 m-4 text-center rounded-4 bg-white">
    <div className="fs-1 text-primary mb-2">📊</div>
    <h3 className="fw-bold">Dashboard de Métricas</h3>
    <p className="text-muted">Estadísticas e indicadores del proceso de selección.</p>
  </div>
);

// Módulo de Login
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('mgonzalez@aquachile.cl');
  const [password, setPassword] = useState('123456');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulación de autenticación exitosa que retorna un token JWT
    onLogin('jwt-token-demo-aquachile-2026');
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card border-0 shadow-lg p-4 rounded-4" style={{ width: '400px' }}>
        <div className="text-center mb-4">
          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold mb-2">
            AquaChile Psicolaboral
          </span>
          <h4 className="fw-bold text-dark mt-1">Iniciar Sesión</h4>
          <p className="text-muted small">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Correo Electrónico</label>
            <input 
              type="email" 
              className="form-control rounded-3" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-bold">Contraseña</label>
            <input 
              type="password" 
              className="form-control rounded-3" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow-sm">
            Ingresar a la Plataforma
          </button>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [vistaActual, setVistaActual] = useState('inicio');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogin = (nuevoToken) => {
    setToken(nuevoToken);
    setVistaActual('inicio');
  };

  const handleLogout = () => {
    setToken(null);
    setVistaActual('inicio');
  };

  // Redirección al Login si no hay token de autenticación activo
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // Renderizado dinámico según la vista seleccionada
  const renderVista = () => {
    switch (vistaActual) {
      case 'inicio':
        return <Inicio onNavigate={setVistaActual} />;
      case 'postular':
        return <Postular />;
      case 'dashboard':
        return <Dashboard />;
      case 'candidatos':
        return <Candidatos />;
      case 'evaluaciones':
        return <Evaluaciones />;
      default:
        return <Inicio onNavigate={setVistaActual} />;
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Barra de Navegación Global */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 py-2 shadow-sm sticky-top">
        <div className="container-fluid px-0">
          <span 
            className="navbar-brand fw-bold d-flex align-items-center me-4 cursor-pointer" 
            style={{ cursor: 'pointer' }}
            onClick={() => setVistaActual('inicio')}
          >
            <span className="text-white">AquaChile</span>
            <span className="text-primary ms-1">Psicolaboral</span>
          </span>

          <div className="collapse navbar-collapse d-flex justify-content-between">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 small">
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link ${vistaActual === 'inicio' ? 'text-white fw-bold active' : 'text-white-50'}`}
                  onClick={() => setVistaActual('inicio')}
                >
                  Inicio
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link ${vistaActual === 'postular' ? 'text-white fw-bold active' : 'text-white-50'}`}
                  onClick={() => setVistaActual('postular')}
                >
                  Postular
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link ${vistaActual === 'dashboard' ? 'text-white fw-bold active' : 'text-white-50'}`}
                  onClick={() => setVistaActual('dashboard')}
                >
                  Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link ${vistaActual === 'candidatos' ? 'text-white fw-bold active' : 'text-white-50'}`}
                  onClick={() => setVistaActual('candidatos')}
                >
                  Candidatos
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link btn btn-link ${vistaActual === 'evaluaciones' ? 'text-white fw-bold active' : 'text-white-50'}`}
                  onClick={() => setVistaActual('evaluaciones')}
                >
                  Evaluaciones
                </button>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-3">
              <span className="text-light small d-flex align-items-center gap-1">
                👤 Dra. María González
              </span>
              <button 
                className="btn btn-outline-danger btn-sm px-3"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Área Principal de Contenido */}
      <main className="flex-grow-1">
        {renderVista()}
      </main>
    </div>
  );
}