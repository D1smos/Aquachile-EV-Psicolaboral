import { expect, test } from 'vitest';
import {
  ESTADOS_PROCESO,
  IDONEIDADES,
  calcularMetricas,
  calcularPuntaje,
  clasificarIdoneidad,
  evaluarRespuestas,
  filtrarCandidatos,
  formatearPorcentaje,
  normalizar,
  ordenarCandidatos,
  validarRespuestas,
} from './evaluacionUtils.js';

const cuestionario = {
  dimensiones: [
    { id: 'etica', nombre: 'Ética y compromiso' },
    { id: 'trabajoEquipo', nombre: 'Trabajo en equipo' },
  ],
  preguntas: [
    { id: 'p1', dimension: 'etica', peso: 1, texto: 'Cumple los plazos asumidos' },
    { id: 'p2', dimension: 'etica', peso: 1, texto: 'Respeta la seguridad de la planta' },
    { id: 'p3', dimension: 'trabajoEquipo', peso: 2, texto: 'Colabora con su equipo' },
  ],
};

const respuestasPerfectas = { p1: 5, p2: 5, p3: 5 };
const respuestasMedias = { p1: 3, p2: 3, p3: 3 };

test('normaliza tildes y mayúsculas para las búsquedas', () => {
  expect(normalizar('  José Pérez  ')).toBe('jose perez');
});

test('calcula el puntaje total ponderado', () => {
  expect(calcularPuntaje(respuestasPerfectas, cuestionario)).toBe(100);
  expect(calcularPuntaje(respuestasMedias, cuestionario)).toBe(60);
});

test('clasifica la idoneidad según umbrales y dimensiones críticas', () => {
  expect(clasificarIdoneidad(90, [])).toBe(IDONEIDADES.IDEONEO);
  expect(clasificarIdoneidad(68, [])).toBe(IDONEIDADES.CON_OBSERVACIONES);
  expect(clasificarIdoneidad(40, [])).toBe(IDONEIDADES.NO_IDONEO);
  expect(clasificarIdoneidad(90, [{ id: 'etica', puntaje: 20 }])).toBe(
    IDONEIDADES.CON_OBSERVACIONES,
  );
});

test('la evaluación completa devuelve puntaje, dimensiones e idoneidad', () => {
  const resultado = evaluarRespuestas(respuestasPerfectas, cuestionario);
  expect(resultado.puntaje).toBe(100);
  expect(resultado.dimensiones).toHaveLength(2);
  expect(resultado.idoneidad).toBe(IDONEIDADES.IDEONEO);
});

test('detecta respuestas incompletas', () => {
  const incompleta = validarRespuestas({ p1: 4 }, cuestionario);
  expect(incompleta.valido).toBe(false);
  expect(incompleta.faltantes).toEqual(['p2', 'p3']);
  expect(validarRespuestas(respuestasPerfectas, cuestionario).valido).toBe(true);
});

test('calcula métricas del dashboard', () => {
  const hoy = new Date(2026, 9, 5);
  const candidatos = [
    { estado: 'Pendiente', fechaPostulacion: '2026-10-02T10:00:00.000Z', respuestas: null, puntaje: null },
    { estado: 'Aprobado', fechaPostulacion: '2026-10-04T10:00:00.000Z', respuestas: respuestasPerfectas, puntaje: 100 },
    { estado: 'Rechazado', fechaPostulacion: '2026-09-20T10:00:00.000Z', respuestas: respuestasMedias, puntaje: 60 },
    { estado: 'En Proceso', fechaPostulacion: '2026-10-05T10:00:00.000Z', respuestas: null, puntaje: null },
  ];

  const metricas = calcularMetricas(candidatos, hoy);
  expect(metricas.totalCandidatos).toBe(4);
  expect(metricas.postulacionesMes).toBe(3);
  expect(metricas.evaluacionesCompletadas).toBe(2);
  expect(metricas.pctEvaluacionesCompletadas).toBe(50);
  expect(metricas.porEstado.Pendiente).toBe(1);
  expect(metricas.porEstado['En Proceso']).toBe(1);
  expect(ESTADOS_PROCESO).toHaveLength(4);
});

test('filtra por texto, cargo, estado y rango de fechas', () => {
  const candidatos = [
    { nombre: 'María José González', rut: '12.345.678-5', correo: 'maria@correo.cl', folio: 'AQ-1', cargo: 'Gruero', estado: 'Pendiente', fechaPostulacion: '2026-10-01T10:00:00.000Z' },
    { nombre: 'Pedro Pizarro Díaz', rut: '11.111.111-1', correo: 'pedro@correo.cl', folio: 'AQ-2', cargo: 'Monitor Producción', estado: 'Aprobado', fechaPostulacion: '2026-08-15T10:00:00.000Z' },
  ];

  expect(filtrarCandidatos(candidatos, { busqueda: 'gonzalez' })).toHaveLength(1);
  expect(filtrarCandidatos(candidatos, { busqueda: 'PEDRO' })).toHaveLength(1);
  expect(filtrarCandidatos(candidatos, { estado: 'Aprobado' })).toHaveLength(1);
  expect(filtrarCandidatos(candidatos, { cargo: 'Gruero' })).toHaveLength(1);
  expect(filtrarCandidatos(candidatos, { desde: '2026-09-01' })).toHaveLength(1);
  expect(filtrarCandidatos(candidatos, { hasta: '2026-09-30' })).toHaveLength(1);
  expect(filtrarCandidatos(candidatos, { busqueda: 'zzz' })).toHaveLength(0);
});

test('ordena por fecha, nombre y puntaje', () => {
  const candidatos = [
    { nombre: 'Ana', fechaPostulacion: '2026-10-01T10:00:00.000Z', puntaje: 80 },
    { nombre: 'Beto', fechaPostulacion: '2026-10-03T10:00:00.000Z', puntaje: 55 },
  ];
  expect(ordenarCandidatos(candidatos, 'fechaPostulacion', 'desc')[0].nombre).toBe('Beto');
  expect(ordenarCandidatos(candidatos, 'fechaPostulacion', 'asc')[0].nombre).toBe('Ana');
  expect(ordenarCandidatos(candidatos, 'nombre', 'asc')[0].nombre).toBe('Ana');
  expect(ordenarCandidatos(candidatos, 'puntaje', 'asc')[0].puntaje).toBe(55);
});

test('formatea porcentajes según locale chileno', () => {
  expect(formatearPorcentaje(78)).toBe('78 %');
  expect(formatearPorcentaje(undefined)).toBe('0 %');
});
