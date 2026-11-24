import { useState } from 'react';
import useAnalisisIA from '../../hooks/useAnalisisIA.js';
import { solicitarAsistenciaEvaluacion } from '../../services/analisisIA.js';
import EstadoAnalisis from './EstadoAnalisis.jsx';
import ListaEvidencias from './ListaEvidencias.jsx';
import TarjetaCompetencia from './TarjetaCompetencia.jsx';

const ETIQUETAS_RECOMENDACION = {
  avanzar: 'Avanzar',
  revisar: 'Revisar',
  descartar: 'Descartar',
};

const CLASES_RECOMENDACION = {
  avanzar: 'text-bg-success',
  revisar: 'text-bg-warning',
  descartar: 'text-bg-secondary',
};

function Hallazgo({ item }) {
  return (
    <article className="analisis-ia-hallazgo">
      <strong>{item.titulo ?? 'Hallazgo'}</strong>
      <ListaEvidencias evidencias={item.evidencia} vacio="Sin detalle adicional." />
      {item.documento && <small>Fuente: {item.documento}</small>}
    </article>
  );
}

export default function PanelAnalisisIA({ candidato, puedeEvaluar = false }) {
  const {
    analisis,
    cargando,
    error,
    cacheHit,
    cargar,
    generar,
    forzar,
    revisar,
  } = useAnalisisIA(candidato?.id);
  const [accion, setAccion] = useState(null);
  const [asistencia, setAsistencia] = useState(null);
  const [generandoAsistencia, setGenerandoAsistencia] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState(null);

  const resultado = analisis?.resultado ?? null;
  const cargo = candidato?.cargo ?? '';
  const competencias = resultado?.competencias ?? [];
  const fortalezas = resultado?.fortalezas ?? [];
  const brechas = resultado?.brechas ?? [];
  const preguntas = resultado?.preguntasEntrevista ?? [];
  const recomendacion = resultado?.recomendacion ?? null;

  const ejecutar = async (nombre, tarea) => {
    setAccion(nombre);
    await tarea();
    setAccion(null);
  };

  const generarAnalisis = (conFuerza = false) =>
    ejecutar(conFuerza ? 'forzar' : 'generar', () =>
      conFuerza ? forzar({ cargo }) : generar({ cargo }),
    );

  const marcarRevision = (estado) =>
    ejecutar(estado, () => revisar({ estado }));

  const generarObservacion = async () => {
    setGenerandoAsistencia(true);
    setErrorAsistencia(null);
    try {
      const datos = await solicitarAsistenciaEvaluacion(candidato.id, {
        respuestas: candidato.respuestas ?? {},
        puntaje: candidato.puntaje,
        idoneidad: candidato.idoneidad,
        dimensiones: candidato.dimensiones ?? [],
        observaciones: candidato.observaciones ?? '',
      });
      setAsistencia(datos.asistencia ?? null);
    } catch (capturado) {
      setErrorAsistencia(capturado.message);
    } finally {
      setGenerandoAsistencia(false);
    }
  };

  return (
    <section className="analisis-ia-panel" aria-label="Análisis IA del candidato">
      <div className="analisis-ia-panel-titulo">
        <div>
          <span className="analisis-ia-eyebrow">
            <i className="bi bi-stars" aria-hidden="true" /> Apoyo a la evaluación
          </span>
          <h2>Análisis IA del currículum</h2>
        </div>
        {analisis && (
          <button
            type="button"
            className="boton boton-secundario boton-sm"
            onClick={cargar}
            disabled={cargando}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Actualizar
          </button>
        )}
      </div>

      {cargando && !analisis && (
        <div className="analisis-ia-estado-carga" role="status" aria-live="polite">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>Cargando análisis IA…</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-2" role="alert">
          <span>
            <i className="bi bi-exclamation-triangle" aria-hidden="true" /> {error}
          </span>
          {!analisis && (
            <button type="button" className="boton boton-secundario boton-sm" onClick={cargar}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {!cargando && !analisis && !error && (
        <div className="analisis-ia-vacio-panel">
          <i className="bi bi-robot" aria-hidden="true" />
          <p>Todavía no hay un análisis IA para este candidato.</p>
          {puedeEvaluar ? (
            <button
              type="button"
              className="boton boton-primario"
              onClick={() => generarAnalisis(false)}
              disabled={Boolean(accion)}
            >
              {accion === 'generar' ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Generando…
                </>
              ) : (
                <>
                  <i className="bi bi-stars" aria-hidden="true" /> Generar análisis IA
                </>
              )}
            </button>
          ) : (
            <small>La generación está disponible para el perfil evaluador.</small>
          )}
        </div>
      )}

      {analisis && (
        <>
          <EstadoAnalisis analisis={analisis} cacheHit={cacheHit} />

          <section className="analisis-ia-bloque analisis-ia-asistencia">
            <div className="analisis-ia-asistencia-cabecera">
              <div>
                <h4><i className="bi bi-pencil-square" aria-hidden="true" /> Observación asistida para el informe</h4>
                <small>Se construye con el CV y los puntajes/notas registrados para este candidato.</small>
              </div>
              {puedeEvaluar && (
                <button
                  type="button"
                  className="boton boton-secundario boton-sm"
                  onClick={generarObservacion}
                  disabled={generandoAsistencia}
                >
                  {generandoAsistencia ? (
                    <>
                      <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Generando…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars" aria-hidden="true" /> Actualizar observación
                    </>
                  )}
                </button>
              )}
            </div>
            {errorAsistencia && (
              <div className="alert alert-danger" role="alert">{errorAsistencia}</div>
            )}
            {asistencia ? (
              <div className="asistencia-resultado">
                <span className={`chip ${asistencia.fuente === 'ia' ? 'chip-ok' : 'chip-brecha'}`}>
                  {asistencia.fuente === 'ia' ? 'IA' : 'Asistencia local'}
                </span>
                {asistencia.datosClave && (
                  <div className="asistencia-datos-clave">
                    <small>Datos clave del CV</small>
                    <p>{asistencia.datosClave.resumenEjecutivo}</p>
                    <div className="asistencia-datos-clave-meta">
                      <span><i className="bi bi-briefcase" aria-hidden="true" /> {asistencia.datosClave.cargo || candidato.cargo}</span>
                      <span><i className="bi bi-clock-history" aria-hidden="true" /> {asistencia.datosClave.anosExperienciaEstimados} años estimados</span>
                    </div>
                    {asistencia.datosClave.palabrasClave?.length > 0 && (
                      <div className="chips">
                        {asistencia.datosClave.palabrasClave.map((clave) => (
                          <span key={clave} className="chip chip-ok">{clave}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="asistencia-borrador">
                  <p>{asistencia.borradorObservacion ?? asistencia.asistenciaObservacion}</p>
                </div>
              </div>
            ) : (
              !generandoAsistencia && (
                <p className="analisis-ia-vacio">
                  Pide una actualización para redactar la observación con los puntajes actuales.
                </p>
              )
            )}
          </section>

          <div className="analisis-ia-grid">
            <section className="analisis-ia-bloque">
              <h4>
                <i className="bi bi-check-circle" aria-hidden="true" /> Fortalezas
              </h4>
              {fortalezas.length === 0 ? (
                <p className="analisis-ia-vacio">Sin fortalezas destacadas.</p>
              ) : (
                fortalezas.map((item, indice) => <Hallazgo item={item} key={`${item.titulo}-${indice}`} />)
              )}
            </section>

            <section className="analisis-ia-bloque">
              <h4>
                <i className="bi bi-exclamation-circle" aria-hidden="true" /> Brechas
              </h4>
              {brechas.length === 0 ? (
                <p className="analisis-ia-vacio">Sin brechas relevantes detectadas.</p>
              ) : (
                brechas.map((item, indice) => <Hallazgo item={item} key={`${item.titulo}-${indice}`} />)
              )}
            </section>
          </div>

          <section className="analisis-ia-bloque">
            <h4>
              <i className="bi bi-diagram-3" aria-hidden="true" /> Competencias
            </h4>
            {competencias.length === 0 ? (
              <p className="analisis-ia-vacio">Sin competencias evaluadas.</p>
            ) : (
              <div className="analisis-ia-competencias">
                {competencias.map((competencia, indice) => (
                  <TarjetaCompetencia
                    competencia={competencia}
                    key={`${competencia.id ?? competencia.nombre}-${indice}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="analisis-ia-bloque">
            <h4>
              <i className="bi bi-chat-square-quote" aria-hidden="true" /> Preguntas sugeridas para entrevista
            </h4>
            {preguntas.length === 0 ? (
              <p className="analisis-ia-vacio">Sin preguntas sugeridas.</p>
            ) : (
              <ol className="analisis-ia-preguntas">
                {preguntas.map((pregunta, indice) => (
                  <li key={`${pregunta.pregunta}-${indice}`}>
                    <strong>{pregunta.pregunta}</strong>
                    <p>{pregunta.objetivo}</p>
                    {pregunta.competenciaId && <small>Competencia: {pregunta.competenciaId}</small>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {recomendacion && (
            <div className="analisis-ia-recomendacion">
              <span className={`badge rounded-pill ${CLASES_RECOMENDACION[recomendacion.codigo] ?? 'text-bg-light'}`}>
                Recomendación: {ETIQUETAS_RECOMENDACION[recomendacion.codigo] ?? recomendacion.codigo}
              </span>
              <p>{recomendacion.texto}</p>
            </div>
          )}

          <div className="analisis-ia-aviso" role="note">
            <i className="bi bi-person-check" aria-hidden="true" />
            <p>
              <strong>Borrador generado por IA sujeto a validación del evaluador.</strong>{' '}
              No reemplaza la entrevista ni el juicio profesional.
            </p>
          </div>

          {puedeEvaluar && (
            <div className="analisis-ia-acciones">
              <button
                type="button"
                className="boton boton-primario"
                onClick={() => marcarRevision('revisado')}
                disabled={cargando || analisis.estado === 'revisado'}
              >
                {accion === 'revisado' ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Guardando…
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle" aria-hidden="true" /> Aprobar / Marcar revisado
                  </>
                )}
              </button>
              <button
                type="button"
                className="boton boton-peligro"
                onClick={() => marcarRevision('descartado')}
                disabled={cargando || analisis.estado === 'descartado'}
              >
                <i className="bi bi-x-circle" aria-hidden="true" /> Descartar
              </button>
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => generarAnalisis(true)}
                disabled={cargando}
              >
                {accion === 'forzar' ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Re-analizando…
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat" aria-hidden="true" /> Re-analizar (Forzar)
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
