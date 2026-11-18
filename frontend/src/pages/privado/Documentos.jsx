import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ModalTextoDocumento from '../../components/ModalTextoDocumento.jsx';
import { formatearFecha } from '../../utils/evaluacionUtils.js';

const POR_PAGINA = 15;
const FILTROS_INICIALES = { q: '', tipo: '', desde: '', hasta: '' };

const ETIQUETA_TIPO = {
  cv: 'Currículum',
  antecedentes: 'Antecedentes',
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

export default function Documentos() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const puedeEvaluar = usuario?.rol === 'psicologo';
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ archivos: [], total: 0, porPagina: POR_PAGINA });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [archivoTexto, setArchivoTexto] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const parametros = new URLSearchParams({ pagina: String(pagina), porPagina: String(POR_PAGINA) });
      for (const [clave, valor] of Object.entries(filtros)) {
        if (String(valor ?? '').trim() !== '') {
          parametros.append(clave, String(valor).trim());
        }
      }
      const respuesta = await api.get(`/archivos?${parametros.toString()}`);
      setDatos(respuesta);
    } catch (capturado) {
      setError(capturado.message);
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const modificarFiltro = (evento) => {
    setPagina(1);
    setFiltros((previos) => ({ ...previos, [evento.target.name]: evento.target.value }));
  };

  const limpiar = () => {
    setPagina(1);
    setFiltros(FILTROS_INICIALES);
  };

  const abrirArchivo = async (archivo, modo) => {
    try {
      const datosUrl = await api.get(
        `/candidatos/${archivo.candidatoId}/archivos/${archivo.id}/url?modo=${modo}`,
      );
      if (datosUrl.url) {
        window.open(datosUrl.url, '_blank', 'noopener');
      } else if (modo === 'download') {
        await api.descargar(datosUrl.descargaUrl, archivo.nombreOriginal);
      } else {
        await api.abrir(datosUrl.previewUrl);
      }
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(datos.total / POR_PAGINA));
  const hayFiltros = Object.values(filtros).some((valor) => String(valor).trim() !== '');

  return (
    <div className="pagina-documentos">
      <header className="cabecera-dashboard">
        <div>
          <h1>Documentos</h1>
          <p>Consulta los CV y antecedentes cargados, con acceso restringido al equipo interno.</p>
        </div>
        <div className="cabecera-dashboard-acciones">
          <Link to="/dashboard" className="boton boton-secundario">
            <i className="bi bi-arrow-left" aria-hidden="true" /> Volver al dashboard
          </Link>
        </div>
      </header>

      <section className="panel-filtros" aria-label="Filtros de documentos">
        <div className="filtros-cabecera">
          <h2 className="filtros-titulo">
            <i className="bi bi-funnel" aria-hidden="true" /> Filtros
          </h2>
          <span className="filtros-total">
            {datos.total} documento{datos.total === 1 ? '' : 's'}
          </span>
        </div>

        <div className="filtros-grid">
          <div className="campo-filtro">
            <label className="etiqueta-campo" htmlFor="documento-busqueda">
              Candidato, folio o archivo
            </label>
            <div className="campo-con-icono">
              <i className="bi bi-search" aria-hidden="true" />
              <input
                id="documento-busqueda"
                name="q"
                type="search"
                className="control-campo"
                maxLength={80}
                placeholder="Buscar documento…"
                value={filtros.q}
                onChange={modificarFiltro}
              />
            </div>
          </div>

          <div className="campo-filtro">
            <label className="etiqueta-campo" htmlFor="documento-tipo">
              Tipo
            </label>
            <select
              id="documento-tipo"
              name="tipo"
              className="control-campo"
              value={filtros.tipo}
              onChange={modificarFiltro}
            >
              <option value="">Todos los tipos</option>
              <option value="cv">Currículum</option>
              <option value="antecedentes">Antecedentes</option>
            </select>
          </div>

          <div className="campo-filtro">
            <label className="etiqueta-campo" htmlFor="documento-desde">
              Cargado desde
            </label>
            <input
              id="documento-desde"
              name="desde"
              type="date"
              className="control-campo"
              value={filtros.desde}
              onChange={modificarFiltro}
            />
          </div>

          <div className="campo-filtro">
            <label className="etiqueta-campo" htmlFor="documento-hasta">
              Hasta
            </label>
            <input
              id="documento-hasta"
              name="hasta"
              type="date"
              className="control-campo"
              value={filtros.hasta}
              onChange={modificarFiltro}
            />
          </div>

          <div className="campo-filtro campo-accion">
            <button
              type="button"
              className="boton boton-secundario w-100"
              onClick={limpiar}
              disabled={!hayFiltros}
            >
              <i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Limpiar
            </button>
          </div>
        </div>
      </section>

      {cargando && (
        <div className="cargando-panel" role="status" aria-live="polite">
          <span className="spinner-border text-primary" aria-hidden="true" />
          <p>Cargando documentos…</p>
        </div>
      )}

      {!cargando && error && (
        <div className="alerta alerta-error" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle" aria-hidden="true" /> {error}
          </div>
          <button type="button" className="boton boton-secundario boton-sm" onClick={cargar}>
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <section className="panel-tabla">
          <div className="panel-tabla-cabecera">
            <h2>Archivos disponibles</h2>
            <span>Ordenados por fecha de carga, más recientes primero</span>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla-aqua">
              <thead>
                <tr>
                  <th scope="col">Documento</th>
                  <th scope="col">Candidato</th>
                  <th scope="col" className="oculto-movil">
                    Tipo
                  </th>
                  <th scope="col" className="oculto-movil">
                    Tamaño
                  </th>
                  <th scope="col" className="oculto-movil">
                    Cargado
                  </th>
                  <th scope="col" className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {datos.archivos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="celda-vacia">
                      <i className="bi bi-inbox" aria-hidden="true" />
                      <p>
                        {hayFiltros
                          ? 'No hay documentos que coincidan con los filtros.'
                          : 'Todavía no hay documentos cargados.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  datos.archivos.map((archivo) => (
                    <tr key={archivo.id}>
                      <td>
                        <strong>{archivo.nombreOriginal}</strong>
                      </td>
                      <td>
                        <Link to={`/candidatos/${archivo.candidatoId}/ficha`}>
                          {archivo.candidatoNombre}
                        </Link>
                        <small className="bloque">{archivo.folio}</small>
                      </td>
                      <td className="oculto-movil">
                        {ETIQUETA_TIPO[archivo.tipo] ?? archivo.tipo}
                      </td>
                      <td className="oculto-movil">{formatearTamano(archivo.tamano)}</td>
                      <td className="oculto-movil">{formatearFecha(archivo.creadoEn)}</td>
                      <td>
                        <div className="acciones-tabla">
                          <button
                            type="button"
                            className="boton boton-secundario boton-sm boton-accion"
                            onClick={() => setArchivoTexto(archivo)}
                            title="Ver texto extraído"
                            aria-label="Ver texto extraído"
                          >
                            <i className="bi bi-file-text" aria-hidden="true" />
                            <span className="accion-etiqueta">Texto</span>
                          </button>
                          <button
                            type="button"
                            className="boton boton-secundario boton-sm boton-accion"
                            onClick={() => abrirArchivo(archivo, 'preview')}
                          >
                            <i className="bi bi-eye" aria-hidden="true" />
                            <span className="accion-etiqueta">Ver</span>
                          </button>
                          <button
                            type="button"
                            className="boton boton-secundario boton-sm boton-accion"
                            onClick={() => abrirArchivo(archivo, 'download')}
                          >
                            <i className="bi bi-download" aria-hidden="true" />
                            <span className="accion-etiqueta">Descargar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <nav className="paginacion" aria-label="Paginación de documentos">
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                onClick={() => setPagina((previa) => Math.max(1, previa - 1))}
                disabled={pagina <= 1}
              >
                Anterior
              </button>
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                onClick={() => setPagina((previa) => Math.min(totalPaginas, previa + 1))}
                disabled={pagina >= totalPaginas}
              >
                Siguiente
              </button>
            </nav>
          )}
        </section>
      )}

      {archivoTexto && (
        <ModalTextoDocumento
          candidatoId={archivoTexto.candidatoId}
          archivo={archivoTexto}
          puedeEvaluar={puedeEvaluar}
          onCerrar={() => setArchivoTexto(null)}
          onReprocesado={cargar}
        />
      )}
    </div>
  );
}
