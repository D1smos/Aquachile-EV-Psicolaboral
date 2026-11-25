import { dbEntrevistas } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { ESTADOS_ENTREVISTA, ESTADOS_SYNC_CALENDAR } from '../domain/constantes.js';
import { ErrorHttp, noEncontrado } from '../utils/ErrorHttp.js';
import { obtenerCandidato } from './candidato.service.js';
import {
  actualizarEventoCalendar,
  crearEventoCalendar,
  eliminarEventoCalendar,
} from './google/calendar.js';
import { obtenerAccessTokenGoogle } from './google/oauth.js';

const CAMPOS_ACTUALIZABLES = new Set([
  'evaluadorEmail',
  'titulo',
  'fechaInicio',
  'fechaFin',
  'timezone',
  'lugar',
  'notas',
  'estado',
]);

const aFecha = (valor, campo) => {
  const fecha = new Date(valor);
  if (!valor || Number.isNaN(fecha.getTime())) {
    throw new ErrorHttp(`La fecha ${campo} no es válida`, 400, [
      { campo, mensaje: 'Usa una fecha y hora válidas' },
    ]);
  }
  return fecha.toISOString();
};

const tituloDe = (candidato) =>
  `Entrevista psicolaboral - ${candidato.nombre} (${candidato.folio})`;

const resumenCandidato = (candidato) => ({
  id: candidato.id,
  nombre: candidato.nombre,
  folio: candidato.folio,
  correo: candidato.correo,
  cargo: candidato.cargo,
});

const enriquecer = async (entrevista) => {
  if (!entrevista) {
    return null;
  }
  let candidato = null;
  try {
    candidato = await obtenerCandidato(entrevista.candidatoId);
  } catch {
    candidato = null;
  }
  return {
    ...entrevista,
    candidato: candidato ? resumenCandidato(candidato) : null,
    candidatoNombre: candidato?.nombre ?? 'Candidato eliminado',
    folio: candidato?.folio ?? '',
    candidatoCorreo: candidato?.correo ?? '',
    cargo: candidato?.cargo ?? '',
  };
};

const sincronizarConGoogle = async (entrevista, { usuarioEmail = null, fetchImpl } = {}) => {
  if (!entorno.google.habilitado) {
    return {
      entrevista: await enriquecer(entrevista),
      sincronizada: false,
      motivo: 'Google Calendar no habilitado',
    };
  }
  let accessToken = null;
  try {
    accessToken = await obtenerAccessTokenGoogle(usuarioEmail ?? entrevista.evaluadorEmail, {
      fetchImpl,
    });
  } catch (error) {
    const conError = await dbEntrevistas.actualizar(entrevista.id, {
      estadoSync: ESTADOS_SYNC_CALENDAR.ERROR,
      errorSync: error.message,
    });
    return { entrevista: await enriquecer(conError), sincronizada: false, motivo: error.message };
  }
  if (!accessToken) {
    return {
      entrevista: await enriquecer(entrevista),
      sincronizada: false,
      motivo: 'Conecta Google Calendar para sincronizar',
    };
  }

  const candidato = await obtenerCandidato(entrevista.candidatoId);
  try {
    let resultado;
    let recreada = false;
    if (entrevista.googleEventId) {
      try {
        resultado = await actualizarEventoCalendar({
          googleEventId: entrevista.googleEventId,
          entrevista,
          candidato,
          accessToken,
          fetchImpl,
        });
      } catch (error) {
        if (error?.codigo !== 404) {
          throw error;
        }
        recreada = true;
        await dbEntrevistas.actualizar(entrevista.id, {
          googleEventId: null,
          meetUrl: null,
          estadoSync: ESTADOS_SYNC_CALENDAR.PENDIENTE,
          errorSync: null,
        });
        resultado = await crearEventoCalendar({
          entrevista: { ...entrevista, googleEventId: null, meetUrl: null },
          candidato,
          accessToken,
          fetchImpl,
        });
      }
    } else {
      resultado = await crearEventoCalendar({ entrevista, candidato, accessToken, fetchImpl });
    }
    const actualizada = await dbEntrevistas.actualizar(entrevista.id, {
      estadoSync: ESTADOS_SYNC_CALENDAR.SINCRONIZADA,
      googleEventId: resultado.googleEventId,
      meetUrl: resultado.meetUrl ?? (recreada ? null : entrevista.meetUrl ?? null),
      errorSync: null,
    });
    return { entrevista: await enriquecer(actualizada), sincronizada: true };
  } catch (error) {
    const conError = await dbEntrevistas.actualizar(entrevista.id, {
      estadoSync: ESTADOS_SYNC_CALENDAR.ERROR,
      errorSync: error.message,
    });
    return { entrevista: await enriquecer(conError), sincronizada: false, motivo: error.message };
  }
};

export const listarEntrevistas = async ({ desde = null, hasta = null, candidatoId = null } = {}) => {
  const hastaNormalizado =
    hasta && String(hasta).length === 10 ? `${hasta}T23:59:59.999Z` : hasta;
  const entrevistas = await dbEntrevistas.listar({
    desde,
    hasta: hastaNormalizado,
    candidatoId,
  });
  return Promise.all(entrevistas.map(enriquecer));
};

export const obtenerEntrevista = async (id) => enriquecer(await dbEntrevistas.obtenerPorId(id));

export const crearEntrevista = async (
  datos = {},
  { usuarioEmail = null, fetchImpl } = {},
) => {
  const candidato = await obtenerCandidato(datos.candidatoId);
  const fechaInicio = aFecha(datos.fechaInicio, 'de inicio');
  const fechaFin = datos.fechaFin
    ? aFecha(datos.fechaFin, 'de término')
    : new Date(new Date(fechaInicio).getTime() + 60 * 60 * 1000).toISOString();
  if (new Date(fechaFin) <= new Date(fechaInicio)) {
    throw new ErrorHttp('La fecha de término debe ser posterior al inicio', 400);
  }
  const evaluadorEmail = String(
    datos.evaluadorEmail ?? usuarioEmail ?? entorno.resend.encargadoEmail,
  )
    .trim()
    .toLowerCase();
  if (!evaluadorEmail) {
    throw new ErrorHttp('Falta el evaluador de la entrevista', 400);
  }
  const entrevista = await dbEntrevistas.insertar({
    candidatoId: candidato.id,
    evaluadorEmail,
    titulo: String(datos.titulo ?? '').trim() || tituloDe(candidato),
    fechaInicio,
    fechaFin,
    timezone: String(datos.timezone ?? entorno.google.timezone).trim() || entorno.google.timezone,
    lugar: String(datos.lugar ?? '').trim() || null,
    notas: String(datos.notas ?? '').trim() || null,
    estado: ESTADOS_ENTREVISTA.PROGRAMADA,
    estadoSync: ESTADOS_SYNC_CALENDAR.PENDIENTE,
  });
  return sincronizarConGoogle(entrevista, { usuarioEmail: evaluadorEmail, fetchImpl });
};

export const actualizarEntrevista = async (
  id,
  cambios = {},
  { usuarioEmail = null, fetchImpl } = {},
) => {
  const actual = await dbEntrevistas.obtenerPorId(id);
  if (!actual) {
    throw noEncontrado('Entrevista');
  }
  const fila = {};
  for (const [campo, valor] of Object.entries(cambios)) {
    if (!CAMPOS_ACTUALIZABLES.has(campo)) {
      continue;
    }
    if (campo === 'fechaInicio' || campo === 'fechaFin') {
      fila[campo] = aFecha(valor, campo === 'fechaInicio' ? 'de inicio' : 'de término');
    } else if (campo === 'notas' || campo === 'lugar' || campo === 'titulo') {
      fila[campo] = String(valor ?? '').trim() || null;
    } else {
      fila[campo] = valor;
    }
  }
  if (fila.fechaInicio && !fila.fechaFin) {
    fila.fechaFin = new Date(new Date(fila.fechaInicio).getTime() + 60 * 60 * 1000).toISOString();
  }
  const actualizada = Object.keys(fila).length
    ? await dbEntrevistas.actualizar(id, fila)
    : actual;
  if (!actualizada) {
    throw noEncontrado('Entrevista');
  }
  return sincronizarConGoogle(actualizada, {
    usuarioEmail: usuarioEmail ?? actualizada.evaluadorEmail,
    fetchImpl,
  });
};

export const sincronizarEntrevista = async (id, { usuarioEmail = null, fetchImpl } = {}) => {
  const entrevista = await dbEntrevistas.obtenerPorId(id);
  if (!entrevista) {
    throw noEncontrado('Entrevista');
  }
  return sincronizarConGoogle(entrevista, {
    usuarioEmail: usuarioEmail ?? entrevista.evaluadorEmail,
    fetchImpl,
  });
};

export const eliminarEntrevista = async (id, { usuarioEmail = null, fetchImpl } = {}) => {
  const entrevista = await dbEntrevistas.obtenerPorId(id);
  if (!entrevista) {
    throw noEncontrado('Entrevista');
  }
  if (entorno.google.habilitado && entrevista.googleEventId) {
    try {
      const accessToken = await obtenerAccessTokenGoogle(
        usuarioEmail ?? entrevista.evaluadorEmail,
        { fetchImpl },
      );
      if (accessToken) {
        await eliminarEventoCalendar({
          googleEventId: entrevista.googleEventId,
          accessToken,
          fetchImpl,
        });
      }
    } catch {
      // La eliminación local siempre tiene prioridad.
    }
  }
  await dbEntrevistas.eliminar(id);
  return { id, eliminada: true };
};
