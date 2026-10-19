import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { validarCredenciales } from '../../utils/validaciones.js';

export default function Login() {
  const { iniciarSesion, autenticado } = useAuth();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
  const ubicacion = useLocation();

  const destino = ubicacion.state?.origen ?? '/dashboard';
  const [credenciales, setCredenciales] = useState({ email: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const modificar = (evento) => {
    const { name, value } = evento.target;
    setCredenciales((previo) => ({ ...previo, [name]: value }));
    setErrores((previo) => ({ ...previo, [name]: undefined }));
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    const validacion = validarCredenciales(credenciales);
    setErrores(validacion.errores);
    setErrorServidor(null);

    if (!validacion.valido) {
      return;
    }

    setEnviando(true);
    try {
      const usuario = await iniciarSesion(credenciales);
      mostrarToast(`Bienvenido/a ${usuario.nombre}`, 'exito');
      navigate(destino, { replace: true });
    } catch (error) {
      setErrorServidor(error.message);
      mostrarToast(error.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (autenticado) {
    return <Navigate to={destino} replace />;
  }

  return (
    <div className="pagina-login">
      <aside className="login-marca">
        <div className="login-marca-contenido">
          <span className="hero-etiqueta">Área restringida</span>
          <h1>Evaluaciones psicolaborales</h1>
          <p>
            Accede al panel de seguimiento de postulantes, métricas del proceso y registro de
            evaluaciones de AquaChile.
          </p>
          <ul className="login-beneficios">
            <li>
              <i className="bi bi-check2-circle" aria-hidden="true" /> Seguimiento por estado del
              proceso
            </li>
            <li>
              <i className="bi bi-check2-circle" aria-hidden="true" /> Cuestionario psicolaboral
              estandarizado
            </li>
            <li>
              <i className="bi bi-check2-circle" aria-hidden="true" /> Métricas del proceso de
              selección
            </li>
          </ul>
        </div>
      </aside>

      <section className="login-formulario">
        <form className="tarjeta-login" onSubmit={enviar} noValidate>
          <span className="login-eyebrow">Inicio de sesión</span>
          <h2>Ingresa como evaluador</h2>

          {errorServidor && (
            <div className="alerta alerta-error" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" /> {errorServidor}
            </div>
          )}

          <div className={`campo-formulario ${errores.email ? 'campo-con-error' : ''}`}>
            <label className="etiqueta-campo" htmlFor="email">
              Correo electrónico
            </label>
            <div className="campo-con-icono">
              <i className="bi bi-envelope" aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                className="control-campo"
                autoComplete="username"
                placeholder="evaluador@aquachile.cl"
                value={credenciales.email}
                onChange={modificar}
                aria-invalid={Boolean(errores.email)}
              />
            </div>
            {errores.email && <small className="error-campo">{errores.email}</small>}
          </div>

          <div className={`campo-formulario ${errores.password ? 'campo-con-error' : ''}`}>
            <label className="etiqueta-campo" htmlFor="password">
              Contraseña
            </label>
            <div className="campo-con-icono">
              <i className="bi bi-lock" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={verPassword ? 'text' : 'password'}
                className="control-campo"
                autoComplete="current-password"
                placeholder="••••••••"
                value={credenciales.password}
                onChange={modificar}
                aria-invalid={Boolean(errores.password)}
              />
              <button
                type="button"
                className="boton-ojo"
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setVerPassword((visible) => !visible)}
              >
                <i className={`bi ${verPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
              </button>
            </div>
            {errores.password && <small className="error-campo">{errores.password}</small>}
          </div>

          <button type="submit" className="boton boton-primario boton-lg w-100" disabled={enviando}>
            {enviando ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Verificando…
              </>
            ) : (
              'Ingresar al panel'
            )}
          </button>

          <Link className="enlace-volver" to="/postulacion">
            <i className="bi bi-arrow-left" aria-hidden="true" /> Volver a la postulación
          </Link>
        </form>
      </section>
    </div>
  );
}
