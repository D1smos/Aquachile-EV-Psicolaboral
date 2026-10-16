import { LISTA_ESTADOS } from '../domain/constantes.js';
import { validarRespuestas } from '../services/evaluacion.service.js';

export const validarEvaluacion = (cuerpo = {}) => {
  const errores = validarRespuestas(cuerpo.respuestas);

  const observaciones = cuerpo.observaciones;
  if (observaciones !== undefined && observaciones !== null) {
    const texto = String(observaciones);
    if (texto.length > 1000) {
      errores.push({ campo: 'observaciones', mensaje: 'Las observaciones no superan los 1000 caracteres' });
    }
  }

  if (cuerpo.estado !== undefined && !LISTA_ESTADOS.includes(cuerpo.estado)) {
    errores.push({ campo: 'estado', mensaje: 'Estado de proceso no válido' });
  }

  return errores;
};

export const validarEstado = (estado) =>
  LISTA_ESTADOS.includes(estado)
    ? []
    : [{ campo: 'estado', mensaje: 'Estado de proceso no válido' }];
