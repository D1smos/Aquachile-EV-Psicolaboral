export const FAMILIAS_CARGO = Object.freeze({
  'Profesional A': [
    'Ingeniero en Acuicultura',
    'Ingeniero de Procesos Planta',
    'Ingeniero de Mantenimiento Industrial',
    'Ingeniero en Informática y Datos',
    'Médico Veterinario - Salud de Peces',
    'Líder Desarrollo Producción',
  ],
  'Profesional B/C': [
    'Ingeniero en Prevención de Riesgos (HSE)',
    'Ingeniero en Alimentos - Aseguramiento de Calidad',
    'Ingeniero en Logística y Cadena de Suministro',
    'Analista de Sistemas',
    'Coordinador Servicios Generales',
  ],
  'Técnico B/C': [
    'Técnico en Acuicultura',
    'Técnico de Mantenimiento Industrial',
    'Asistente Bodega Planta',
    'Operador Sala Control',
    'Monitor Producción',
  ],
  'Operario Calificado': ['Gruero', 'Operador de Planta', 'Operario de Planta de Procesos'],
});

export const DISPONIBILIDADES = Object.freeze(['Inmediata', '15 días', '30 días', '60 días']);

export const FORMACIONES = Object.freeze(['Técnico', 'Profesional', 'Magíster', 'Doctorado']);

export const cargoEsValido = (familia, cargo) =>
  Object.prototype.hasOwnProperty.call(FAMILIAS_CARGO, familia) &&
  FAMILIAS_CARGO[familia].includes(cargo);