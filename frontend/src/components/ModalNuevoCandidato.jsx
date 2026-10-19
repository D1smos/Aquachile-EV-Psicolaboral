import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  LIMITE_ARCHIVO_MB,
  archivoCvValido,
  esCorreoValido,
  esRutValido,
  esTelefonoValido,
  formatearRut,
} from '../utils/validaciones.js';

const EXTENSIONES_ANTECEDENTE = ['pdf', 'doc', 'docx', 'xlsx'];

const FORM_INICIAL = {
  nombre: '',
  rut: '',
  correo: '',
  telefono: '',
  familiaCargo: '',
  cargo: '',
  aniosExperiencia: '',
  formacion: '',
  disponibilidad: '',
  motivacion: '',
};

const extensionDe = (nombre) => String(nombre ?? '').split('.').pop()?.toLowerCase() ?? '';

const antecedenteValido = (archivo) =>
  Boolean(archivo) &&
  EXTENSIONES_ANTECEDENTE.includes(extensionDe(archivo.name)) &&
  archivo.size <= LIMITE_ARCHIVO_MB * 1024 * 1024;

export default function ModalNuevoCandidato({ catalogo, candidatoExistente = null, onCerrar, onGuardado }) {
  const { mostrarToast } = useToast();
  const esEdicion = Boolean(candidatoExistente);
  const [formulario, setFormulario] = useState(() =>
    esEdicion
      ? {
          nombre: candidatoExistente.nombre ?? '',
          rut: candidatoExistente.rut ?? '',
          correo: candidatoExistente.correo ?? '',
          telefono: candidatoExistente.telefono ?? '',
          familiaCargo: candidatoExistente.familiaCargo ?? '',
          cargo: candidatoExistente.cargo ?? '',
          aniosExperiencia: String(candidatoExistente.aniosExperiencia ?? ''),
          formacion: candidatoExistente.formacion ?? '',
          disponibilidad: candidatoExistente.disponibilidad ?? '',
          motivacion: candidatoExistente.motivacion ?? '',
        }
      : FORM_INICIAL,
  );
  const [cv, setCv] = useState(null);
  const [antecedentes, setAntecedentes] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const familias = Object.keys(catalogo?.familiasCargos ?? {});
  const cargos = catalogo?.familiasCargos?.[formulario.familiaCargo] ?? [];

  useEffect(() => {
    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    };
    document.addEventListener('keydown', alPulsarTecla);
    return () => document.removeEventListener('keydown', alPulsarTecla);
  }, [onCerrar]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const modificar = (evento) => {
    const { name, value } = evento.target;
    setFormulario((previo) => ({
      ...previo,
      [name]: name === 'rut' ? formatearRut(value) : value,
      ...(name === 'familiaCargo' ? { cargo: '' } : {}),
    }));
  };

  const validar = () => {
    const fallos = {};
    if (String(formulario.nombre).trim().length < 4) {
      fallos.nombre = 'Ingresa el nombre y apellido';
    }
    if (!esRutValido(formulario.rut)) {
      fallos.rut = 'Ingresa un RUT válido';
    }
    if (!esCorreoValido(formulario.correo)) {
      fallos.correo = 'Ingresa un correo electrónico válido';
    }
    if (!esTelefonoValido(formulario.telefono)) {
      fallos.telefono = 'Ingresa un móvil de 9 dígitos que comience por 9';
    }
    if (!formulario.familiaCargo) {
      fallos.familiaCargo = 'Selecciona la familia del cargo';
    }
    if (!formulario.cargo) {
      fallos.cargo = 'Selecciona el cargo';
    }
    const anios = Number(formulario.aniosExperiencia);
    if (!Number.isInteger(anios) || anios < 0 || anios > 45) {
      fallos.aniosExperiencia = 'Indica entre 0 y 45 años';
    }
    if (!formulario.formacion) {
      fallos.formacion = 'Selecciona la formación';
    }
    if (!formulario.disponibilidad) {
      fallos.disponibilidad = 'Selecciona la disponibilidad';
    }
    if (String(formulario.motivacion ?? '').length > 500) {
      fallos.motivacion = 'Máximo 500 caracteres';
    }
    if (cv && !archivoCvValido(cv)) {
      fallos.cv = 'El CV debe ser PDF, DOC o DOCX de hasta 5 MB';
    }
    const malos = antecedentes.filter((archivo) => !antecedenteValido(archivo));
    if (malos.length > 0) {
      fallos.antecedentes = 'Solo PDF, DOC, DOCX o XLSX de hasta 5 MB';
    }
    setErrores(fallos);
    return Object.keys(fallos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!validar() || enviando) {
      return;
    }
    setEnviando(true);
    try {
      if (esEdicion) {
        const respuesta = await api.put(`/candidatos/${candidatoExistente.id}`, formulario);
        mostrarToast(respuesta.mensaje, 'exito');
        onGuardado(respuesta.candidato, true);
        return;
      }
      const datos = new FormData();
      for (const [clave, valor] of Object.entries(formulario)) {
        datos.append(clave, valor);
      }
      if (cv) {
        datos.append('cv', cv);
      }
      for (const archivo of antecedentes) {
        datos.append('antecedentes', archivo);
      }
      const respuesta = await api.post('/candidatos', datos);
      mostrarToast(respuesta.mensaje, 'exito');
      onGuardado(respuesta.candidato, false);
    } catch (error) {
      mostrarToast(error.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const campo = (nombre, etiqueta, tipo = 'text', props = {}) => (
    <div>
      <label className="etiqueta-campo" htmlFor={`nuevo-${nombre}`}>
        {etiqueta}
      </label>
      <input
        id={`nuevo-${nombre}`}
        name={nombre}
        type={tipo}
        className="control-campo"
        value={formulario[nombre]}
        onChange={modificar}
        disabled={enviando}
        {...props}
      />
      {errores[nombre] && <p className="error-campo">{errores[nombre]}</p>}
    </div>
  );

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCerrar}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Registrar candidato manualmente"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecera">
          <div>
            <span className="modal-eyebrow">Registro interno</span>
            <h3 className="modal-titulo">{esEdicion ? 'Editar candidato' : 'Nuevo candidato'}</h3>
            <p className="modal-subtitulo">
              {esEdicion
                ? `Folio ${candidatoExistente.folio}`
                : 'El CV es opcional en el registro manual'}
            </p>
          </div>
          <button type="button" className="boton-icono" aria-label="Cerrar registro" onClick={onCerrar}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <form className="modal-cuerpo" onSubmit={enviar} noValidate>
          <div className="rejilla-campos">
            {campo('nombre', 'Nombre y apellido')}
            {campo('rut', 'RUT', 'text', { placeholder: '12.345.678-5', inputMode: 'numeric' })}
            {campo('correo', 'Correo electrónico', 'email')}
            {campo('telefono', 'Teléfono móvil', 'tel', { placeholder: '912345678' })}
            <div>
              <label className="etiqueta-campo" htmlFor="nuevo-familiaCargo">
                Familia del cargo
              </label>
              <select
                id="nuevo-familiaCargo"
                name="familiaCargo"
                className="control-campo"
                value={formulario.familiaCargo}
                onChange={modificar}
                disabled={enviando}
              >
                <option value="">Selecciona…</option>
                {familias.map((familia) => (
                  <option key={familia} value={familia}>
                    {familia}
                  </option>
                ))}
              </select>
              {errores.familiaCargo && <p className="error-campo">{errores.familiaCargo}</p>}
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="nuevo-cargo">
                Cargo
              </label>
              <select
                id="nuevo-cargo"
                name="cargo"
                className="control-campo"
                value={formulario.cargo}
                onChange={modificar}
                disabled={enviando || cargos.length === 0}
              >
                <option value="">Selecciona…</option>
                {cargos.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
              {errores.cargo && <p className="error-campo">{errores.cargo}</p>}
            </div>
            {campo('aniosExperiencia', 'Años de experiencia', 'number', { min: 0, max: 45 })}
            <div>
              <label className="etiqueta-campo" htmlFor="nuevo-formacion">
                Formación
              </label>
              <select
                id="nuevo-formacion"
                name="formacion"
                className="control-campo"
                value={formulario.formacion}
                onChange={modificar}
                disabled={enviando}
              >
                <option value="">Selecciona…</option>
                {(catalogo?.formaciones ?? []).map((formacion) => (
                  <option key={formacion} value={formacion}>
                    {formacion}
                  </option>
                ))}
              </select>
              {errores.formacion && <p className="error-campo">{errores.formacion}</p>}
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="nuevo-disponibilidad">
                Disponibilidad
              </label>
              <select
                id="nuevo-disponibilidad"
                name="disponibilidad"
                className="control-campo"
                value={formulario.disponibilidad}
                onChange={modificar}
                disabled={enviando}
              >
                <option value="">Selecciona…</option>
                {(catalogo?.disponibilidades ?? []).map((disponibilidad) => (
                  <option key={disponibilidad} value={disponibilidad}>
                    {disponibilidad}
                  </option>
                ))}
              </select>
              {errores.disponibilidad && <p className="error-campo">{errores.disponibilidad}</p>}
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="nuevo-motivacion">
                Motivación (opcional)
              </label>
              <textarea
                id="nuevo-motivacion"
                name="motivacion"
                className="control-campo"
                rows={2}
                value={formulario.motivacion}
                onChange={modificar}
                disabled={enviando}
              />
              {errores.motivacion && <p className="error-campo">{errores.motivacion}</p>}
            </div>
            {!esEdicion && (
              <>
                <div>
                  <label className="etiqueta-campo" htmlFor="nuevo-cv">
                    CV (opcional)
                  </label>
              <input
                id="nuevo-cv"
                type="file"
                className="control-campo"
                accept=".pdf,.doc,.docx"
                onChange={(evento) => setCv(evento.target.files?.[0] ?? null)}
                disabled={enviando}
              />
              {errores.cv && <p className="error-campo">{errores.cv}</p>}
            </div>
            <div>
              <label className="etiqueta-campo" htmlFor="nuevo-antecedentes">
                Antecedentes (opcional)
              </label>
              <input
                id="nuevo-antecedentes"
                type="file"
                multiple
                className="control-campo"
                accept=".pdf,.doc,.docx,.xlsx"
                onChange={(evento) => setAntecedentes([...(evento.target.files ?? [])])}
                disabled={enviando}
              />
              {errores.antecedentes && <p className="error-campo">{errores.antecedentes}</p>}
            </div>
              </>
            )}
          </div>

          <footer className="modal-pie">
            <button type="button" className="boton boton-secundario" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="boton boton-primario" disabled={enviando}>
              {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar candidato'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
