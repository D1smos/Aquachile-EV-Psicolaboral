import test from 'node:test';
import assert from 'node:assert/strict';
import { CUESTIONARIO } from '../src/domain/cuestionario.js';
import { IDONEIDADES, ESTADOS_PROCESO } from '../src/domain/constantes.js';
import {
  calcularPuntaje,
  calcularPuntajesPorDimension,
  clasificarIdoneidad,
  estadoPorIdoneidad,
  evaluarRespuestas,
  validarRespuestas,
} from '../src/services/evaluacion.service.js';

const respuestasMaximas = Object.fromEntries(CUESTIONARIO.preguntas.map((p) => [p.id, 5]));
const respuestasMinimas = Object.fromEntries(CUESTIONARIO.preguntas.map((p) => [p.id, 1]));
const respuestasMixtas = { p1: 4, p2: 5, p3: 3, p4: 4, p5: 5, p6: 4, p7: 3, p8: 5, p9: 5, p10: 4 };

test('un puntaje perfecto equivale a 100 puntos', () => {
  assert.equal(calcularPuntaje(respuestasMaximas), 100);
});

test('un puntaje mínimo equivale a 20 puntos', () => {
  assert.equal(calcularPuntaje(respuestasMinimas), 20);
});

test('las dimensiones se calculan por separado y quedan en rango 0-100', () => {
  const dimensiones = calcularPuntajesPorDimension(respuestasMixtas);
  assert.equal(dimensiones.length, CUESTIONARIO.dimensiones.length);
  dimensiones.forEach((dimension) => {
    assert.ok(dimension.puntaje >= 0 && dimension.puntaje <= 100);
  });
});

test('clasifica como idóneo con puntaje alto y dimensiones sanas', () => {
  const { puntaje, dimensiones, idoneidad } = evaluarRespuestas(respuestasMaximas);
  assert.equal(puntaje, 100);
  assert.equal(idoneidad, IDONEIDADES.IDEONEO);
  assert.equal(dimensiones.length, 4);
});

test('clasifica como no idóneo con puntaje bajo', () => {
  assert.equal(clasificarIdoneidad(45, []), IDONEIDADES.NO_IDONEO);
});

test('una dimensión crítica impide el dictamen idóneo', () => {
  const dimensiones = [
    { id: 'etica', nombre: 'Ética y compromiso', puntaje: 30 },
    { id: 'estabilidad', nombre: 'Estabilidad emocional', puntaje: 90 },
  ];
  assert.equal(clasificarIdoneidad(85, dimensiones), IDONEIDADES.CON_OBSERVACIONES);
});

test('el estado del proceso se deriva de la idoneidad', () => {
  assert.equal(estadoPorIdoneidad(IDONEIDADES.IDEONEO), ESTADOS_PROCESO.APROBADO);
  assert.equal(estadoPorIdoneidad(IDONEIDADES.CON_OBSERVACIONES), ESTADOS_PROCESO.APROBADO);
  assert.equal(estadoPorIdoneidad(IDONEIDADES.NO_IDONEO), ESTADOS_PROCESO.RECHAZADO);
});

test('detecta respuestas faltantes o fuera de rango', () => {
  const incompletas = { p1: 3, p2: 9 };
  const errores = validarRespuestas(incompletas);
  assert.ok(errores.length >= CUESTIONARIO.preguntas.length - 1);
  assert.equal(validarRespuestas(null).length, 1);
  assert.equal(validarRespuestas(respuestasMixtas).length, 0);
});
