import test from 'node:test';
import assert from 'node:assert/strict';
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
  assert.equal(normalizar('  José Pérez  '), 'jose perez');
});

test('calcula el puntaje total ponderado', () => {
  assert.equal(calcularPuntaje(respuestasPerfectas, cuestionario), 100);
  assert.equal(calcularPuntaje(respuestasMedias, cuestionario), 60);
});

test('clasifica la idoneidad según umbrales y dimensiones críticas', () => {
  assert.equal(clasificarIdoneidad(90, []), IDONEIDADES.IDEONEO);
  assert.equal(clasificarIdoneidad(68, []), IDONEIDADES.CON_OBSERVACIONES);
  assert.equal(clasificarIdoneidad(40, []), IDONEIDADES.NO_IDONEO);
  assert.equal(
    clasificarIdoneidad(90, [{ id: 'etica', puntaje: 20 }]),
    IDONEIDADES.CON_OBSERVACIONES,
  );
});

test('la evaluación completa devuelve puntaje, dimensiones e idoneidad', () => {
  const resultado = evaluarRespuestas(respuestasPerfectas, cuestionario);
  assert.equal(resultado.puntaje, 100);
  assert.equal(resultado.dimensiones.length, 2);
  assert.equal(resultado.idoneidad, IDONEIDADES.IDEONEO);
});

test('detecta respuestas incompletas', () => {
  const incompleta = validarRespuestas({ p1: 4 }, cuestionario);
  assert.equal(incompleta.valido, false);
  assert.deepEqual(incompleta.faltantes, ['p2', 'p3']);
  assert.equal(validarRespuestas(respuestasPerfectas, cuestionario).valido, true);
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
  assert.equal(metricas.totalCandidatos, 4);
  assert.equal(metricas.postulacionesMes, 3);
  assert.equal(metricas.evaluacionesCompletadas, 2);
  assert.equal(metricas.pctEvaluacionesCompletadas, 50);
  assert.equal(metricas.porEstado.Pendiente, 1);
  assert.equal(metricas.porEstado['En Proceso'], 1);
  assert.deepEqual(ESTADOS_PROCESO.length, 4);
});

test('filtra por texto, cargo, estado y rango de fechas', () => {
  const candidatos = [
    { nombre: 'María José González', rut: '12.345.678-5', correo: 'maria@correo.cl', folio: 'AQ-1', cargo: 'Gruero', estado: 'Pendiente', fechaPostulacion: '2026-10-01T10:00:00.000Z' },
    { nombre: 'Pedro Pizarro Díaz', rut: '11.111.111-1', correo: 'pedro@correo.cl', folio: 'AQ-2', cargo: 'Monitor Producción', estado: 'Aprobado', fechaPostulacion: '2026-08-15T10:00:00.000Z' },
  ];

  assert.equal(filtrarCandidatos(candidatos, { busqueda: 'gonzalez' }).length, 1);
  assert.equal(filtrarCandidatos(candidatos, { busqueda: 'PEDRO' }).length, 1);
  assert.equal(filtrarCandidatos(candidatos, { estado: 'Aprobado' }).length, 1);
  assert.equal(filtrarCandidatos(candidatos, { cargo: 'Gruero' }).length, 1);
  assert.equal(filtrarCandidatos(candidatos, { desde: '2026-09-01' }).length, 1);
  assert.equal(filtrarCandidatos(candidatos, { hasta: '2026-09-30' }).length, 1);
  assert.equal(filtrarCandidatos(candidatos, { busqueda: 'zzz' }).length, 0);
});

test('ordena por fecha, nombre y puntaje', () => {
  const candidatos = [
    { nombre: 'Ana', fechaPostulacion: '2026-10-01T10:00:00.000Z', puntaje: 80 },
    { nombre: 'Beto', fechaPostulacion: '2026-10-03T10:00:00.000Z', puntaje: 55 },
  ];
  assert.equal(ordenarCandidatos(candidatos, 'fechaPostulacion', 'desc')[0].nombre, 'Beto');
  assert.equal(ordenarCandidatos(candidatos, 'fechaPostulacion', 'asc')[0].nombre, 'Ana');
  assert.equal(ordenarCandidatos(candidatos, 'nombre', 'asc')[0].nombre, 'Ana');
  assert.equal(ordenarCandidatos(candidatos, 'puntaje', 'asc')[0].puntaje, 55);
});

test('formatea porcentajes según locale chileno', () => {
  assert.equal(formatearPorcentaje(78), '78 %');
  assert.equal(formatearPorcentaje(undefined), '0 %');
});
