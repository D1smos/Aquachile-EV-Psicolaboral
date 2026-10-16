export const FAMILIAS_CARGO = Object.freeze({
  'Profesional A': ['Líder Desarrollo Producción'],
  'Profesional B/C': ['Analista de Sistemas', 'Coordinador Servicios Generales'],
  'Técnico B/C': ['Asistente Bodega Planta', 'Operador Sala Control', 'Monitor Producción'],
  'Operario Calificado': ['Gruero'],
});

export const DISPONIBILIDADES = Object.freeze(['Inmediata', '15 días', '30 días', '60 días']);

export const FORMACIONES = Object.freeze(['Técnico', 'Profesional', 'Magíster', 'Doctorado']);

export const cargoEsValido = (familia, cargo) =>
  Object.prototype.hasOwnProperty.call(FAMILIAS_CARGO, familia) &&
  FAMILIAS_CARGO[familia].includes(cargo);
