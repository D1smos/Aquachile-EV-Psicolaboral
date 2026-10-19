import { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  LIMITE_ARCHIVO_MB,
  archivoCvValido,
  formatearRut,
  formatearTelefono,
  validarPostulacion,
} from '../../utils/validaciones.js';

const FORM_INICIAL = {
  nombre: '',
  rut: '',
  correo: '',
  telefono: '',
  familiaCargo: '',
  cargo: '',
  formacion: '',
  disponibilidad: '',
  aniosExperiencia: '',
  motivacion: '',
};

const ARCHIVOS_MAXIMOS = 4;

function Campo({ id, etiqueta, error, children, ayuda }) {
  return (
    <div className={`campo-formulario ${error ? 'campo-con-error' : ''}`}>
      <label className="etiqueta-campo" htmlFor={id}>
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && <small className="ayuda-campo">{ayuda}</small>}
      {error && (
        <small className="error-campo" id={`${id}-error`}>
          <i className="bi bi-exclamation-circle" aria-hidden="true" /> {error}
        </small>
      )}
    </div>
  );
}

export default function Postulacion() {
  const { mostrarToast } = useToast();
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [cv, setCv] = useState(null);
  const [antecedentes, setAntecedentes] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(null);
  const [catalogo, setCatalogo] = useState(null);
  const [errorCatalogo, setErrorCatalogo] = useState(null);

  const cargarCatalogo = async () => {
    setErrorCatalogo(null);
    try {
      setCatalogo(await api.get('/catalogos'));
    } catch (error) {
      setErrorCatalogo(error.message);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const modificar = (evento) => {
    const { name, value } = evento.target;

    if (name === 'rut') {
      setFormulario((previo) => ({ ...previo, rut: formatearRut(value) }));
      return;
    }
    if (name === 'telefono') {
      setFormulario((previo) => ({ ...previo, telefono: formatearTelefono(value) }));
      return;
    }
    if (name === 'familiaCargo') {
      setFormulario((previo) => ({ ...previo, familiaCargo: value, cargo: '' }));
      return;
    }
    setFormulario((previo) => ({ ...previo, [name]: value }));
  };

  const seleccionarCv = (evento) => {
    const archivo = evento.target.files?.[0] ?? null;
    if (archivo && !archivoCvValido(archivo)) {
      setCv(null);
      evento.target.value = '';
      setErrores((previo) => ({
        ...previo,
        cv: `Formato no permitido o supera los ${LIMITE_ARCHIVO_MB} MB. Usa PDF, DOC o DOCX.`,
      }));
      mostrarToast('El CV debe ser PDF, DOC o DOCX de hasta 5 MB', 'error');
      return;
    }
    setErrores((previo) => ({ ...previo, cv: undefined }));
    setCv(archivo);
  };

  const seleccionarAntecedentes = (evento) => {
    const seleccionados = Array.from(evento.target.files ?? []);
    if (seleccionados.length > ARCHIVOS_MAXIMOS) {
      mostrarToast(`Puedes adjuntar como máximo ${ARCHIVOS_MAXIMOS} antecedentes`, 'advertencia');
      setAntecedentes(seleccionados.slice(0, ARCHIVOS_MAXIMOS));
      return;
    }
    setAntecedentes(seleccionados);
  };

  const limpiar = () => {
    setFormulario(FORM_INICIAL);
    setCv(null);
    setAntecedentes([]);
    setErrores({});
    setEnviado(null);
  };

  const enviar = async (evento) => {
    evento.preventDefault();

    const validacion = validarPostulacion(formulario, { cv });
    setErrores(validacion.errores);
    if (!validacion.valido) {
      mostrarToast('Revisa los campos marcados antes de enviar', 'advertencia');
      return;
    }

    setEnviando(true);
    const datos = new FormData();
    Object.entries(formulario).forEach(([clave, valor]) => datos.append(clave, valor));
    datos.append('cv', cv);
    antecedentes.forEach((archivo) => datos.append('antecedentes', archivo));

    try {
      const respuesta = await api.post('/postulaciones', datos);
      setEnviado(respuesta.candidato);
      mostrarToast('Postulación enviada correctamente', 'exito');
    } catch (error) {
      if (Array.isArray(error.detalle)) {
        const porCampo = Object.fromEntries(error.detalle.map((item) => [item.campo, item.mensaje]));
        setErrores((previo) => ({ ...previo, ...porCampo }));
      }
      mostrarToast(error.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <section className="seccion-confirmacion">
        <div className="tarjeta-confirmacion">
          <span className="confirmacion-icono" aria-hidden="true">
            <i className="bi bi-check-lg" />
          </span>
          <h1>¡Postulación registrada!</h1>
          <p className="confirmacion-folio">Folio de seguimiento: <strong>{enviado.folio}</strong></p>
          <p>
            Gracias <strong>{enviado.nombre}</strong>. Tu postulación para{' '}
            <strong>{enviado.cargo}</strong> quedó en estado <em>{enviado.estado}</em>. El equipo
            de selección revisará tu antecedente y te contactará por correo.
          </p>
          <button type="button" className="boton boton-primario" onClick={limpiar}>
            Registrar otra postulación
          </button>
        </div>
      </section>
    );
  }

  const familias = catalogo ? Object.keys(catalogo.familiasCargos) : [];
  const cargos = catalogo?.familiasCargos[formulario.familiaCargo] ?? [];

  return (
    <div className="pagina-postulacion">
      <section className="hero-postulacion">
        <div className="contenedor">
          <span className="hero-etiqueta">Proceso de selección</span>
          <h1>Postula a AquaChile</h1>
          <p>
            Completa tus datos, indica tu experiencia y adjunta tu CV. La evaluación psicolaboral
            se realiza una vez recibida tu postulación.
          </p>
        </div>
      </section>

      <section className="contenedor contenido-formulario">
        <form className="formulario-postulacion" onSubmit={enviar} noValidate>
          <fieldset className="bloque-formulario">
            <legend>
              <span className="bloque-numero">1</span> Datos personales
            </legend>
            <div className="rejilla-campos">
              <Campo id="nombre" etiqueta="Nombre y apellido" error={errores.nombre}>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  className="control-campo"
                  autoComplete="name"
                  maxLength={80}
                  placeholder="Ej: María José González"
                  value={formulario.nombre}
                  onChange={modificar}
                  aria-invalid={Boolean(errores.nombre)}
                />
              </Campo>

              <Campo id="rut" etiqueta="RUT" error={errores.rut}>
                <input
                  id="rut"
                  name="rut"
                  type="text"
                  className="control-campo"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="12.345.678-5"
                  value={formulario.rut}
                  onChange={modificar}
                  aria-invalid={Boolean(errores.rut)}
                />
              </Campo>

              <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  className="control-campo"
                  autoComplete="email"
                  placeholder="nombre@correo.cl"
                  value={formulario.correo}
                  onChange={modificar}
                  aria-invalid={Boolean(errores.correo)}
                />
              </Campo>

              <Campo
                id="telefono"
                etiqueta="Teléfono móvil"
                error={errores.telefono}
                ayuda="9 dígitos, comienza por 9"
              >
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  className="control-campo"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="9 1234 5678"
                  value={formulario.telefono}
                  onChange={modificar}
                  aria-invalid={Boolean(errores.telefono)}
                />
              </Campo>
            </div>
          </fieldset>

          <fieldset className="bloque-formulario">
            <legend>
              <span className="bloque-numero">2</span> Cargo postulado
            </legend>

            {!catalogo && !errorCatalogo && (
              <p className="estado-carga">
                <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Cargando
                catálogo de cargos…
              </p>
            )}

            {errorCatalogo && (
              <div className="alerta alerta-error" role="alert">
                <p>{errorCatalogo}</p>
                <button type="button" className="boton boton-secundario boton-sm" onClick={cargarCatalogo}>
                  Reintentar
                </button>
              </div>
            )}

            {catalogo && (
              <div className="rejilla-campos">
                <Campo id="familiaCargo" etiqueta="Familia de cargo" error={errores.familiaCargo}>
                  <select
                    id="familiaCargo"
                    name="familiaCargo"
                    className="control-campo"
                    value={formulario.familiaCargo}
                    onChange={modificar}
                    aria-invalid={Boolean(errores.familiaCargo)}
                  >
                    <option value="">Selecciona una familia…</option>
                    {familias.map((familia) => (
                      <option key={familia} value={familia}>
                        {familia}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo id="cargo" etiqueta="Cargo" error={errores.cargo}>
                  <select
                    id="cargo"
                    name="cargo"
                    className="control-campo"
                    value={formulario.cargo}
                    onChange={modificar}
                    disabled={!formulario.familiaCargo}
                    aria-invalid={Boolean(errores.cargo)}
                  >
                    <option value="">
                      {formulario.familiaCargo ? 'Selecciona un cargo…' : 'Elige primero la familia'}
                    </option>
                    {cargos.map((cargo) => (
                      <option key={cargo} value={cargo}>
                        {cargo}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo id="formacion" etiqueta="Formación académica" error={errores.formacion}>
                  <select
                    id="formacion"
                    name="formacion"
                    className="control-campo"
                    value={formulario.formacion}
                    onChange={modificar}
                    aria-invalid={Boolean(errores.formacion)}
                  >
                    <option value="">Selecciona…</option>
                    {catalogo.formaciones.map((formacion) => (
                      <option key={formacion} value={formacion}>
                        {formacion}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo
                  id="disponibilidad"
                  etiqueta="Disponibilidad"
                  error={errores.disponibilidad}
                >
                  <select
                    id="disponibilidad"
                    name="disponibilidad"
                    className="control-campo"
                    value={formulario.disponibilidad}
                    onChange={modificar}
                    aria-invalid={Boolean(errores.disponibilidad)}
                  >
                    <option value="">Selecciona…</option>
                    {catalogo.disponibilidades.map((disponibilidad) => (
                      <option key={disponibilidad} value={disponibilidad}>
                        {disponibilidad}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            )}
          </fieldset>

          <fieldset className="bloque-formulario">
            <legend>
              <span className="bloque-numero">3</span> Experiencia
            </legend>
            <div className="rejilla-campos">
              <Campo
                id="aniosExperiencia"
                etiqueta="Años de experiencia relacionada"
                error={errores.aniosExperiencia}
              >
                <input
                  id="aniosExperiencia"
                  name="aniosExperiencia"
                  type="number"
                  min={0}
                  max={45}
                  className="control-campo"
                  placeholder="Ej: 4"
                  value={formulario.aniosExperiencia}
                  onChange={modificar}
                  aria-invalid={Boolean(errores.aniosExperiencia)}
                />
              </Campo>

              <Campo
                id="motivacion"
                etiqueta="¿Por qué te interesa este cargo?"
                error={errores.motivacion}
                ayuda={`${formulario.motivacion.length}/500 caracteres`}
              >
                <textarea
                  id="motivacion"
                  name="motivacion"
                  className="control-campo"
                  rows={3}
                  maxLength={500}
                  placeholder="Cuéntanos brevemente tu motivación…"
                  value={formulario.motivacion}
                  onChange={modificar}
                />
              </Campo>
            </div>
          </fieldset>

          <fieldset className="bloque-formulario">
            <legend>
              <span className="bloque-numero">4</span> Documentos
            </legend>
            <div className="rejilla-campos">
              <Campo
                id="cv"
                etiqueta="Currículum vitae (obligatorio)"
                error={errores.cv}
                ayuda={`PDF, DOC o DOCX de hasta ${LIMITE_ARCHIVO_MB} MB`}
              >
                <div className="zona-archivo">
                  <i className="bi bi-upload" aria-hidden="true" />
                  <input
                    id="cv"
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={seleccionarCv}
                  />
                  <span>{cv ? cv.name : 'Arrastra o selecciona tu CV'}</span>
                </div>
              </Campo>

              <Campo
                id="antecedentes"
                etiqueta="Antecedentes complementarios"
                ayuda={`Opcional · hasta ${ARCHIVOS_MAXIMOS} archivos`}
              >
                <div className="zona-archivo">
                  <i className="bi bi-paperclip" aria-hidden="true" />
                  <input
                    id="antecedentes"
                    name="antecedentes"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={seleccionarAntecedentes}
                  />
                  <span>
                    {antecedentes.length > 0
                      ? `${antecedentes.length} archivo${antecedentes.length === 1 ? '' : 's'} seleccionado${antecedentes.length === 1 ? '' : 's'}`
                      : 'Certificados, títulos o cartas de recomendación'}
                  </span>
                </div>
              </Campo>
            </div>
          </fieldset>

          <div className="pie-formulario">
            <p className="nota-privacidad">
              <i className="bi bi-shield-check" aria-hidden="true" /> Tus datos se usan
              exclusivamente para el proceso de selección.
            </p>
            <button type="submit" className="boton boton-primario boton-lg" disabled={enviando}>
              {enviando ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Enviando…
                </>
              ) : (
                <>
                  Enviar postulación <i className="bi bi-arrow-right" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
