import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useEntrevistas from '../../hooks/useEntrevistas.js';
import { obtenerEstadoGoogle } from '../../services/calendario.js';
import EstadoSincronizacion from '../../components/agenda/EstadoSincronizacion.jsx';
import ListaEntrevistas from '../../components/agenda/ListaEntrevistas.jsx';
import ModalEntrevista from '../../components/agenda/ModalEntrevista.jsx';

const RANGOS = [
  { id: '7', etiqueta: 'Próximos 7 días' },
  { id: '30', etiqueta: 'Próximos 30 días' },
  { id: 'todo', etiqueta: 'Todo' },
];

const rangoDe = (rango) => {
  if (rango === 'todo') {
    return {};
  }
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + Number(rango));
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
};

export default function Agenda() {
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const puedeEvaluar = usuario?.rol === 'psicologo';
  const [parametros, setParametros] = useSearchParams();
  const candidatoParam = parametros.get('candidato') ?? '';
  const [candidatos, setCandidatos] = useState([]);
  const [rango, setRango] = useState('30');
  const [filtroCandidato, setFiltroCandidato] = useState('');
  const [estadoGoogle, setEstadoGoogle] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(Boolean(candidatoParam));
  const [candidatoInicial, setCandidatoInicial] = useState(candidatoParam);
  const [enEdicion, setEnEdicion] = useState(null);
  const [sincronizandoId, setSincronizandoId] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const {
    entrevistas,
    cargando,
    error,
    cargar,
    crear,
    actualizar,
    sincronizar,
    eliminar,
  } = useEntrevistas({ cargarAlIniciar: false });

  const cargarCandidatos = useCallback(async () => {
    try {
      const datos = await api.get('/candidatos');
      setCandidatos(datos?.candidatos ?? []);
    } catch {
      setCandidatos([]);
    }
  }, []);

  const cargarGoogle = useCallback(async () => {
    try {
      setEstadoGoogle(await obtenerEstadoGoogle());
    } catch {
      setEstadoGoogle(null);
    }
  }, []);

  useEffect(() => {
    cargarCandidatos();
    cargarGoogle();
  }, [cargarCandidatos, cargarGoogle]);

  useEffect(() => {
    cargar({ ...rangoDe(rango), candidatoId: filtroCandidato });
  }, [cargar, rango, filtroCandidato]);

  useEffect(() => {
    if (!confirmandoId) {
      return undefined;
    }
    const temporizador = setTimeout(() => setConfirmandoId(null), 5000);
    return () => clearTimeout(temporizador);
  }, [confirmandoId]);

  useEffect(() => {
    if (candidatoParam) {
      setCandidatoInicial(candidatoParam);
      setEnEdicion(null);
      setMostrarModal(true);
    }
  }, [candidatoParam]);

  useEffect(() => {
    if (parametros.get('google') !== 'conectado') {
      return;
    }
    mostrarToast('Google Calendar conectado correctamente', 'exito');
    cargarGoogle();
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete('google');
    setParametros(siguientes, { replace: true });
  }, [parametros, mostrarToast, cargarGoogle, setParametros]);

  const resumen = useMemo(() => {
    const pendientes = entrevistas.filter(
      (entrevista) => entrevista.estadoSync !== 'sincronizada',
    ).length;
    const conMeet = entrevistas.filter((entrevista) => Boolean(entrevista.meetUrl)).length;
    return { total: entrevistas.length, pendientes, conMeet };
  }, [entrevistas]);

  const abrirNueva = () => {
    setEnEdicion(null);
    setCandidatoInicial(filtroCandidato || candidatoParam);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEnEdicion(null);
    if (parametros.has('candidato')) {
      const siguientes = new URLSearchParams(parametros);
      siguientes.delete('candidato');
      setParametros(siguientes, { replace: true });
    }
  };

  const guardar = async (payload) => {
    const datos = enEdicion
      ? await actualizar(enEdicion.id, payload)
      : await crear(payload);
    await Promise.all([cargar({ ...rangoDe(rango), candidatoId: filtroCandidato }), cargarGoogle()]);
    return datos;
  };

  const editar = (entrevista) => {
    setEnEdicion(entrevista);
    setMostrarModal(true);
  };

  const borrar = async (entrevista) => {
    if (confirmandoId !== entrevista.id) {
      setConfirmandoId(entrevista.id);
      mostrarToast('Pulsa Eliminar nuevamente para confirmar', 'info');
      return;
    }
    setConfirmandoId(null);
    try {
      await eliminar(entrevista.id);
      mostrarToast('Entrevista eliminada', 'exito');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    }
  };

  const sincronizarUna = async (entrevista) => {
    setSincronizandoId(entrevista.id);
    try {
      const datos = await sincronizar(entrevista.id);
      mostrarToast(datos?.mensaje ?? 'Entrevista sincronizada', datos?.sincronizada ? 'exito' : 'info');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    } finally {
      setSincronizandoId(null);
    }
  };

  return (
    <div className="pagina-agenda">
      <header className="cabecera-dashboard">
        <div>
          <h1>Agenda</h1>
          <p>Coordina entrevistas psicolaborales y sincroniza los eventos con Google Calendar.</p>
        </div>
        <div className="cabecera-dashboard-acciones">
          {puedeEvaluar && (
            <button type="button" className="boton boton-primario" onClick={abrirNueva}>
              <i className="bi bi-calendar-plus" aria-hidden="true" /> Nueva entrevista
            </button>
          )}
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => cargar({ ...rangoDe(rango), candidatoId: filtroCandidato })}
            disabled={cargando}
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Actualizar
          </button>
        </div>
      </header>

      <div className="agenda-metricas">
        <div className="agenda-metrica">
          <span>Entrevistas</span>
          <strong>{resumen.total}</strong>
        </div>
        <div className="agenda-metrica">
          <span>Pendientes de sync</span>
          <strong>{resumen.pendientes}</strong>
        </div>
        <div className="agenda-metrica">
          <span>Con enlace Meet</span>
          <strong>{resumen.conMeet}</strong>
        </div>
      </div>

      <EstadoSincronizacion
        estado={estadoGoogle}
        puedeGestionar={puedeEvaluar}
        onActualizar={cargarGoogle}
      />

      <section className="panel-filtros agenda-filtros" aria-label="Filtros de agenda">
        <div className="filtros-grid">
          <div className="campo-filtro">
            <label className="etiqueta-campo" htmlFor="agenda-rango">
              Período
            </label>
            <select
              id="agenda-rango"
              className="control-campo"
              value={rango}
              onChange={(evento) => setRango(evento.target.value)}
            >
              {RANGOS.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <div className="campo-filtro">
            <label className="etiqueta-campo" htmlFor="agenda-candidato">
              Candidato
            </label>
            <select
              id="agenda-candidato"
              className="control-campo"
              value={filtroCandidato}
              onChange={(evento) => setFiltroCandidato(evento.target.value)}
            >
              <option value="">Todos los candidatos</option>
              {candidatos.map((candidato) => (
                <option key={candidato.id} value={candidato.id}>
                  {candidato.nombre} · {candidato.folio}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {cargando && (
        <div className="cargando-panel" role="status" aria-live="polite">
          <span className="spinner-border text-primary" aria-hidden="true" />
          <p>Cargando agenda…</p>
        </div>
      )}

      {!cargando && error && (
        <div className="alerta alerta-error" role="alert">
          <span>
            <i className="bi bi-exclamation-triangle" aria-hidden="true" /> {error}
          </span>
          <button
            type="button"
            className="boton boton-secundario boton-sm"
            onClick={() => cargar({ ...rangoDe(rango), candidatoId: filtroCandidato })}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && (
        <ListaEntrevistas
          entrevistas={entrevistas}
          puedeEvaluar={puedeEvaluar}
          sincronizandoId={sincronizandoId}
          confirmandoId={confirmandoId}
          onEditar={editar}
          onEliminar={borrar}
          onSincronizar={sincronizarUna}
        />
      )}

      {mostrarModal && puedeEvaluar && (
        <ModalEntrevista
          candidatos={candidatos}
          entrevista={enEdicion}
          candidatoIdInicial={candidatoInicial}
          onCerrar={cerrarModal}
          onGuardar={guardar}
        />
      )}
    </div>
  );
}
