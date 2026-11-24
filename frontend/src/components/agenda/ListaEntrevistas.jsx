const ETIQUETAS_SYNC = {
  pendiente: 'Pendiente de sincronizar',
  sincronizada: 'Sincronizada',
  error: 'Error de sincronización',
  local: 'Solo local',
};

const CLASES_SYNC = {
  pendiente: 'text-bg-warning',
  sincronizada: 'text-bg-success',
  error: 'text-bg-danger',
  local: 'text-bg-secondary',
};

const ETIQUETAS_ESTADO = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

const formatoDia = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const formatoHora = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
});

const fecha = (valor) => {
  const datos = new Date(valor);
  return Number.isNaN(datos.getTime()) ? null : datos;
};

export default function ListaEntrevistas({
  entrevistas = [],
  puedeEvaluar = false,
  sincronizandoId = null,
  confirmandoId = null,
  onEditar,
  onEliminar,
  onSincronizar,
}) {
  if (entrevistas.length === 0) {
    return (
      <div className="agenda-vacia">
        <i className="bi bi-calendar2-plus" aria-hidden="true" />
        <h2>Sin entrevistas en este período</h2>
        <p>Agenda una entrevista para comenzar a coordinar el proceso.</p>
      </div>
    );
  }

  return (
    <div className="agenda-lista">
      {entrevistas.map((entrevista) => {
        const inicio = fecha(entrevista.fechaInicio);
        const fin = fecha(entrevista.fechaFin);
        const estadoSync = entrevista.estadoSync ?? 'pendiente';
        return (
          <article className="agenda-entrevista" key={entrevista.id}>
            <div className="agenda-fecha" aria-hidden="true">
              <strong>{inicio ? inicio.getDate() : '—'}</strong>
              <span>
                {inicio
                  ? inicio.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
                  : ''}
              </span>
            </div>
            <div className="agenda-detalle">
              <div className="agenda-detalle-cabecera">
                <div>
                  <span className="agenda-dia">
                    {inicio ? formatoDia.format(inicio) : 'Fecha por confirmar'}
                  </span>
                  <h2>{entrevista.titulo || `Entrevista de ${entrevista.candidatoNombre}`}</h2>
                  <p>
                    {entrevista.candidatoNombre}
                    {entrevista.folio ? ` · ${entrevista.folio}` : ''}
                    {entrevista.cargo ? ` · ${entrevista.cargo}` : ''}
                  </p>
                </div>
                <div className="agenda-badges">
                  <span className="badge rounded-pill text-bg-light border">
                    {ETIQUETAS_ESTADO[entrevista.estado] ?? entrevista.estado}
                  </span>
                  <span className={`badge rounded-pill ${CLASES_SYNC[estadoSync] ?? CLASES_SYNC.local}`}>
                    {ETIQUETAS_SYNC[estadoSync] ?? estadoSync}
                  </span>
                </div>
              </div>

              <div className="agenda-meta">
                <span>
                  <i className="bi bi-clock" aria-hidden="true" />{' '}
                  {inicio && fin
                    ? `${formatoHora.format(inicio)} – ${formatoHora.format(fin)}`
                    : 'Horario por confirmar'}
                </span>
                {entrevista.lugar && (
                  <span>
                    <i className="bi bi-geo-alt" aria-hidden="true" /> {entrevista.lugar}
                  </span>
                )}
                {entrevista.evaluadorEmail && (
                  <span>
                    <i className="bi bi-person-badge" aria-hidden="true" /> {entrevista.evaluadorEmail}
                  </span>
                )}
              </div>

              {entrevista.errorSync && (
                <p className="agenda-error">
                  <i className="bi bi-exclamation-triangle" aria-hidden="true" /> {entrevista.errorSync}
                </p>
              )}

              <div className="agenda-acciones">
                {entrevista.meetUrl && (
                  <a
                    className="boton boton-primario boton-sm"
                    href={entrevista.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-camera-video" aria-hidden="true" /> Entrar a Meet
                  </a>
                )}
                {puedeEvaluar && (
                  <>
                    <button
                      type="button"
                      className="boton boton-secundario boton-sm"
                      onClick={() => onSincronizar?.(entrevista)}
                      disabled={sincronizandoId === entrevista.id}
                    >
                      <i className="bi bi-arrow-repeat" aria-hidden="true" />
                      {sincronizandoId === entrevista.id ? ' Sincronizando…' : ' Sincronizar'}
                    </button>
                    <button
                      type="button"
                      className="boton boton-secundario boton-sm"
                      onClick={() => onEditar?.(entrevista)}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" /> Editar
                    </button>
                    <button
                      type="button"
                      className={`boton boton-peligro boton-sm${confirmandoId === entrevista.id ? ' boton-confirmar' : ''}`}
                      onClick={() => onEliminar?.(entrevista)}
                      aria-label={
                        confirmandoId === entrevista.id ? 'Confirmar eliminación' : 'Eliminar'
                      }
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                      {confirmandoId === entrevista.id ? ' Confirmar' : ' Eliminar'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
