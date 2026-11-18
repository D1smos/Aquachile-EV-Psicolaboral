const ETIQUETAS_ESTADO = {
  borrador: 'Borrador',
  revisado: 'Revisado',
  descartado: 'Descartado',
};

const CLASES_ESTADO = {
  borrador: 'text-bg-warning',
  revisado: 'text-bg-success',
  descartado: 'text-bg-secondary',
};

const ETIQUETAS_NIVEL = {
  bajo: 'Afinidad baja',
  medio: 'Afinidad media',
  alto: 'Afinidad alta',
};

export default function EstadoAnalisis({ analisis, cacheHit = false }) {
  if (!analisis) {
    return null;
  }

  const resultado = analisis.resultado ?? {};
  const afinidad = resultado.afinidad ?? {};
  const estado = analisis.estado ?? 'borrador';
  const score = Math.max(0, Math.min(100, Number(afinidad.score) || 0));
  const nivel = afinidad.nivel ?? 'bajo';
  const palabrasClave = resultado.palabrasClaveDetectadas ?? [];

  return (
    <header className="analisis-ia-cabecera">
      <div className="analisis-ia-cabecera-principal">
        <div>
          <div className="analisis-ia-badges">
            <span className={`badge rounded-pill ${CLASES_ESTADO[estado] ?? CLASES_ESTADO.borrador}`}>
              {ETIQUETAS_ESTADO[estado] ?? estado}
            </span>
            {cacheHit && (
              <span className="badge rounded-pill text-bg-info">
                <i className="bi bi-lightning-charge-fill" aria-hidden="true" /> Desde caché
              </span>
            )}
            <span className="badge rounded-pill text-bg-light border">
              <i className="bi bi-cpu" aria-hidden="true" /> {analisis.modelo ?? 'Modelo IA'}
            </span>
          </div>
          <h3>Análisis IA del currículum</h3>
          <p>{resultado.resumen ?? 'Sin resumen disponible.'}</p>
        </div>

        <div className="analisis-ia-score" aria-label={`Afinidad ${score} por ciento`}>
          <strong>{score}%</strong>
          <span>{ETIQUETAS_NIVEL[nivel] ?? nivel}</span>
          <span className="analisis-ia-score-barra" aria-hidden="true">
            <span style={{ width: `${score}%` }} />
          </span>
        </div>
      </div>

      <div className="analisis-ia-meta">
        <span>
          <i className="bi bi-briefcase" aria-hidden="true" />{' '}
          {Number(resultado.anosExperienciaEstimados) || 0} años de experiencia estimados
        </span>
        {palabrasClave.length > 0 && (
          <div className="analisis-ia-chips" aria-label="Palabras clave detectadas">
            {palabrasClave.map((palabra) => (
              <span className="chip chip-ok" key={palabra}>
                {palabra}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
