export const DIMENSIONES = Object.freeze([
  { id: 'estabilidad', nombre: 'Estabilidad emocional' },
  { id: 'adaptabilidad', nombre: 'Adaptabilidad al cambio' },
  { id: 'trabajoEquipo', nombre: 'Trabajo en equipo' },
  { id: 'etica', nombre: 'Ética y compromiso' },
]);

export const OPCIONES_RESPUESTA = Object.freeze([
  { valor: 1, etiqueta: 'Nunca' },
  { valor: 2, etiqueta: 'Casi nunca' },
  { valor: 3, etiqueta: 'A veces' },
  { valor: 4, etiqueta: 'Casi siempre' },
  { valor: 5, etiqueta: 'Siempre' },
]);

export const CUESTIONARIO = Object.freeze({
  dimensiones: DIMENSIONES,
  preguntas: Object.freeze([
    { id: 'p1', dimension: 'estabilidad', peso: 1, texto: 'Mantengo la calma cuando el trabajo se tensa o hay plazos ajustados.' },
    { id: 'p2', dimension: 'estabilidad', peso: 1, texto: 'Recibo la retroalimentación crítica como una oportunidad de mejora.' },
    { id: 'p3', dimension: 'adaptabilidad', peso: 1.2, texto: 'Me adapto con rapidez a cambios de proceso, turnos o prioridades.' },
    { id: 'p4', dimension: 'adaptabilidad', peso: 1, texto: 'Aprendo con facilidad nuevas herramientas, equipos o metodologías.' },
    { id: 'p5', dimension: 'trabajoEquipo', peso: 1.2, texto: 'Colaboro activamente con mis compañeros para alcanzar las metas del área.' },
    { id: 'p6', dimension: 'trabajoEquipo', peso: 1, texto: 'Resuelvo desacuerdos con respeto y buscando acuerdos constructivos.' },
    { id: 'p7', dimension: 'trabajoEquipo', peso: 1, texto: 'Comparto información relevante con el equipo de forma oportuna.' },
    { id: 'p8', dimension: 'etica', peso: 1.3, texto: 'Cumplo con los plazos y compromisos que asumo.' },
    { id: 'p9', dimension: 'etica', peso: 1.5, texto: 'Respeto y aplico las normas de seguridad e higiene de la planta.' },
    { id: 'p10', dimension: 'etica', peso: 1.5, texto: 'Actúo con honestidad incluso cuando nadie me está observando.' },
  ]),
});
