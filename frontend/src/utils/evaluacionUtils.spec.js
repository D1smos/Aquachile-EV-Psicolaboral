import {
  calcularMetricas,
  clasificarIdoneidad,
  estaEvaluado,
  filtrarCandidatos,
  ordenarCandidatos,
} from './evaluacionUtils.js';

const evaluado = {
  nombre: 'Ana Evaluada',
  rut: '12.345.678-5',
  correo: 'ana@correo.cl',
  folio: 'AQ-2026-0001',
  puntaje: 94.9,
  respuestas: { p1: 5 },
  estado: 'Aprobado',
  fechaPostulacion: new Date().toISOString(),
  familiaCargo: 'Técnico B/C',
  cargo: 'Monitor Producción',
  disponibilidad: 'Inmediata',
};
const pendiente = {
  nombre: 'Pedro Pendiente',
  rut: '11.111.111-1',
  correo: 'pedro@correo.cl',
  folio: 'AQ-2026-0002',
  puntaje: null,
  respuestas: null,
  estado: 'Pendiente',
  fechaPostulacion: new Date().toISOString(),
  familiaCargo: 'Técnico B/C',
  cargo: 'Monitor Producción',
  disponibilidad: 'Inmediata',
};

describe('utilidades de evaluación', () => {
  it('detecta candidatos evaluados', () => {
    expect(estaEvaluado(evaluado)).toBeTrue();
    expect(estaEvaluado(pendiente)).toBeFalse();
  });

  it('calcula métricas del dashboard', () => {
    const metricas = calcularMetricas([evaluado, pendiente]);
    expect(metricas.totalCandidatos).toBe(2);
    expect(metricas.evaluacionesCompletadas).toBe(1);
    expect(metricas.porEstado.Aprobado).toBe(1);
    expect(metricas.porEstado.Pendiente).toBe(1);
  });

  it('filtra por estado y texto', () => {
    const lista = [evaluado, pendiente];
    expect(filtrarCandidatos(lista, { estado: 'Aprobado' }).length).toBe(1);
    expect(filtrarCandidatos(lista, { estado: '', busqueda: 'pedro' }).length).toBe(1);
    expect(filtrarCandidatos(lista, { estado: '', busqueda: 'zzz' }).length).toBe(0);
  });

  it('clasifica la idoneidad por puntaje y dimensiones críticas', () => {
    expect(clasificarIdoneidad(90, [])).toBe('Idóneo');
    expect(clasificarIdoneidad(50, [])).toBe('No idóneo');
    expect(clasificarIdoneidad(80, [{ puntaje: 30 }])).toBe('Idóneo con observaciones');
  });

  it('ordena por fecha de postulación descendente', () => {
    const viejo = { ...pendiente, folio: 'AQ-1', fechaPostulacion: '2026-01-01T00:00:00.000Z' };
    const nuevo = { ...evaluado, folio: 'AQ-2', fechaPostulacion: '2026-06-01T00:00:00.000Z' };
    const ordenados = ordenarCandidatos([viejo, nuevo]);
    expect(ordenados[0].folio).toBe('AQ-2');
  });
});
