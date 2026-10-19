export const ESTADOS_PROCESO = Object.freeze([
  'Pendiente',
  'En Proceso',
  'Aprobado',
  'Rechazado',
]);

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

const RESPUESTA_MINIMA = 1;
const RESPUESTA_MAXIMA = 5;

const redondear = (valor) => Math.round(valor * 10) / 10;

export const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const puntajeDe = (respuestas, preguntas) => {
  const pesoTotal = preguntas.reduce((acumulado, pregunta) => acumulado + pregunta.peso, 0);
  if (pesoTotal <= 0) {
    return 0;
  }
  const suma = preguntas.reduce(
    (acumulado, pregunta) => acumulado + (respuestas?.[pregunta.id] ?? 0) * pregunta.peso,
    0,
  );
  return redondear((suma / (RESPUESTA_MAXIMA * pesoTotal)) * 100);
};

export const calcularPuntaje = (respuestas, cuestionario) =>
  puntajeDe(respuestas, cuestionario.preguntas);

export const calcularPuntajesPorDimension = (respuestas, cuestionario) =>
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

export const clasificarIdoneidad = (puntaje, dimensiones = []) => {
  if (puntaje < UMBRALES.noIdoneo) {
    return IDONEIDADES.NO_IDONEO;
  }
  const dimensionCritica = dimensiones.some(
    (dimension) => dimension.puntaje < UMBRALES.dimensionCritica,
  );
  if (puntaje >= UMBRALES.idoneo && !dimensionCritica) {
    return IDONEIDADES.IDEONEO;
  }
  return IDONEIDADES.CON_OBSERVACIONES;
};

export const evaluarRespuestas = (respuestas, cuestionario) => {
  const puntaje = calcularPuntaje(respuestas, cuestionario);
  const dimensiones = calcularPuntajesPorDimension(respuestas, cuestionario);
  return { puntaje, dimensiones, idoneidad: clasificarIdoneidad(puntaje, dimensiones) };
};

export const validarRespuestas = (respuestas, cuestionario) => {
  const faltantes = cuestionario.preguntas.filter((pregunta) => {
    const valor = respuestas?.[pregunta.id];
    return !Number.isInteger(valor) || valor < RESPUESTA_MINIMA || valor > RESPUESTA_MAXIMA;
  });
  return { valido: faltantes.length === 0, faltantes: faltantes.map((pregunta) => pregunta.id) };
};

export const estadoPorIdoneidad = (idoneidad) =>
  idoneidad === IDONEIDADES.NO_IDONEO ? 'Rechazado' : 'Aprobado';

export const estaEvaluado = (candidato) => {
  if (!Number.isFinite(candidato?.puntaje)) {
    return false;
  }
  const respuestas = candidato?.respuestas;
  return (
    Boolean(respuestas) &&
    typeof respuestas === 'object' &&
    Object.keys(respuestas).length > 0
  );
};

const esDelMes = (fecha, referencia) => {
  const datos = new Date(fecha);
  return (
    datos.getFullYear() === referencia.getFullYear() &&
    datos.getMonth() === referencia.getMonth()
  );
};

export const calcularMetricas = (candidatos, fechaReferencia = new Date()) => {
  const porEstado = Object.fromEntries(ESTADOS_PROCESO.map((estado) => [estado, 0]));
  let postulacionesMes = 0;
  let evaluacionesCompletadas = 0;

  candidatos.forEach((candidato) => {
    if (Object.hasOwn(porEstado, candidato.estado)) {
      porEstado[candidato.estado] += 1;
    }
    if (esDelMes(candidato.fechaPostulacion, fechaReferencia)) {
      postulacionesMes += 1;
    }
    if (estaEvaluado(candidato)) {
      evaluacionesCompletadas += 1;
    }
  });

  const totalCandidatos = candidatos.length;
  const pctEvaluacionesCompletadas =
    totalCandidatos === 0 ? 0 : Math.round((evaluacionesCompletadas / totalCandidatos) * 100);

  return {
    totalCandidatos,
    postulacionesMes,
    evaluacionesCompletadas,
    pctEvaluacionesCompletadas,
    porEstado,
  };
};

export const filtrarCandidatos = (candidatos, filtros = {}) => {
  const busqueda = normalizar(filtros.busqueda);
  const { cargo = '', estado = '', desde = '', hasta = '' } = filtros;

  return candidatos.filter((candidato) => {
    if (busqueda) {
      const texto = normalizar(
        `${candidato.nombre} ${candidato.rut} ${candidato.correo} ${candidato.folio}`,
      );
      if (!texto.includes(busqueda)) {
        return false;
      }
    }
    if (cargo && candidato.cargo !== cargo) {
      return false;
    }
    if (estado && candidato.estado !== estado) {
      return false;
    }
    const dia = String(candidato.fechaPostulacion ?? '').slice(0, 10);
    if (desde && dia < desde) {
      return false;
    }
    if (hasta && dia > hasta) {
      return false;
    }
    return true;
  });
};

export const ordenarCandidatos = (candidatos, campo = 'fechaPostulacion', direccion = 'desc') => {
  const factor = direccion === 'asc' ? 1 : -1;
  const copia = [...candidatos];

  return copia.sort((a, b) => {
    if (campo === 'puntaje') {
      return ((a.puntaje ?? -1) - (b.puntaje ?? -1)) * factor;
    }
    if (campo === 'fechaPostulacion') {
      return String(a.fechaPostulacion).localeCompare(String(b.fechaPostulacion)) * factor;
    }
    return String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'es') * factor;
  });
};

export const formatearFecha = (fecha) => {
  if (!fecha) {
    return '—';
  }
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(fecha))
    .replace('.', '');
};

export const formatearPorcentaje = (valor) =>
  `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(valor ?? 0)} %`;
