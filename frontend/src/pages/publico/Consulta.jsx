import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import EstadoBadge from '../../components/EstadoBadge.jsx';
import { formatearFecha } from '../../utils/evaluacionUtils.js';
import { esRutValido, formatearRut } from '../../utils/validaciones.js';

const FOLIO_REGEX = /^AQ-\d{4}-[A-F0-9]{8}$/;

const FORM_INICIAL = { folio: '', rut: '' };

export default function Consulta() {
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [consultando, setConsultando] = useState(false);

  const modificar = (evento) => {
    const { name, value } = evento.target;
    setFormulario((previo) => ({
      ...previo,
      [name]:
        name === 'rut' ? formatearRut(value) : name === 'folio' ? value.toUpperCase() : value,
    }));
  };

  const validar = () => {
    const fallos = {};
    const folio = formulario.folio.trim().toUpperCase();
    if (!FOLIO_REGEX.test(folio)) {
      fallos.folio = 'Ingresa el folio completo, por ejemplo AQ-2026-ABC12345';
    }
    if (!esRutValido(formulario.rut)) {
      fallos.rut = 'Ingresa un RUT válido, por ejemplo 12.345.678-5';
    }
    setErrores(fallos);
    return Object.keys(fallos).length === 0;
  };

  const consultar = async (evento) => {
    evento.preventDefault();
    if (consultando || !validar()) {
      return;
    }

    setConsultando(true);
    setError(null);
    setResultado(null);
    try {
      const datos = await api.post('/postulaciones/consulta', {
        folio: formulario.folio.trim().toUpperCase(),
        rut: formulario.rut.trim(),
      });
      setResultado(datos.candidato);
    } catch (capturado) {
      setError(capturado.message);
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div className="pagina-postulacion">
      <section className="hero-postulacion">
        <div className="contenedor">
          <span className="hero-etiqueta">Seguimiento de postulación</span>
          <h1>Consulta el estado de tu postulación</h1>
          <p>
            Ingresa tu folio y RUT para revisar en qué etapa se encuentra tu proceso de selección.
          </p>
        </div>
      </section>

      <section className="contenedor contenido-formulario">
        {!resultado && (
          <form className="formulario-postulacion" onSubmit={consultar} noValidate>
            <fieldset className="bloque-formulario">
              <legend>
                <span className="bloque-numero">
                  <i className="bi bi-search" aria-hidden="true" />
                </span>
                Datos de la postulación
              </legend>
              <div className="rejilla-campos">
                <div className="campo-formulario">
                  <label className="etiqueta-campo" htmlFor="consulta-folio">
                    Folio de seguimiento
                  </label>
                  <input
                    id="consulta-folio"
                    name="folio"
                    type="text"
                    className="control-campo"
                    autoComplete="off"
                    maxLength={14}
                    placeholder="AQ-2026-ABC12345"
                    value={formulario.folio}
                    onChange={modificar}
                    aria-invalid={Boolean(errores.folio)}
                    aria-describedby={errores.folio ? 'consulta-folio-error' : undefined}
                    disabled={consultando}
                  />
                  {errores.folio && (
                    <small className="error-campo" id="consulta-folio-error">
                      {errores.folio}
                    </small>
                  )}
                </div>

                <div className="campo-formulario">
                  <label className="etiqueta-campo" htmlFor="consulta-rut">
                    RUT registrado
                  </label>
                  <input
                    id="consulta-rut"
                    name="rut"
                    type="text"
                    className="control-campo"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="12.345.678-5"
                    value={formulario.rut}
                    onChange={modificar}
                    aria-invalid={Boolean(errores.rut)}
                    aria-describedby={errores.rut ? 'consulta-rut-error' : undefined}
                    disabled={consultando}
                  />
                  {errores.rut && (
                    <small className="error-campo" id="consulta-rut-error">
                      {errores.rut}
                    </small>
                  )}
                </div>
              </div>
            </fieldset>

            {error && (
              <div className="alerta alerta-error" role="alert">
                <p>{error}</p>
              </div>
            )}

            <div className="pie-formulario">
              <p className="nota-privacidad">
                <i className="bi bi-shield-lock" aria-hidden="true" /> Consulta protegida: necesitas
                el folio y el RUT con los que postulaste.
              </p>
              <button type="submit" className="boton boton-primario" disabled={consultando}>
                {consultando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />{' '}
                    Consultando…
                  </>
                ) : (
                  <>
                    <i className="bi bi-search" aria-hidden="true" /> Consultar estado
                  </>
                )}
              </button>
            </div>

            <p className="consulta-ayuda">
              ¿Aún no has postulado? <Link to="/postulacion">Comienza tu postulación</Link>.
            </p>
          </form>
        )}

        {resultado && (
          <section className="seccion-confirmacion" aria-live="polite">
            <div className="tarjeta-confirmacion tarjeta-consulta">
              <span className="confirmacion-icono" aria-hidden="true">
                <i className="bi bi-clipboard2-pulse" />
              </span>
              <p className="consulta-eyebrow">Estado de tu postulación</p>
              <h1>{resultado.cargo}</h1>
              <p className="confirmacion-folio">{resultado.folio}</p>

              <dl className="consulta-datos">
                <div>
                  <dt>Postulante</dt>
                  <dd>{resultado.nombre}</dd>
                </div>
                <div>
                  <dt>Familia de cargo</dt>
                  <dd>{resultado.familiaCargo}</dd>
                </div>
                <div>
                  <dt>Fecha de postulación</dt>
                  <dd>{formatearFecha(resultado.fechaPostulacion)}</dd>
                </div>
                <div>
                  <dt>Última actualización</dt>
                  <dd>{formatearFecha(resultado.fechaActualizacion)}</dd>
                </div>
              </dl>

              <div className="consulta-estado">
                <span>Estado actual</span>
                <EstadoBadge estado={resultado.estado} />
              </div>

              <p className="consulta-nota">
                El equipo de Reclutamiento se contactará contigo si tu proceso avanza. Por seguridad,
                esta consulta no muestra correo, teléfono ni resultados de evaluación.
              </p>

              <div className="confirmacion-acciones">
                <button
                  type="button"
                  className="boton boton-secundario"
                  onClick={() => {
                    setResultado(null);
                    setFormulario(FORM_INICIAL);
                    setErrores({});
                  }}
                >
                  Consultar otra postulación
                </button>
                <Link to="/" className="boton boton-primario">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
