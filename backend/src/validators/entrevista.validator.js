import { LISTA_ESTADOS_ENTREVISTA } from '../domain/constantes.js';

const fechaValida = (valor) => {
  const fecha = new Date(valor);
  return Boolean(valor) && !Number.isNaN(fecha.getTime());
};

export const validarEntrevista = (datos = {}, { parcial = false } = {}) => {
  const errores = [];
  if (!parcial && !String(datos.candidatoId ?? '').trim()) {
    errores.push({ campo: 'candidatoId', mensaje: 'Selecciona un candidato' });
  }
  if (!parcial && !fechaValida(datos.fechaInicio)) {
    errores.push({ campo: 'fechaInicio', mensaje: 'Indica una fecha y hora de inicio válidas' });
  }
  if (datos.fechaFin !== undefined && datos.fechaFin !== null && !fechaValida(datos.fechaFin)) {
    errores.push({ campo: 'fechaFin', mensaje: 'La fecha de término no es válida' });
  }
  if (
    fechaValida(datos.fechaInicio) &&
    fechaValida(datos.fechaFin) &&
    new Date(datos.fechaFin) <= new Date(datos.fechaInicio)
  ) {
    errores.push({ campo: 'fechaFin', mensaje: 'La fecha de término debe ser posterior al inicio' });
  }
  if (datos.estado !== undefined && !LISTA_ESTADOS_ENTREVISTA.includes(datos.estado)) {
    errores.push({ campo: 'estado', mensaje: `Usa uno de: ${LISTA_ESTADOS_ENTREVISTA.join(', ')}` });
  }
  if (String(datos.notas ?? '').length > 2000) {
    errores.push({ campo: 'notas', mensaje: 'Las notas no pueden superar 2000 caracteres' });
  }
  return errores;
};
