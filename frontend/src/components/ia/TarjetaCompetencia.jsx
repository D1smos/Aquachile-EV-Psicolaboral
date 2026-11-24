import ListaEvidencias from './ListaEvidencias.jsx';

export default function TarjetaCompetencia({ competencia }) {
  if (!competencia) {
    return null;
  }

  const nivel = Math.max(0, Math.min(5, Number(competencia.nivel) || 0));
  const confianza = Math.max(0, Math.min(1, Number(competencia.confianza) || 0));
  const porcentajeNivel = (nivel / 5) * 100;
  const porcentajeConfianza = Math.round(confianza * 100);

  return (
    <article className="analisis-ia-competencia">
      <div className="analisis-ia-competencia-cabecera">
        <h5>{competencia.nombre ?? competencia.id ?? 'Competencia'}</h5>
        <span className="badge rounded-pill text-bg-light border">Nivel {nivel}/5</span>
      </div>

      <div className="analisis-ia-progreso" aria-label={`Nivel ${nivel} de 5`}>
        <span style={{ width: `${porcentajeNivel}%` }} />
      </div>

      <div className="analisis-ia-confianza">
        <span>Confianza {porcentajeConfianza}%</span>
        <div className="progress" role="progressbar" aria-label="Confianza del análisis" aria-valuenow={porcentajeConfianza} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-bar" style={{ width: `${porcentajeConfianza}%` }} />
        </div>
      </div>

      <ListaEvidencias evidencias={competencia.evidencia} vacio="Sin evidencia para esta competencia." />
    </article>
  );
}
