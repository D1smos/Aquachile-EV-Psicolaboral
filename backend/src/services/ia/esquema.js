import { ErrorHttp } from '../../utils/ErrorHttp.js';

const errorEsquema = (detalle) => {
  const error = new ErrorHttp(`La IA devolvió un JSON inválido: ${detalle}`, 502, [
    { codigo: 'BAD_GATEWAY_IA', mensaje: detalle },
  ]);
  error.codigoIA = 'BAD_GATEWAY_IA';
  return error;
};

export const limpiarJson = (texto) => {
  const limpio = String(texto ?? '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin < inicio) {
    throw errorEsquema('no se encontró un objeto JSON');
  }
  return limpio.slice(inicio, fin + 1);
};

export const parsearRespuestaJson = (texto) => {
  try {
    return JSON.parse(limpiarJson(texto));
  } catch (error) {
    if (error.codigoIA === 'BAD_GATEWAY_IA') {
      throw error;
    }
    throw errorEsquema('el contenido no es JSON parseable');
  }
};

const esObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esTexto = (valor) => typeof valor === 'string';
const esNumero = (valor) => typeof valor === 'number' && Number.isFinite(valor);
const esEntero = (valor) => Number.isInteger(valor);
const esArreglo = (valor) => Array.isArray(valor);
const entre = (valor, minimo, maximo) => esNumero(valor) && valor >= minimo && valor <= maximo;

const exigir = (condicion, mensaje) => {
  if (!condicion) {
    throw errorEsquema(mensaje);
  }
};

const validarListaObjetos = (valor, nombre, campos) => {
  exigir(esArreglo(valor), `${nombre} debe ser un arreglo`);
  valor.forEach((item, indice) => {
    exigir(esObjeto(item), `${nombre}[${indice}] debe ser un objeto`);
    for (const campo of campos) {
      exigir(esTexto(item[campo]), `${nombre}[${indice}].${campo} debe ser texto`);
    }
  });
};

export const validarEsquemaAnalisis = (entrada) => {
  const datos = esTexto(entrada) ? parsearRespuestaJson(entrada) : entrada;
  exigir(esObjeto(datos), 'la respuesta debe ser un objeto');
  exigir(datos.version === '1.0', 'version debe ser "1.0"');
  exigir(esTexto(datos.resumen) && datos.resumen.length >= 10 && datos.resumen.length <= 900, 'resumen debe tener entre 10 y 900 caracteres');
  exigir(esEntero(datos.anosExperienciaEstimados) && datos.anosExperienciaEstimados >= 0, 'anosExperienciaEstimados debe ser un entero mayor o igual a 0');
  exigir(esArreglo(datos.palabrasClaveDetectadas), 'palabrasClaveDetectadas debe ser un arreglo');
  exigir(datos.palabrasClaveDetectadas.every(esTexto), 'palabrasClaveDetectadas solo admite textos');
  const palabrasClave = [...new Set(datos.palabrasClaveDetectadas.map((palabra) => palabra.trim().toLowerCase()).filter(Boolean))];
  exigir(palabrasClave.length <= 25, 'palabrasClaveDetectadas admite como máximo 25 elementos');

  exigir(esObjeto(datos.afinidad), 'afinidad debe ser un objeto');
  exigir(esNumero(datos.afinidad.score) && entre(datos.afinidad.score, 0, 100), 'afinidad.score debe ser un número entre 0 y 100');
  exigir(['bajo', 'medio', 'alto'].includes(datos.afinidad.nivel), 'afinidad.nivel no es válido');
  exigir(esTexto(datos.afinidad.justificacion), 'afinidad.justificacion debe ser texto');

  validarListaObjetos(datos.fortalezas, 'fortalezas', ['titulo', 'evidencia', 'documento']);
  validarListaObjetos(datos.brechas, 'brechas', ['titulo', 'evidencia', 'documento']);

  exigir(esArreglo(datos.competencias), 'competencias debe ser un arreglo');
  datos.competencias.forEach((competencia, indice) => {
    exigir(esObjeto(competencia), `competencias[${indice}] debe ser un objeto`);
    exigir(esTexto(competencia.id), `competencias[${indice}].id debe ser texto`);
    exigir(esTexto(competencia.nombre), `competencias[${indice}].nombre debe ser texto`);
    exigir(esEntero(competencia.nivel) && entre(competencia.nivel, 1, 5), `competencias[${indice}].nivel debe estar entre 1 y 5`);
    exigir(esArreglo(competencia.evidencia) && competencia.evidencia.every(esTexto), `competencias[${indice}].evidencia debe ser un arreglo de textos`);
    exigir(entre(competencia.confianza, 0, 1), `competencias[${indice}].confianza debe estar entre 0 y 1`);
  });

  validarListaObjetos(datos.preguntasEntrevista, 'preguntasEntrevista', ['pregunta', 'objetivo', 'competenciaId']);
  exigir(esObjeto(datos.recomendacion), 'recomendacion debe ser un objeto');
  exigir(['avanzar', 'revisar', 'descartar'].includes(datos.recomendacion.codigo), 'recomendacion.codigo no es válido');
  exigir(esTexto(datos.recomendacion.texto), 'recomendacion.texto debe ser texto');
  exigir(entre(datos.confianza, 0, 1), 'confianza debe estar entre 0 y 1');
  exigir(esArreglo(datos.advertencias) && datos.advertencias.every(esTexto), 'advertencias debe ser un arreglo de textos');

  return { ...datos, palabrasClaveDetectadas: palabrasClave };
};
