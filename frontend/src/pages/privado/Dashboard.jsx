import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  calcularMetricas,
  filtrarCandidatos,
  formatearPorcentaje,
  ordenarCandidatos,
} from '../../utils/evaluacionUtils.js';
import FiltrosCandidatos from '../../components/FiltrosCandidatos.jsx';
import TablaCandidatos from '../../components/TablaCandidatos.jsx';
import TarjetaMetrica from '../../components/TarjetaMetrica.jsx';
import ModalEvaluacion from '../../components/ModalEvaluacion.jsx';
import ModalHistorial from '../../components/ModalHistorial.jsx';
import ModalNuevoCandidato from '../../components/ModalNuevoCandidato.jsx';

const FILTROS_INICIALES = { busqueda: '', cargo: '', estado: '', desde: '', hasta: '' };
const POR_PAGINA = 8;

function Esqueleto() {
  return (
    <div className="cargando-panel" role="status" aria-live="polite">
      <span className="spinner-border text-primary" aria-hidden="true" />
      <p>Cargando candidatos…</p>
    </div>
  );
}

function ErrorCarga({ mensaje, onReintentar }) {
  return (
    <div className="alerta alerta-error" role="alert">
      <div>
        <i className="bi bi-exclamation-triangle" aria-hidden="true" /> {mensaje}
      </div>
      <button type="button" className="boton boton-secundario boton-sm" onClick={onReintentar}>
        Reintentar
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { mostrarToast } = useToast();
  const { usuario } = useAuth();
  const puedeEvaluar = usuario?.rol === 'psicologo';
  const [candidatos, setCandidatos] = useState([]);
  const [catalogo, setCatalogo] = useState(null);
  const [cuestionario, setCuestionario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState(null);
  const [historialDe, setHistorialDe] = useState(null);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosCandidatos, datosCatalogo, datosCuestionario] = await Promise.all([
        api.get('/candidatos'),
        api.get('/catalogos'),
        api.get('/catalogos/evaluacion'),
      ]);
      setCandidatos(datosCandidatos.candidatos);
      setCatalogo(datosCatalogo);
      setCuestionario(datosCuestionario);
    } catch (capturado) {
      setError(capturado.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPagina(1);
  }, [filtros]);

  const metricas = useMemo(() => calcularMetricas(candidatos), [candidatos]);

  const candidatosFiltrados = useMemo(
    () => ordenarCandidatos(filtrarCandidatos(candidatos, filtros)),
    [candidatos, filtros],
  );

  const totalPaginas = Math.max(1, Math.ceil(candidatosFiltrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const candidatosPagina = candidatosFiltrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  const cargos = useMemo(
    () =>
      Object.values(catalogo?.familiasCargos ?? {})
        .flat()
        .sort((a, b) => a.localeCompare(b, 'es')),
    [catalogo],
  );

  const hayFiltros = useMemo(
    () => Object.values(filtros).some((valor) => String(valor).trim() !== ''),
    [filtros],
  );

  const limpiarFiltros = () => setFiltros(FILTROS_INICIALES);

  const cambiarEstado = async (id, estado) => {
    try {
      const datos = await api.patch(`/candidatos/${id}/estado`, { estado });
      setCandidatos((previos) =>
        previos.map((candidato) => (candidato.id === id ? datos.candidato : candidato)),
      );
      setSeleccion((previo) => (previo?.id === id ? datos.candidato : previo));
      mostrarToast(datos.mensaje, 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const alGuardarCandidato = (candidato, esEdicion) => {
    setCandidatos((previos) =>
      esEdicion
        ? previos.map((previo) => (previo.id === candidato.id ? candidato : previo))
        : [candidato, ...previos],
    );
    setMostrarNuevo(false);
    setEditando(null);
  };

  const descargarCsv = async () => {
    try {
      const parametros = new URLSearchParams();
      for (const [clave, valor] of Object.entries(filtros)) {
        if (String(valor ?? '').trim() !== '') {
          parametros.append(clave, String(valor).trim());
        }
      }
      const sufijo = parametros.toString();
      await api.descargar(`/candidatos/exportar.csv${sufijo ? `?${sufijo}` : ''}`, 'candidatos.csv');
      mostrarToast('Archivo CSV descargado', 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const descargarInforme = async (candidato) => {
    try {
      await api.descargar(`/candidatos/${candidato.id}/informe.pdf`, `ficha-${candidato.folio}.pdf`);
      mostrarToast('Ficha PDF descargada', 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const eliminarCandidato = async (candidato) => {
    try {
      const datos = await api.eliminar(`/candidatos/${candidato.id}`);
      setCandidatos((previos) => previos.filter((previo) => previo.id !== candidato.id));
      if (seleccion?.id === candidato.id) {
        setSeleccion(null);
      }
      if (historialDe?.id === candidato.id) {
        setHistorialDe(null);
      }
      mostrarToast(datos.mensaje, 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const guardarEvaluacion = async (id, contenido) => {
    setGuardando(true);
    try {
      const datos = await api.post(`/candidatos/${id}/evaluacion`, contenido);
      setCandidatos((previos) =>
        previos.map((candidato) => (candidato.id === id ? datos.candidato : candidato)),
      );
      setSeleccion(null);
      mostrarToast(`Evaluación guardada · ${datos.candidato.idoneidad}`, 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pagina-dashboard">
      <header className="cabecera-dashboard">
        <div>
          <h1>Dashboard</h1>
          <p>Panel de gestión, métricas y seguimiento de evaluaciones psicolaborales.</p>
          {usuario && (
            <p className="modal-subtitulo">
              Conectado como {usuario.nombre} · {usuario.rol === 'psicologo' ? 'Evaluador' : 'Analista'}
            </p>
          )}
        </div>
        <div className="cabecera-dashboard-acciones">
          <button type="button" className="boton boton-primario" onClick={() => setMostrarNuevo(true)}>
            <i className="bi bi-person-plus-fill" aria-hidden="true" /> Nuevo candidato
          </button>
          <button type="button" className="boton boton-secundario" onClick={descargarCsv}>
            <i className="bi bi-file-earmark-spreadsheet" aria-hidden="true" /> Exportar CSV
          </button>
          <button type="button" className="boton boton-secundario" onClick={cargar} disabled={cargando}>
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Actualizar
          </button>
        </div>
      </header>

      {cargando && <Esqueleto />}

      {!cargando && error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

      {!cargando && !error && (
        <>
          <section className="rejilla-kpi" aria-label="Métricas del proceso">
            <TarjetaMetrica
              titulo="Total candidatos"
              valor={metricas.totalCandidatos}
              detalle={`${metricas.porEstado.Pendiente} pendientes de revisión`}
              tono="azul"
              icono="bi-people-fill"
            />
            <TarjetaMetrica
              titulo="Postulaciones del mes"
              valor={metricas.postulacionesMes}
              detalle="Registradas en el mes en curso"
              tono="cian"
              icono="bi-calendar-plus-fill"
            />
            <TarjetaMetrica
              titulo="Evaluaciones completadas"
              valor={formatearPorcentaje(metricas.pctEvaluacionesCompletadas)}
              detalle={`${metricas.evaluacionesCompletadas} de ${metricas.totalCandidatos} candidatos`}
              tono="verde"
              icono="bi-clipboard2-check-fill"
            />
            <TarjetaMetrica
              titulo="Aprobados"
              valor={metricas.porEstado.Aprobado}
              detalle={`${metricas.porEstado.Rechazado} rechazados · ${metricas.porEstado['En Proceso']} en proceso`}
              tono="naranja"
              icono="bi-patch-check-fill"
            />
          </section>

          <FiltrosCandidatos
            filtros={filtros}
            onCambiar={setFiltros}
            cargos={cargos}
            estados={catalogo?.estados ?? []}
            total={candidatosFiltrados.length}
            onLimpiar={limpiarFiltros}
          />

          <section className="panel-tabla">
            <div className="panel-tabla-cabecera">
              <h2>Candidatos registrados</h2>
              <span>Ordenados por fecha de postulación</span>
            </div>
            <TablaCandidatos
              candidatos={candidatosPagina}
              hayFiltros={hayFiltros}
              onLimpiar={limpiarFiltros}
              onEvaluar={setSeleccion}
              onHistorial={setHistorialDe}
              onEditar={setEditando}
              onInforme={descargarInforme}
              onEliminar={eliminarCandidato}
              puedeEvaluar={puedeEvaluar}
            />
            {totalPaginas > 1 && (
              <nav className="paginacion" aria-label="Paginación de candidatos">
                <button
                  type="button"
                  className="boton boton-secundario boton-sm"
                  onClick={() => setPagina((previa) => Math.max(1, previa - 1))}
                  disabled={paginaActual <= 1}
                >
                  Anterior
                </button>
                <span>
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  type="button"
                  className="boton boton-secundario boton-sm"
                  onClick={() => setPagina((previa) => Math.min(totalPaginas, previa + 1))}
                  disabled={paginaActual >= totalPaginas}
                >
                  Siguiente
                </button>
              </nav>
            )}
          </section>
        </>
      )}

      {seleccion && cuestionario && (
        <ModalEvaluacion
          candidato={seleccion}
          cuestionario={cuestionario}
          estados={catalogo?.estados ?? []}
          guardando={guardando}
          onCerrar={() => setSeleccion(null)}
          onGuardar={guardarEvaluacion}
          onCambiarEstado={cambiarEstado}
        />
      )}

      {historialDe && (
        <ModalHistorial candidato={historialDe} onCerrar={() => setHistorialDe(null)} />
      )}

      {mostrarNuevo && (
        <ModalNuevoCandidato
          catalogo={catalogo}
          onCerrar={() => setMostrarNuevo(false)}
          onGuardado={alGuardarCandidato}
        />
      )}

      {editando && (
        <ModalNuevoCandidato
          catalogo={catalogo}
          candidatoExistente={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={alGuardarCandidato}
        />
      )}
    </div>
  );
}
