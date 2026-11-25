import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'secreto-calendar-aquachile';
process.env.GOOGLE_HABILITADO = 'true';
process.env.GOOGLE_CLIENT_ID = 'cliente-prueba';
process.env.GOOGLE_CLIENT_SECRET = 'secreto-prueba';
process.env.GOOGLE_CALENDAR_ID = 'primary';
process.env.CALENDAR_TIMEZONE = 'America/Santiago';

const {
  actualizarEventoCalendar,
  construirEvento,
  crearEventoCalendar,
  eliminarEventoCalendar,
} = await import('../src/services/google/calendar.js');

const entrevista = {
  fechaInicio: '2026-12-01T13:00:00.000Z',
  fechaFin: '2026-12-01T14:00:00.000Z',
  timezone: 'America/Santiago',
  evaluadorEmail: 'evaluador@aquachile.cl',
  titulo: 'Entrevista inicial',
  lugar: 'Sala 1',
  notas: 'Llevar antecedentes',
};

const candidato = {
  nombre: 'Ana Pérez',
  folio: 'AQ-2026-00000001',
  correo: 'ana@correo.cl',
  cargo: 'Monitor Producción',
};

test('construye el evento con rango, invitados y conferencia', () => {
  const evento = construirEvento(entrevista, candidato);
  assert.equal(evento.summary, 'Entrevista inicial');
  assert.equal(evento.start.dateTime, entrevista.fechaInicio);
  assert.equal(evento.start.timeZone, 'America/Santiago');
  assert.deepEqual(
    evento.attendees.map((asistente) => asistente.email),
    ['ana@correo.cl', 'evaluador@aquachile.cl'],
  );
  assert.equal(evento.conferenceData.createRequest.conferenceSolutionKey.type, 'hangoutsMeet');
  assert.match(evento.description, /Monitor Producción/);
});

test('crea el evento y extrae el enlace de Meet', async () => {
  let solicitud = null;
  const fetchImpl = async (url, opciones) => {
    solicitud = { url, opciones };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'evento-123',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
      }),
    };
  };
  const resultado = await crearEventoCalendar({
    entrevista,
    candidato,
    accessToken: 'token',
    fetchImpl,
  });
  assert.equal(resultado.googleEventId, 'evento-123');
  assert.equal(resultado.meetUrl, 'https://meet.google.com/abc-defg-hij');
  assert.match(solicitud.url, /calendars\/primary\/events/);
  assert.match(solicitud.url, /conferenceDataVersion=1/);
  assert.equal(solicitud.opciones.method, 'POST');
  assert.equal(solicitud.opciones.headers.Authorization, 'Bearer token');
});

test('actualiza el evento usando PATCH', async () => {
  let metodo = null;
  const fetchImpl = async (url, opciones) => {
    metodo = opciones.method;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: 'evento-123',
        conferenceData: {
          entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/xyz' }],
        },
      }),
    };
  };
  const resultado = await actualizarEventoCalendar({
    googleEventId: 'evento-123',
    entrevista,
    candidato,
    accessToken: 'token',
    fetchImpl,
  });
  assert.equal(metodo, 'PATCH');
  assert.equal(resultado.meetUrl, 'https://meet.google.com/xyz');
});

test('crea el evento en primary cuando el calendario configurado no existe', async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    if (urls.length === 1) {
      return { ok: false, status: 404, json: async () => ({ error: { message: 'Not Found' } }) };
    }
    return { ok: true, status: 200, json: async () => ({ id: 'evento-primary' }) };
  };
  const resultado = await crearEventoCalendar({
    entrevista,
    candidato,
    accessToken: 'token',
    fetchImpl,
    calendarId: 'calendario-inexistente',
  });
  assert.equal(resultado.googleEventId, 'evento-primary');
  assert.equal(resultado.calendarId, 'primary');
  assert.match(urls[0], /calendars\/calendario-inexistente\/events/);
  assert.match(urls[1], /calendars\/primary\/events/);
});

test('actualiza en primary si el calendario configurado no existe', async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    if (urls.length === 1) {
      return { ok: false, status: 404, json: async () => ({ error: { message: 'Not Found' } }) };
    }
    return { ok: true, status: 200, json: async () => ({ id: 'evento-primary' }) };
  };
  const resultado = await actualizarEventoCalendar({
    googleEventId: 'evento-123',
    entrevista,
    candidato,
    accessToken: 'token',
    fetchImpl,
    calendarId: 'calendario-inexistente',
  });
  assert.equal(resultado.googleEventId, 'evento-primary');
  assert.equal(resultado.calendarId, 'primary');
  assert.match(urls[1], /calendars\/primary\/events/);
});

test('actualizar un evento inexistente devuelve 404 para recrearlo', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: { message: 'Not Found' } }),
  });
  await assert.rejects(
    () =>
      actualizarEventoCalendar({
        googleEventId: 'evento-borrado',
        entrevista,
        candidato,
        accessToken: 'token',
        fetchImpl,
        calendarId: 'primary',
      }),
    (error) => error.codigo === 404,
  );
});

test('propaga el error de Google al sincronizar', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ error: { message: 'Sin permisos de calendario' } }),
  });
  await assert.rejects(
    () => crearEventoCalendar({ entrevista, candidato, accessToken: 'token', fetchImpl }),
    (error) => error.codigo === 502 && /Sin permisos/.test(error.message),
  );
});

test('eliminar un evento inexistente se considera exitoso', async () => {
  const fetchImpl = async () => ({ ok: false, status: 404, json: async () => ({}) });
  const resultado = await eliminarEventoCalendar({
    googleEventId: 'eliminado',
    accessToken: 'token',
    fetchImpl,
  });
  assert.equal(resultado, true);
});
