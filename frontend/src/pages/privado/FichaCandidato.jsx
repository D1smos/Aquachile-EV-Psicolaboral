import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import EstadoBadge from '../../components/EstadoBadge.jsx';
import DocumentosCandidato from '../../components/DocumentosCandidato.jsx';
import PanelAnalisisIA from '../../components/ia/PanelAnalisisIA.jsx';
import { formatearFecha, formatearPorcentaje } from '../../utils/evaluacionUtils.js';
import './ficha-impresion.css';

const Campo = ({ etiqueta, children }) => (
  <div className="ficha-campo">
    <small>{etiqueta}</small>
    <strong>{children ?? '—'}</strong>
  </div>
);

export default function FichaCandidato() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const puedeEvaluar = usuario?.rol === 'psicologo';
  const [ficha, setFicha] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await api.get(`/candidatos/${id}/ficha`);
      setFicha(datos);
    } catch (capturado) {
      setError(capturado.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const candidato = ficha?.candidato;
  const historial = ficha?.historial ?? [];

  const abrirArchivo = async (archivo, modo) => {
    try {
      const datos = await api.get(
        `/candidatos/${id}/archivos/${archivo.id}/url?modo=${modo}`,
      );
      if (datos.url) {
        window.open(datos.url, '_blank', 'noopener');
      } else if (modo === 'download') {
        await api.descargar(datos.descargaUrl, archivo.nombreOriginal);
      } else {
        await api.abrir(datos.previewUrl);
      }
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const descargarPdf = async () => {
    try {
      await api.descargar(`/candidatos/${id}/informe.pdf`, `ficha-${candidato.folio}.pdf`);
      mostrarToast('Ficha PDF descargada', 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const compartir = async () => {
    const url = `${window.location.origin}/candidatos/${id}/ficha`;
    const texto = `Ficha de ${candidato.nombre} (${candidato.folio})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ficha de candidato', text: texto, url });
        return;
      }
      await navigator.clipboard.writeText(`${texto}: ${url}`);
      mostrarToast('Enlace copiado al portapapeles', 'exito');
    } catch {
      mostrarToast('No se pudo compartir automáticamente. Usa “Enviar por correo”.', 'advertencia');
    }
  };

  const enviarPorCorreo = () => {
    const url = `${window.location.origin}/candidatos/${id}/ficha`;
    const asunto = encodeURIComponent(`Ficha de candidato ${candidato.folio}`);
    const cuerpo = encodeURIComponent(
      `Comparto la ficha de ${candidato.nombre} (${candidato.folio}).\n${url}\n\nDocumento de uso interno.`,
    );
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
  };

  if (cargando) {
    return (
      <div className="pagina-ficha">
        <div className="cargando-panel" role="status" aria-live="polite">
          <span className="spinner-border text-primary" aria-hidden="true" />
          <p>Cargando ficha…</p>
        </div>
      </div>
    );
  }

  if (error || !candidato) {
    return (
      <div className="pagina-ficha">
        <div className="alerta alerta-error" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />{' '}
            {error ?? 'No se encontró la ficha del candidato.'}
          </div>
          <div className="ficha-acciones">
            <button type="button" className="boton boton-secundario boton-sm" onClick={cargar}>
              Reintentar
            </button>
            <Link to="/dashboard" className="boton boton-secundario boton-sm">
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-ficha">
      <div className="ficha-acciones no-imprimir">
        <Link to="/dashboard" className="boton boton-secundario boton-sm">
          <i className="bi bi-arrow-left" aria-hidden="true" /> Volver
        </Link>
        <button type="button" className="boton boton-primario boton-sm" onClick={() => window.print()}>
          <i className="bi bi-printer" aria-hidden="true" /> Imprimir
        </button>
        <button type="button" className="boton boton-secundario boton-sm" onClick={descargarPdf}>
          <i className="bi bi-file-earmark-pdf" aria-hidden="true" /> Descargar PDF
        </button>
        <button type="button" className="boton boton-secundario boton-sm" onClick={compartir}>
          <i className="bi bi-share" aria-hidden="true" /> Compartir
        </button>
        <button type="button" className="boton boton-secundario boton-sm" onClick={enviarPorCorreo}>
          <i className="bi bi-envelope" aria-hidden="true" /> Enviar por correo
        </button>
        {puedeEvaluar && (
          <Link
            to={`/agenda?candidato=${candidato.id}`}
            className="boton boton-secundario boton-sm"
          >
            <i className="bi bi-calendar-plus" aria-hidden="true" /> Agendar entrevista
          </Link>
        )}
      </div>

      <article className="ficha-hoja">
        <header className="ficha-cabecera">
          <div>
            <span className="ficha-eyebrow">Ficha técnica · {candidato.folio}</span>
            <h1>{candidato.nombre}</h1>
            <p>
              {candidato.cargo} · {candidato.familiaCargo}
            </p>
          </div>
          <EstadoBadge estado={candidato.estado} />
        </header>

        <section className="ficha-seccion" aria-label="Datos personales">
          <h2>Datos personales</h2>
          <div className="ficha-grid">
            <Campo etiqueta="RUT">{candidato.rut}</Campo>
            <Campo etiqueta="Correo">{candidato.correo}</Campo>
            <Campo etiqueta="Teléfono">{candidato.telefono}</Campo>
            <Campo etiqueta="Formación">{candidato.formacion}</Campo>
            <Campo etiqueta="Disponibilidad">{candidato.disponibilidad}</Campo>
            <Campo etiqueta="Años de experiencia">{candidato.aniosExperiencia}</Campo>
          </div>
        </section>

        <section className="ficha-seccion" aria-label="Postulación">
          <h2>Postulación</h2>
          <div className="ficha-grid">
            <Campo etiqueta="Fecha de postulación">
              {formatearFecha(candidato.fechaPostulacion)}
            </Campo>
            <Campo etiqueta="Última actualización">
              {formatearFecha(candidato.fechaActualizacion)}
            </Campo>
            <Campo etiqueta="Consentimiento">
              {candidato.consentimiento ? 'Aceptado' : 'No registrado'}
            </Campo>
          </div>
          {candidato.motivacion && (
            <div className="ficha-texto">
              <small>Motivación</small>
              <p>{candidato.motivacion}</p>
            </div>
          )}
        </section>

        <section className="ficha-seccion" aria-label="Evaluación psicolaboral">
          <h2>Evaluación psicolaboral</h2>
          <div className="ficha-grid">
            <Campo etiqueta="Puntaje">
              {Number.isFinite(candidato.puntaje) ? formatearPorcentaje(candidato.puntaje) : 'Sin evaluar'}
            </Campo>
            <Campo etiqueta="Idoneidad">{candidato.idoneidad}</Campo>
            <Campo etiqueta="Evaluado por">{candidato.evaluadoPor}</Campo>
            <Campo etiqueta="Fecha de evaluación">
              {formatearFecha(candidato.fechaEvaluacion)}
            </Campo>
          </div>
          {candidato.observaciones && (
            <div className="ficha-texto">
              <small>Observaciones</small>
              <p>{candidato.observaciones}</p>
            </div>
          )}
        </section>

        <PanelAnalisisIA candidato={candidato} puedeEvaluar={puedeEvaluar} />

        <DocumentosCandidato
          candidato={candidato}
          puedeEvaluar={puedeEvaluar}
          onActualizado={cargar}
          onAbrirArchivo={abrirArchivo}
        />

        <section className="ficha-seccion" aria-label="Historial de etapas">
          <h2>Historial de etapas</h2>
          {historial.length === 0 ? (
            <p className="ficha-vacio">Sin movimientos registrados.</p>
          ) : (
            <ol className="linea-tiempo">
              {historial.map((evento) => (
                <li key={evento.id} className="linea-tiempo-item">
                  <span className="linea-tiempo-punto" aria-hidden="true" />
                  <div className="linea-tiempo-contenido">
                    <strong>
                      {evento.etapaAnterior
                        ? `${evento.etapaAnterior} → ${evento.etapaNueva}`
                        : `Registro · ${evento.etapaNueva}`}
                    </strong>
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
        </section>

        <footer className="ficha-pie">
          Documento de uso interno · Generado el {formatearFecha(new Date().toISOString())}
        </footer>
      </article>
    </div>
  );
}
