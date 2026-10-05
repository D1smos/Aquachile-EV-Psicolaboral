export function calcularMetricas(evaluaciones, candidatos) {
  return {
    totalCandidatos: candidatos ? candidatos.length : 0,
    enProceso: evaluaciones ? evaluaciones.filter((e) => e.estado === 'En Proceso').length : 0,
    completadas: evaluaciones ? evaluaciones.filter((e) => e.estado === 'Completada').length : 0
  }
}

export function obtenerClaseBadge(estado) {
  if (estado === 'Completada' || estado === 'Recomendado') return 'bg-success'
  if (estado === 'En Proceso') return 'bg-warning'
  if (estado === 'No Recomendado') return 'bg-danger'
  return 'bg-secondary'
}

export function filtrarEvaluacionesPorEstado(evaluaciones, estadoFiltro) {
  if (!estadoFiltro) return evaluaciones
  return evaluaciones.filter((e) => e.estado === estadoFiltro)
}