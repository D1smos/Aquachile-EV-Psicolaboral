import { useEffect, useRef, useState } from 'react';
import EstadoBadge from './EstadoBadge.jsx';
import { formatearFecha, formatearPorcentaje } from '../utils/evaluacionUtils.js';

function Vacio({ hayFiltros, onLimpiar }) {
  return (
    <tr>
      <td colSpan={6} className="celda-vacia">
        <i className="bi bi-inbox" aria-hidden="true" />
        <p>{hayFiltros ? 'No hay candidatos que coincidan con los filtros.' : 'Todavía no hay postulaciones registradas.'}</p>
        {hayFiltros && (
          <button type="button" className="boton boton-secundario boton-sm" onClick={onLimpiar}>
            Limpiar filtros
          </button>
        )}
      </td>
    </tr>
  );
}

export default function TablaCandidatos({ candidatos, hayFiltros, onLimpiar, onEvaluar, onHistorial, onEditar, onInforme, onEliminar, puedeEvaluar }) {
  const [confirmando, setConfirmando] = useState(null);
  const temporizador = useRef(null);

  useEffect(() => () => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }
  }, []);

  const pedirConfirmacion = (candidato) => {
    if (confirmando === candidato.id) {
      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }
      setConfirmando(null);
      onEliminar(candidato);
      return;
    }
    setConfirmando(candidato.id);
    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }
    temporizador.current = setTimeout(() => setConfirmando(null), 4000);
  };
  return (
    <div className="tabla-contenedor">
      <table className="tabla-aqua">
        <thead>
          <tr>
            <th scope="col">Candidato</th>
            <th scope="col" className="oculto-movil">
              Cargo
            </th>
            <th scope="col" className="oculto-movil">
              Postulación
            </th>
            <th scope="col">Estado</th>
            <th scope="col">Evaluación</th>
            <th scope="col" className="text-end">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {candidatos.length === 0 ? (
            <Vacio hayFiltros={hayFiltros} onLimpiar={onLimpiar} />
          ) : (
            candidatos.map((candidato) => (
              <tr key={candidato.id}>
                <td>
                  <div className="candidato-celda">
                    <strong>{candidato.nombre}</strong>
                    <small>
                      {candidato.rut} · {candidato.correo}
                    </small>
                    <small className="d-md-none">
                      {candidato.cargo} · {formatearFecha(candidato.fechaPostulacion)}
                    </small>
                  </div>
                </td>
                <td className="oculto-movil">
                  <span>{candidato.cargo}</span>
                  <small className="bloque">{candidato.familiaCargo}</small>
                </td>
                <td className="oculto-movil">{formatearFecha(candidato.fechaPostulacion)}</td>
                <td>
                  <EstadoBadge estado={candidato.estado} />
                </td>
                <td>
                  {Number.isFinite(candidato.puntaje) ? (
                    <div className="evaluacion-celda">
                      <span className="puntaje-valor">{formatearPorcentaje(candidato.puntaje)}</span>
                      <span className="puntaje-barra" aria-hidden="true">
                        <span
                          className="puntaje-barra-relleno"
                          style={{ width: `${Math.min(candidato.puntaje, 100)}%` }}
                        />
                      </span>
                      <small>{candidato.idoneidad}</small>
                    </div>
                  ) : (
                    <span className="sin-evaluacion">Sin evaluar</span>
                  )}
                </td>
                <td className="text-end">
                  {puedeEvaluar && (
                    <button
                      type="button"
                      className="boton boton-primario boton-sm"
                      onClick={() => onEvaluar(candidato)}
                    >
                      <i className="bi bi-clipboard2-check" aria-hidden="true" />
                      <span className="oculto-movil"> Evaluar</span>
                    </button>
                  )}{' '}
                  <button
                    type="button"
                    className="boton boton-secundario boton-sm"
                    onClick={() => onEditar(candidato)}
                    title="Editar ficha del candidato"
                  >
                    <i className="bi bi-pencil" aria-hidden="true" />
                    <span className="oculto-movil"> Editar</span>
                  </button>{' '}
                  <button
                    type="button"
                    className="boton boton-secundario boton-sm"
                    onClick={() => onHistorial(candidato)}
                    title="Ver historial de etapas"
                  >
                    <i className="bi bi-clock-history" aria-hidden="true" />
                    <span className="oculto-movil"> Historial</span>
                  </button>{' '}
                  <button
                    type="button"
                    className="boton boton-secundario boton-sm"
                    onClick={() => onInforme(candidato)}
                    title="Descargar ficha en PDF"
                  >
                    <i className="bi bi-file-earmark-pdf" aria-hidden="true" />
                    <span className="oculto-movil"> PDF</span>
                  </button>{' '}
                  <button
                    type="button"
                    className={`boton boton-sm ${confirmando === candidato.id ? 'boton-peligro' : 'boton-secundario'}`}
                    onClick={() => pedirConfirmacion(candidato)}
                    title="Eliminar candidato"
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                    <span className="oculto-movil">
                      {confirmando === candidato.id ? ' ¿Confirmar?' : ' Eliminar'}
                    </span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
