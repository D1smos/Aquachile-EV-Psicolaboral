import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import {
  obtenerTextoDocumento,
  reprocesarDocumento,
  subirDocumentoCandidato,
} from '../services/analisisIA.js';
import { formatearFecha } from '../utils/evaluacionUtils.js';
import ModalTextoDocumento from './ModalTextoDocumento.jsx';

const ETIQUETA_TIPO = {
  cv: 'Currículum',
  antecedentes: 'Antecedentes',
  informe: 'Informe',
};

const ETIQUETA_ESTADO = {
  ok: 'Texto extraído',
  sin_texto: 'Sin texto útil',
  error: 'Error de extracción',
  no_soportado: 'No soportado',
};

const CLASE_ESTADO = {
  ok: 'text-bg-success',
  sin_texto: 'text-bg-warning',
  error: 'text-bg-danger',
  no_soportado: 'text-bg-secondary',
};

const formatearTamano = (bytes) => {
  const valor = Number(bytes);
  if (!Number.isFinite(valor) || valor <= 0) {
    return '—';
  }
  if (valor < 1024) {
    return `${valor} B`;
  }
  if (valor < 1024 * 1024) {
    return `${(valor / 1024).toFixed(1)} KB`;
  }
  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentosCandidato({
  candidato,
  puedeEvaluar = false,
  onActualizado,
  onAbrirArchivo,
}) {
  const { mostrarToast } = useToast();
  const [metadatos, setMetadatos] = useState({});
  const [tipo, setTipo] = useState('cv');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [reprocesandoId, setReprocesandoId] = useState(null);
  const [archivoTexto, setArchivoTexto] = useState(null);
  const entradaRef = useRef(null);
  const archivos = candidato?.archivos ?? [];

  const cargarMetadatos = useCallback(async () => {
    const lista = candidato?.archivos ?? [];
    if (!candidato?.id || lista.length === 0) {
      setMetadatos({});
      return;
    }
    const pares = await Promise.all(
      lista.map(async (archivo) => {
        try {
          const datos = await obtenerTextoDocumento(candidato.id, archivo.id);
          return [archivo.id, datos];
        } catch (capturado) {
          return [
            archivo.id,
            {
              estado: capturado.codigo === 404 ? 'sin_texto' : 'error',
              error: capturado.message,
            },
          ];
        }
      }),
    );
    setMetadatos(Object.fromEntries(pares));
  }, [candidato?.archivos, candidato?.id]);

  useEffect(() => {
    cargarMetadatos();
  }, [cargarMetadatos]);

  const subir = async (evento) => {
    evento.preventDefault();
    if (!archivoSeleccionado) {
      mostrarToast('Selecciona un documento para cargar.', 'advertencia');
      return;
    }
    const datos = new FormData();
    datos.append('archivo', archivoSeleccionado);
    datos.append('tipo', tipo);
    setSubiendo(true);
    try {
      await subirDocumentoCandidato(candidato.id, datos);
      mostrarToast('Documento cargado y procesado.', 'exito');
      setArchivoSeleccionado(null);
      if (entradaRef.current) {
        entradaRef.current.value = '';
      }
      await onActualizado?.();
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    } finally {
      setSubiendo(false);
    }
  };

  const reprocesar = async (archivo) => {
    setReprocesandoId(archivo.id);
    try {
      await reprocesarDocumento(candidato.id, archivo.id);
      await cargarMetadatos();
      await onActualizado?.();
      mostrarToast('Documento reprocesado.', 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    } finally {
      setReprocesandoId(null);
    }
  };

  return (
    <section className="ficha-seccion" aria-label="Documentos del candidato">
      <h2>Documentos</h2>

      {puedeEvaluar && (
        <form className="documento-subida no-imprimir" onSubmit={subir}>
          <div className="documento-subida-campos">
            <div className="campo-filtro">
              <label className="etiqueta-campo" htmlFor="documento-archivo">
                Nuevo documento
              </label>
              <input
                ref={entradaRef}
                id="documento-archivo"
                type="file"
                className="control-campo"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(evento) => setArchivoSeleccionado(evento.target.files?.[0] ?? null)}
              />
            </div>
            <div className="campo-filtro">
              <label className="etiqueta-campo" htmlFor="documento-tipo">
                Tipo
              </label>
              <select
                id="documento-tipo"
                className="control-campo"
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value)}
              >
                <option value="cv">Currículum</option>
                <option value="antecedentes">Antecedentes</option>
                <option value="informe">Informe</option>
              </select>
            </div>
            <div className="campo-filtro campo-accion">
              <button type="submit" className="boton boton-primario w-100" disabled={subiendo}>
                {subiendo ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Subiendo…
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up" aria-hidden="true" /> Cargar documento
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {archivos.length === 0 ? (
        <p className="ficha-vacio">Sin documentos adjuntos.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla-aqua">
            <thead>
              <tr>
                <th scope="col">Documento</th>
                <th scope="col">Tipo</th>
                <th scope="col" className="oculto-movil">Extracción</th>
                <th scope="col" className="oculto-movil">Experiencia</th>
                <th scope="col" className="oculto-movil">Tamaño</th>
                <th scope="col" className="oculto-movil">Cargado</th>
                <th scope="col" className="text-end no-imprimir">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archivos.map((archivo) => {
                const meta = metadatos[archivo.id];
                const estado = meta?.estado;
                return (
                  <tr key={archivo.id}>
                    <td>
                      <strong>{archivo.nombreOriginal}</strong>
                    </td>
                    <td>{ETIQUETA_TIPO[archivo.tipo] ?? archivo.tipo}</td>
                    <td className="oculto-movil">
                      {estado ? (
                        <span className={`badge rounded-pill ${CLASE_ESTADO[estado] ?? 'text-bg-secondary'}`}>
                          {ETIQUETA_ESTADO[estado] ?? estado}
                        </span>
                      ) : (
                        <span className="text-muted">Leyendo…</span>
                      )}
                    </td>
                    <td className="oculto-movil">
                      {meta?.anosExperiencia !== undefined ? `${meta.anosExperiencia} años` : '—'}
                    </td>
                    <td className="oculto-movil">{formatearTamano(archivo.tamano)}</td>
                    <td className="oculto-movil">{formatearFecha(archivo.creadoEn)}</td>
                    <td className="text-end no-imprimir">
                      <div className="ficha-acciones ficha-acciones-compactas">
                        <button
                          type="button"
                          className="boton boton-secundario boton-sm"
                          onClick={() => setArchivoTexto(archivo)}
                        >
                          <i className="bi bi-file-text" aria-hidden="true" /> Texto
                        </button>
                        {onAbrirArchivo && (
                          <>
                            <button
                              type="button"
                              className="boton boton-secundario boton-sm"
                              onClick={() => onAbrirArchivo(archivo, 'preview')}
                            >
                              <i className="bi bi-eye" aria-hidden="true" /> Ver
                            </button>
                            <button
                              type="button"
                              className="boton boton-secundario boton-sm"
                              onClick={() => onAbrirArchivo(archivo, 'download')}
                            >
                              <i className="bi bi-download" aria-hidden="true" /> Descargar
                            </button>
                          </>
                        )}
                        {puedeEvaluar && (
                          <button
                            type="button"
                            className="boton boton-secundario boton-sm"
                            onClick={() => reprocesar(archivo)}
                            disabled={reprocesandoId === archivo.id}
                          >
                            {reprocesandoId === archivo.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm" aria-hidden="true" /> Procesando…
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-repeat" aria-hidden="true" /> Reprocesar
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {archivos.some((archivo) => (metadatos[archivo.id]?.palabrasClave ?? []).length > 0) && (
        <div className="documento-palabras-clave">
          <small>Palabras clave detectadas en los documentos</small>
          <div className="analisis-ia-chips">
            {archivos.flatMap((archivo) =>
              (metadatos[archivo.id]?.palabrasClave ?? []).map((palabra) => (
                <span className="chip chip-ok" key={`${archivo.id}-${palabra}`}>
                  {palabra}
                </span>
              )),
            )}
          </div>
        </div>
      )}

      {archivoTexto && (
        <ModalTextoDocumento
          candidatoId={candidato.id}
          archivo={archivoTexto}
          puedeEvaluar={puedeEvaluar}
          onCerrar={() => setArchivoTexto(null)}
          onReprocesado={() => {
            cargarMetadatos();
            onActualizado?.();
          }}
        />
      )}
    </section>
  );
}
