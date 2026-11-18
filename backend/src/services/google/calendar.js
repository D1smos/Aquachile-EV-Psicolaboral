import crypto from 'node:crypto';
import { entorno } from '../../config/entorno.js';
import { ErrorHttp } from '../../utils/ErrorHttp.js';

const BASE_CALENDAR = 'https://www.googleapis.com/calendar/v3';
const BASE_EVENTS = () =>
  `${BASE_CALENDAR}/calendars/${encodeURIComponent(entorno.google.calendarId)}/events`;

const tituloDe = (candidato) =>
  `Entrevista psicolaboral - ${candidato?.nombre ?? 'Candidato'} (${candidato?.folio ?? 'sin folio'})`;

export const construirEvento = (entrevista, candidato) => {
  const descripcion = [
    `Entrevista psicolaboral para ${candidato?.nombre ?? 'candidato'}.`,
    `Cargo: ${candidato?.cargo ?? 'no indicado'}.`,
    `Folio: ${candidato?.folio ?? 'no indicado'}.`,
    entrevista?.notas ? `Notas: ${entrevista.notas}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    summary: entrevista?.titulo || tituloDe(candidato),
    description: descripcion,
    location: entrevista?.lugar || undefined,
    start: {
      dateTime: entrevista.fechaInicio,
      timeZone: entrevista.timezone || entorno.google.timezone,
    },
    end: {
      dateTime: entrevista.fechaFin,
      timeZone: entrevista.timezone || entorno.google.timezone,
    },
    attendees: [
      ...(candidato?.correo ? [{ email: candidato.correo }] : []),
      ...(entrevista?.evaluadorEmail ? [{ email: entrevista.evaluadorEmail }] : []),
    ],
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };
};

const extraerMeetUrl = (evento) =>
  evento?.hangoutLink ??
  evento?.conferenceData?.entryPoints?.find((punto) => punto?.entryPointType === 'video')?.uri ??
  null;

const leerRespuesta = async (respuesta) => {
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  if (!respuesta.ok) {
    throw new ErrorHttp(
      datos?.error?.message ?? `Google Calendar respondió HTTP ${respuesta.status}`,
      502,
      [{ codigo: 'GOOGLE_CALENDAR_ERROR', mensaje: datos?.error?.message ?? 'calendar_error' }],
    );
  }
  return datos;
};

const cabeceras = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

export const crearEventoCalendar = async (
  { entrevista, candidato, accessToken, fetchImpl = globalThis.fetch },
) => {
  if (!accessToken) {
    throw new ErrorHttp('No hay credenciales de Google para crear el evento', 401);
  }
  const respuesta = await fetchImpl(
    `${BASE_EVENTS()}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'POST',
      headers: cabeceras(accessToken),
      body: JSON.stringify(construirEvento(entrevista, candidato)),
    },
  );
  const evento = await leerRespuesta(respuesta);
  if (!evento?.id) {
    throw new ErrorHttp('Google Calendar no devolvió el identificador del evento', 502);
  }
  return { googleEventId: evento.id, meetUrl: extraerMeetUrl(evento), evento };
};

export const actualizarEventoCalendar = async (
  { googleEventId, entrevista, candidato, accessToken, fetchImpl = globalThis.fetch },
) => {
  if (!accessToken) {
    throw new ErrorHttp('No hay credenciales de Google para actualizar el evento', 401);
  }
  const respuesta = await fetchImpl(
    `${BASE_EVENTS()}/${encodeURIComponent(googleEventId)}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'PATCH',
      headers: cabeceras(accessToken),
      body: JSON.stringify(construirEvento(entrevista, candidato)),
    },
  );
  const evento = await leerRespuesta(respuesta);
  return { googleEventId: evento?.id ?? googleEventId, meetUrl: extraerMeetUrl(evento), evento };
};

export const eliminarEventoCalendar = async (
  { googleEventId, accessToken, fetchImpl = globalThis.fetch },
) => {
  if (!accessToken) {
    throw new ErrorHttp('No hay credenciales de Google para eliminar el evento', 401);
  }
  const respuesta = await fetchImpl(
    `${BASE_EVENTS()}/${encodeURIComponent(googleEventId)}?sendUpdates=all`,
    { method: 'DELETE', headers: cabeceras(accessToken) },
  );
  if (!respuesta.ok && respuesta.status !== 404) {
    await leerRespuesta(respuesta);
  }
  return true;
};
