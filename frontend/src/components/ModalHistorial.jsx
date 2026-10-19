import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatearFecha } from '../utils/evaluacionUtils.js';

const textoEtapa = (evento) => {
  if (!evento.etapaAnterior) {
    return `Registro · ${evento.etapaNueva}`;
  }
  if (evento.etapaAnterior === evento.etapaNueva) {
    return `Actualización de ficha · ${evento.etapaNueva}`;
  }
  return `${evento.etapaAnterior} → ${evento.etapaNueva}`;
};

export default function ModalHistorial({ candidato, onCerrar }) {
  const { mostrarToast } = useToast();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    api
      .get(`/candidatos/${candidato.id}/historial`)
      .then((datos) => {
        if (activo) {
          setEventos(datos.historial);
        }
      })
      .catch((error) => {
        if (activo) {
          mostrarToast(error.message, 'error');
          onCerrar();
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [candidato.id, mostrarToast, onCerrar]);

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

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCerrar}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Historial de ${candidato.nombre}`}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecera">
          <div>
            <span className="modal-eyebrow">Folio {candidato.folio}</span>
            <h3 className="modal-titulo">Historial de etapas</h3>
            <p className="modal-subtitulo">
              {candidato.nombre} · {candidato.cargo}
            </p>
          </div>
          <button type="button" className="boton-icono" aria-label="Cerrar historial" onClick={onCerrar}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        <div className="modal-cuerpo">
          {cargando ? (
            <p className="modal-subtitulo">Cargando historial…</p>
          ) : eventos.length === 0 ? (
            <p className="modal-subtitulo">Aún no hay movimientos registrados.</p>
          ) : (
            <ol className="linea-tiempo">
              {eventos.map((evento) => (
                <li key={evento.id} className="linea-tiempo-item">
                  <span className="linea-tiempo-punto" aria-hidden="true" />
                  <div className="linea-tiempo-contenido">
                    <strong>{textoEtapa(evento)}</strong>
                    <small>
                      {formatearFecha(evento.creadoEn)}
                      {evento.responsable ? ` · ${evento.responsable}` : ''}
                    </small>
                    {evento.motivo && <p>{evento.motivo}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <footer className="modal-pie">
          <button type="button" className="boton boton-secundario" onClick={onCerrar}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
