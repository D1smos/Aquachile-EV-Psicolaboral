import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  evaluarRespuestas,
  formatearFecha,
  formatearPorcentaje,
  validarRespuestas,
} from '../utils/evaluacionUtils.js';
import CuestionarioEvaluacion from './CuestionarioEvaluacion.jsx';
import EstadoBadge from './EstadoBadge.jsx';

const RECOMENDACIONES = {
  alto: 'Priorizar entrevista',
  medio: 'Revisar brechas en entrevista',
  bajo: 'Perfil distante del cargo',
  'sin-datos': 'Afinidad CV ↔ cargo',
};

const recomendacionPorSemaforo = (semaforo) => RECOMENDACIONES[semaforo] ?? RECOMENDACIONES['sin-datos'];

export default function ModalEvaluacion({
  candidato,
  cuestionario,
  estados,
  onCerrar,
  onGuardar,
  onCambiarEstado,
  guardando,
}) {
  const { mostrarToast } = useToast();
  const [formulario, setFormulario] = useState(() => ({
    respuestas: { ...(candidato.respuestas ?? {}) },
    observaciones: candidato.observaciones ?? '',
    estado: candidato.estado,
  }));
  const [descargando, setDescargando] = useState(null);
  const [asistencia, setAsistencia] = useState(() =>
    candidato.resumenIA
      ? {
          resumen: candidato.resumenIA,
          afinidad: candidato.afinidadIA,
          borrador: candidato.borradorIA,
          coincidencias: [],
        }
      : null,
  );
  const [generando, setGenerando] = useState(false);
  const [ranking, setRanking] = useState(null);

  const cargarRanking = useCallback(async () => {
    try {
      const datos = await api.get(
        `/candidatos/comparar?cargo=${encodeURIComponent(candidato.cargo)}&candidatoId=${candidato.id}`,
      );
      setRanking(datos);
    } catch {
      setRanking(null);
    }
  }, [candidato.cargo, candidato.id]);

  useEffect(() => {
    if (Number.isFinite(asistencia?.afinidad)) {
      cargarRanking();
    }
  }, [asistencia?.afinidad, cargarRanking]);

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

  const validacion = useMemo(
    () => validarRespuestas(formulario.respuestas, cuestionario),
    [formulario.respuestas, cuestionario],
  );

  const previsualizacion = useMemo(
    () => evaluarRespuestas(formulario.respuestas, cuestionario),
    [formulario.respuestas, cuestionario],
  );

  const responder = (preguntaId, valor) => {
    setFormulario((previo) => ({
      ...previo,
      respuestas: { ...previo.respuestas, [preguntaId]: valor },
    }));
  };

  const descargar = async (archivo) => {
    setDescargando(archivo.id);
    try {
      await api.descargar(`/candidatos/${candidato.id}/archivos/${archivo.id}`, archivo.nombreOriginal);
    } catch (error) {
      mostrarToast(error.message, 'error');
    } finally {
      setDescargando(null);
    }
  };

  const cambiarEstado = (evento) => {
    const estado = evento.target.value;
    setFormulario((previo) => ({ ...previo, estado }));
    onCambiarEstado(candidato.id, estado);
  };

  const guardar = () => {
    if (!validacion.valido) {
      mostrarToast('Responde todas las preguntas antes de guardar', 'advertencia');
      return;
    }
    onGuardar(candidato.id, {
      respuestas: formulario.respuestas,
      observaciones: formulario.observaciones,
      estado: formulario.estado,
    });
  };

  const generarAsistencia = async () => {
    setGenerando(true);
    try {
      const datos = await api.post(`/candidatos/${candidato.id}/asistente`);
      setAsistencia(datos.asistencia);
      mostrarToast('Asistencia generada a partir del perfil y los documentos', 'exito');
      cargarRanking();
    } catch (error) {
      mostrarToast(error.message, 'error');
    } finally {
      setGenerando(false);
    }
  };

  const usarBorrador = () => {
    if (!asistencia?.borrador) {
      return;
    }
    setFormulario((previo) => ({ ...previo, observaciones: asistencia.borrador }));
    mostrarToast('Borrador copiado a las observaciones, revísalo antes de guardar', 'exito');
  };

  const archivos = candidato.archivos ?? [];

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCerrar}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Evaluación de ${candidato.nombre}`}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecera">
          <div>
            <span className="modal-eyebrow">Folio {candidato.folio}</span>
            <h3 className="modal-titulo">{candidato.nombre}</h3>
            <p className="modal-subtitulo">
              {candidato.rut} · {candidato.cargo} · {candidato.familiaCargo}
            </p>
          </div>
          <button
            type="button"
            className="boton-icono"
            aria-label="Cerrar evaluación"
            onClick={onCerrar}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div className="modal-cuerpo">
          <section className="modal-seccion">
            <h4 className="seccion-titulo">Datos de la postulación</h4>
            <dl className="datos-rejilla">
              <div>
                <dt>Correo</dt>
                <dd>{candidato.correo}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{candidato.telefono}</dd>
              </div>
              <div>
                <dt>Experiencia</dt>
                <dd>{candidato.aniosExperiencia} años</dd>
              </div>
              <div>
                <dt>Formación</dt>
                <dd>{candidato.formacion}</dd>
              </div>
              <div>
                <dt>Disponibilidad</dt>
                <dd>{candidato.disponibilidad}</dd>
              </div>
              <div>
                <dt>Postulación</dt>
                <dd>{formatearFecha(candidato.fechaPostulacion)}</dd>
              </div>
            </dl>

            <div className="estado-fila">
              <label className="etiqueta-campo" htmlFor="estado-proceso">
                Estado del proceso
              </label>
              <select
                id="estado-proceso"
                className="control-campo control-reducido"
                value={formulario.estado}
                onChange={cambiarEstado}
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
              <EstadoBadge estado={formulario.estado} />
            </div>

            <div className="archivos-fila">
              <span className="etiqueta-campo">Documentos adjuntos</span>
              {archivos.length === 0 ? (
                <small className="sin-adjuntos">El candidato no adjuntó documentos.</small>
              ) : (
                <div className="archivos-lista">
                  {archivos.map((archivo) => (
                    <button
                      key={archivo.id}
                      type="button"
                      className="boton-adjunto"
                      onClick={() => descargar(archivo)}
                      disabled={descargando === archivo.id}
                    >
                      <i className="bi bi-file-earmark-arrow-down" aria-hidden="true" />
                      {archivo.tipo === 'cv' ? 'Ver CV' : archivo.nombreOriginal}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="modal-seccion">
            <div className="seccion-cabecera">
              <h4 className="seccion-titulo">Asistente IA</h4>
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                onClick={generarAsistencia}
                disabled={generando}
              >
                {generando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Analizando…
                  </>
                ) : (
                  <>
                    <i className="bi bi-stars" aria-hidden="true" /> Generar asistencia
                  </>
                )}
              </button>
            </div>
            <small className="ayuda-campo">
              Apoyo automático a partir del perfil y el CV. No reemplaza la evaluación profesional.
            </small>
            {asistencia && (
              <div className="asistencia-resultado">
                <p>{asistencia.resumen}</p>
                {Number.isFinite(asistencia.afinidad) ? (
                  <div className="asistencia-afinidad">
                    <span className="puntaje-valor">{asistencia.afinidad}%</span>
                    <span className="puntaje-barra" aria-hidden="true">
                      <span
                        className={`puntaje-barra-relleno semaforo-${asistencia.semaforo ?? 'sin-datos'}`}
                        style={{ width: `${Math.min(asistencia.afinidad, 100)}%` }}
                      />
                    </span>
                    <small>{recomendacionPorSemaforo(asistencia.semaforo)}</small>
                  </div>
                ) : (
                  <small className="sin-adjuntos">Sin CV legible para calcular afinidad.</small>
                )}
                {asistencia.coincidencias?.length > 0 && (
                  <div className="chips">
                    {asistencia.coincidencias.map((clave) => (
                      <span key={clave} className="chip chip-ok">
                        {clave}
                      </span>
                    ))}
                  </div>
                )}
                {asistencia.faltantes?.length > 0 && (
                  <div className="chips">
                    <small>Brechas:</small>
                    {asistencia.faltantes.map((clave) => (
                      <span key={clave} className="chip chip-brecha">
                        {clave}
                      </span>
                    ))}
                  </div>
                )}
                {ranking && ranking.total > 0 && (
                  <small className="asistencia-ranking">
                    {ranking.posicion
                      ? `N° ${ranking.posicion} de ${ranking.total} en ${candidato.cargo} por afinidad`
                      : `${ranking.total} ${ranking.total === 1 ? 'candidato con afinidad' : 'candidatos con afinidad'} en ${candidato.cargo}`}
                  </small>
                )}
                <div className="asistencia-borrador">
                  <p>{asistencia.borrador}</p>
                  <button type="button" className="boton boton-secundario boton-sm" onClick={usarBorrador}>
                    <i className="bi bi-arrow-down-square" aria-hidden="true" /> Usar como observaciones
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="modal-seccion">
            <div className="seccion-cabecera">
              <h4 className="seccion-titulo">Cuestionario psicolaboral</h4>
              <span className={`indicador-validacion ${validacion.valido ? 'valido' : 'pendiente'}`}>
                {validacion.valido
                  ? 'Completo'
                  : `Faltan ${validacion.faltantes.length} respuesta${validacion.faltantes.length === 1 ? '' : 's'}`}
              </span>
            </div>

            <CuestionarioEvaluacion
              cuestionario={cuestionario}
              respuestas={formulario.respuestas}
              onRespuesta={responder}
              invalidas={validacion.faltantes}
            />
          </section>

          <section className="modal-seccion resumen-evaluacion">
            <h4 className="seccion-titulo">Resultado calculado</h4>
            <div className="resumen-principal">
              <div className="anillo-puntaje" style={{ '--puntaje': `${previsualizacion.puntaje}` }}>
                <span>{formatearPorcentaje(previsualizacion.puntaje)}</span>
              </div>
              <div className="resumen-dimensiones">
                {previsualizacion.dimensiones.map((dimension) => (
                  <div className="dimension-item" key={dimension.id}>
                    <div className="dimension-cabecera">
                      <span>{dimension.nombre}</span>
                      <strong>{formatearPorcentaje(dimension.puntaje)}</strong>
                    </div>
                    <span className="puntaje-barra">
                      <span
                        className="puntaje-barra-relleno"
                        style={{ width: `${Math.min(dimension.puntaje, 100)}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dictamen">
              <span className="etiqueta-campo">Idoneidad sugerida</span>
              <EstadoBadge idoneidad={previsualizacion.idoneidad} />
            </div>
          </section>

          <section className="modal-seccion">
            <label className="etiqueta-campo" htmlFor="observaciones">
              Observaciones del evaluador
            </label>
            <textarea
              id="observaciones"
              className="control-campo"
              rows={3}
              maxLength={1000}
              placeholder="Fortalezas, riesgos y recomendaciones del proceso…"
              value={formulario.observaciones}
              onChange={(evento) =>
                setFormulario((previo) => ({ ...previo, observaciones: evento.target.value }))
              }
            />
            <small className="contador">{formulario.observaciones.length}/1000</small>
          </section>
        </div>

        <footer className="modal-pie">
          <button type="button" className="boton boton-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="boton boton-primario"
            onClick={guardar}
            disabled={guardando || !validacion.valido}
          >
            {guardando ? (
              <>
                <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Guardando…
              </>
            ) : (
              <>
                <i className="bi bi-save" aria-hidden="true" /> Guardar evaluación
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
