import { CUESTIONARIO, OPCIONES_RESPUESTA } from '../domain/cuestionario.js';
import { ESTADOS_PROCESO, IDONEIDADES, UMBRALES } from '../domain/constantes.js';

const RESPUESTA_MINIMA = OPCIONES_RESPUESTA[0].valor;
const RESPUESTA_MAXIMA = OPCIONES_RESPUESTA[OPCIONES_RESPUESTA.length - 1].valor;

const redondear = (valor) => Math.round(valor * 10) / 10;

const pesoTotalDe = (preguntas) =>
  preguntas.reduce((acumulado, pregunta) => acumulado + pregunta.peso, 0);

const puntajeDe = (respuestas, preguntas) => {
  const pesoTotal = pesoTotalDe(preguntas);
  if (pesoTotal <= 0) {
    return 0;
  }
  const suma = preguntas.reduce(
    (acumulado, pregunta) => acumulado + (respuestas[pregunta.id] ?? 0) * pregunta.peso,
    0,
  );
  return redondear((suma / (RESPUESTA_MAXIMA * pesoTotal)) * 100);
};

export const validarRespuestas = (respuestas, cuestionario = CUESTIONARIO) => {
  if (!respuestas || typeof respuestas !== 'object' || Array.isArray(respuestas)) {
    return [{ campo: 'respuestas', mensaje: 'Debes enviar las respuestas del cuestionario' }];
  }

  return cuestionario.preguntas
    .filter((pregunta) => {
      const valor = respuestas[pregunta.id];
      return !Number.isInteger(valor) || valor < RESPUESTA_MINIMA || valor > RESPUESTA_MAXIMA;
    })
    .map((pregunta) => ({
      campo: `respuestas.${pregunta.id}`,
      mensaje: `Respuesta inválida en la pregunta ${pregunta.id}`,
    }));
};

export const calcularPuntaje = (respuestas, cuestionario = CUESTIONARIO) =>
  puntajeDe(respuestas, cuestionario.preguntas);

export const calcularPuntajesPorDimension = (respuestas, cuestionario = CUESTIONARIO) =>
  cuestionario.dimensiones.map((dimension) => {
    const preguntas = cuestionario.preguntas.filter(
      (pregunta) => pregunta.dimension === dimension.id,
    );
    return {
      id: dimension.id,
      nombre: dimension.nombre,
      puntaje: preguntas.length > 0 ? puntajeDe(respuestas, preguntas) : 0,
    };
  });

export const clasificarIdoneidad = (puntaje, puntajesDimension = []) => {
  if (puntaje < UMBRALES.noIdoneo) {
    return IDONEIDADES.NO_IDONEO;
  }
  const dimensionCritica = puntajesDimension.some(
    (dimension) => dimension.puntaje < UMBRALES.dimensionCritica,
  );
  if (puntaje >= UMBRALES.idoneo && !dimensionCritica) {
    return IDONEIDADES.IDEONEO;
  }
  return IDONEIDADES.CON_OBSERVACIONES;
};

export const evaluarRespuestas = (respuestas, cuestionario = CUESTIONARIO) => {
  const puntaje = calcularPuntaje(respuestas, cuestionario);
  const dimensiones = calcularPuntajesPorDimension(respuestas, cuestionario);
  return {
    puntaje,
    dimensiones,
    idoneidad: clasificarIdoneidad(puntaje, dimensiones),
  };
};

export const estadoPorIdoneidad = (idoneidad) =>
  idoneidad === IDONEIDADES.NO_IDONEO
    ? ESTADOS_PROCESO.RECHAZADO
    : ESTADOS_PROCESO.APROBADO;
