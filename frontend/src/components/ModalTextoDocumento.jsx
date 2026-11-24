import { useCallback, useEffect, useState } from 'react';
import {
  obtenerTextoDocumento,
  reprocesarDocumento,
} from '../services/analisisIA.js';

const ETIQUETAS_ESTADO = {
  ok: 'Texto extraído',
  sin_texto: 'Sin texto útil',
  error: 'Error de extracción',
  no_soportado: 'Formato no soportado',
};

export default function ModalTextoDocumento({
  candidatoId,
  archivo,
  puedeEvaluar = false,
  onCerrar,
  onReprocesado,
}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [reprocesando, setReprocesando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await obtenerTextoDocumento(candidatoId, archivo.id);
      setDatos(respuesta);
    } catch (capturado) {
      setError(capturado.message);
    } finally {
      setCargando(false);
    }
  }, [archivo.id, candidatoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    };
    document.addEventListener('keydown', alPulsarTecla);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPulsarTecla);
      document.body.style.overflow = '';
    };
  }, [onCerrar]);

  const reprocesar = async () => {
    setReprocesando(true);
    setError(null);
    try {
      await reprocesarDocumento(candidatoId, archivo.id);
      await cargar();
      onReprocesado?.();
    } catch (capturado) {
      setError(capturado.message);
    } finally {
      setReprocesando(false);
    }
  };

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCerrar}>
      <div
        className="modal-panel modal-texto-documento"
        role="dialog"
        aria-modal="true"
        aria-label={`Texto extraído de ${archivo.nombreOriginal}`}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecera">
          <div>
            <span className="modal-eyebrow">Texto extraído</span>
            <h3 className="modal-titulo">{archivo.nombreOriginal}</h3>
            <p className="modal-subtitulo">{archivo.tipo}</p>
          </div>
          <button type="button" className="boton-icono" aria-label="Cerrar texto extraído" onClick={onCerrar}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div className="modal-cuerpo">
          {cargando && (
            <div className="analisis-ia-estado-carga" role="status" aria-live="polite">
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              <span>Cargando texto extraído…</span>
            </div>
          )}

          {!cargando && error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" /> {error}
              <button type="button" className="boton boton-secundario boton-sm ms-2" onClick={cargar}>
                Reintentar
              </button>
            </div>
          )}

          {!cargando && datos && (
            <>
              <div className="documento-texto-meta">
                <span className={`badge rounded-pill ${datos.estado === 'ok' ? 'text-bg-success' : 'text-bg-warning'}`}>
                  {ETIQUETAS_ESTADO[datos.estado] ?? datos.estado}
                </span>
                <span>
                  <i className="bi bi-briefcase" aria-hidden="true" /> {datos.anosExperiencia ?? 0} años detectados
                </span>
                <span>
                  <i className="bi bi-file-text" aria-hidden="true" /> {datos.caracteres ?? 0} caracteres
                </span>
              </div>
              {datos.palabrasClave?.length > 0 && (
                <div className="analisis-ia-chips">
                  {datos.palabrasClave.map((palabra) => (
                    <span className="chip chip-ok" key={palabra}>
                      {palabra}
                    </span>
                  ))}
                </div>
              )}
              {datos.texto ? (
                <pre className="documento-texto-contenido">{datos.texto}</pre>
              ) : (
                <p className="analisis-ia-vacio">{datos.error ?? 'No se pudo extraer texto de este documento.'}</p>
              )}
            </>
          )}
        </div>

        <footer className="modal-pie">
          <button type="button" className="boton boton-secundario" onClick={onCerrar}>
            Cerrar
          </button>
          {puedeEvaluar && (
            <button
              type="button"
              className="boton boton-primario"
              onClick={reprocesar}
              disabled={cargando || reprocesando}
            >
              {reprocesando ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Reprocesando…
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-repeat" aria-hidden="true" /> Reprocesar texto
                </>
              )}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
