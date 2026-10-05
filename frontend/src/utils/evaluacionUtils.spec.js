import { calcularMetricas, obtenerClaseBadge, filtrarEvaluacionesPorEstado } from './evaluacionUtils.js'

describe('Pruebas Unitarias del Sistema (EP2)', () => {
  // Prueba 1
  it('1. Debe calcular correctamente el total de candidatos registrados', () => {
    const candidatosMock = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const metricas = calcularMetricas([], candidatosMock)
    expect(metricas.totalCandidatos).toBe(3)
  })

  // Prueba 2
  it('2. Debe contar correctamente las evaluaciones en estado "En Proceso"', () => {
    const evaluacionesMock = [
      { id: 1, estado: 'En Proceso' },
      { id: 2, estado: 'Completada' },
      { id: 3, estado: 'En Proceso' }
    ]
    const metricas = calcularMetricas(evaluacionesMock, [])
    expect(metricas.enProceso).toBe(2)
  })

  // Prueba 3
  it('3. Debe contar correctamente las evaluaciones en estado "Completada"', () => {
    const evaluacionesMock = [
      { id: 1, estado: 'Completada' },
      { id: 2, estado: 'Completada' }
    ]
    const metricas = calcularMetricas(evaluacionesMock, [])
    expect(metricas.completadas).toBe(2)
  })

  // Prueba 4
  it('4. Debe retornar "bg-success" para el estado "Completada"', () => {
    const clase = obtenerClaseBadge('Completada')
    expect(clase).toBe('bg-success')
  })

  // Prueba 5
  it('5. Debe retornar "bg-warning" para el estado "En Proceso"', () => {
    const clase = obtenerClaseBadge('En Proceso')
    expect(clase).toBe('bg-warning')
  })

  // Prueba 6
  it('6. Debe retornar "bg-danger" para el resultado "No Recomendado"', () => {
    const clase = obtenerClaseBadge('No Recomendado')
    expect(clase).toBe('bg-danger')
  })

  // Prueba 7
  it('7. Debe retornar "bg-secondary" si el estado no está reconocido', () => {
    const clase = obtenerClaseBadge('Desconocido')
    expect(clase).toBe('bg-secondary')
  })

  // Prueba 8
  it('8. Debe filtrar las evaluaciones correctamente según el estado seleccionado', () => {
    const evaluacionesMock = [
      { id: 1, estado: 'En Proceso' },
      { id: 2, estado: 'Completada' }
    ]
    const filtradas = filtrarEvaluacionesPorEstado(evaluacionesMock, 'Completada')
    expect(filtradas.length).toBe(1)
    expect(filtradas[0].id).toBe(2)
  })

  // Prueba 9
  it('9. Debe devolver todas las evaluaciones si el filtro de estado está vacío', () => {
    const evaluacionesMock = [
      { id: 1, estado: 'En Proceso' },
      { id: 2, estado: 'Completada' }
    ]
    const filtradas = filtrarEvaluacionesPorEstado(evaluacionesMock, '')
    expect(filtradas.length).toBe(2)
  })

  // Prueba 10
  it('10. Debe manejar entradas nulas o vacías en el cálculo de métricas sin lanzar errores', () => {
    const metricas = calcularMetricas(null, null)
    expect(metricas.totalCandidatos).toBe(0)
    expect(metricas.enProceso).toBe(0)
    expect(metricas.completadas).toBe(0)
  })
})