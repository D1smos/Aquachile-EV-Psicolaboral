export const ESTADOS_PROCESO = Object.freeze({
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En Proceso',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
});

export const LISTA_ESTADOS = Object.freeze(Object.values(ESTADOS_PROCESO));

export const IDONEIDADES = Object.freeze({
  IDEONEO: 'Idóneo',
  CON_OBSERVACIONES: 'Idóneo con observaciones',
  NO_IDONEO: 'No idóneo',
});

export const UMBRALES = Object.freeze({
  idoneo: 75,
  noIdoneo: 60,
  dimensionCritica: 40,
});

export const TIPOS_ARCHIVO = Object.freeze({
  CV: 'cv',
  ANTECEDENTES: 'antecedentes',
});
