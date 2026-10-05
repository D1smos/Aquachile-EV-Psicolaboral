import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      // Guardar el token y usuario en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // Redireccionar al Dashboard de Empresa
      navigate('/empresa/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '420px' }}>
      <div className="card shadow-lg border-0 rounded-4">
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-primary">AquaChile HR</h3>
            <p className="text-muted small">Plataforma de Evaluación Psicolaboral</p>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Correo Institucional</label>
              <input
                type="email"
                className="form-control"
                placeholder="psicologo@aquachile.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold"
              disabled={cargando}
            >
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-light rounded text-muted extra-small" style={{ fontSize: '0.8rem' }}>
            <strong>Credenciales de prueba:</strong><br />
            <strong>Email:</strong> psicologo@aquachile.cl<br />
            <strong>Clave:</strong> admin123
          </div>
        </div>
      </div>
    </div>
  );
}