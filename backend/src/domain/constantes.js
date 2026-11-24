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

export const TIPOS_DOCUMENTO = Object.freeze({
  ...TIPOS_ARCHIVO,
  INFORME: 'informe',
  PRUEBA: 'prueba',
});

export const ESTADOS_TEXTO = Object.freeze({
  OK: 'ok',
  SIN_TEXTO: 'sin_texto',
  ERROR: 'error',
  NO_SOPORTADO: 'no_soportado',
});

export const ESTADOS_ANALISIS = Object.freeze({
  BORRADOR: 'borrador',
  REVISADO: 'revisado',
  DESCARTADO: 'descartado',
});

export const ESTADOS_ENTREVISTA = Object.freeze({
  PROGRAMADA: 'programada',
  REALIZADA: 'realizada',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio',
});

export const LISTA_ESTADOS_ENTREVISTA = Object.freeze(Object.values(ESTADOS_ENTREVISTA));

export const ESTADOS_SYNC_CALENDAR = Object.freeze({
  PENDIENTE: 'pendiente',
  SINCRONIZADA: 'sincronizada',
  ERROR: 'error',
  LOCAL: 'local',
});

export const LISTA_ESTADOS_SYNC_CALENDAR = Object.freeze(Object.values(ESTADOS_SYNC_CALENDAR));
