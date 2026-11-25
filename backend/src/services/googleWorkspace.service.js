import { google } from 'googleapis';
import { createReadStream } from 'node:fs';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
];

let driveCuentaServicio = null;
let calendarCuentaServicio = null;

const inicializarCuentaServicio = async () => {
  if (driveCuentaServicio && calendarCuentaServicio) {
    return { drive: driveCuentaServicio, calendar: calendarCuentaServicio };
  }

  const ruta = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const jsonTexto = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  let auth;
  if (ruta) {
    auth = new google.auth.GoogleAuth({
      keyFile: ruta,
      scopes: SCOPES,
    });
  } else if (jsonTexto) {
    const credenciales = JSON.parse(jsonTexto);
    auth = new google.auth.GoogleAuth({
      credentials: credenciales,
      scopes: SCOPES,
    });
  } else {
    throw new Error(
      'Falta GOOGLE_APPLICATION_CREDENTIALS o GOOGLE_SERVICE_ACCOUNT_JSON en backend/.env',
    );
  }

  driveCuentaServicio = google.drive({ version: 'v3', auth });
  calendarCuentaServicio = google.calendar({ version: 'v3', auth });
  return { drive: driveCuentaServicio, calendar: calendarCuentaServicio };
};

const crearDriveOAuth = () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth });
};

export const uploadToDrive = async ({ filePath, fileName, mimeType }) => {
  const carpeta = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!carpeta) {
    throw new Error('Falta GOOGLE_DRIVE_FOLDER_ID en backend/.env');
  }

  const drive = crearDriveOAuth() ?? (await inicializarCuentaServicio()).drive;

  const respuesta = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [carpeta],
    },
    media: {
      mimeType,
      body: createReadStream(filePath),
    },
    fields: 'id, name, webViewLink',
    supportsAllDrives: true,
  });

  return respuesta.data;
};

export const eliminarArchivoDrive = async (fileId) => {
  const { drive } = await inicializarCuentaServicio();
  await drive.files.delete({ fileId, supportsAllDrives: true });
};

export const crearCalendarEvent = async ({ summary, description, startIso, endIso }) => {
  const { calendar } = await inicializarCuentaServicio();
  const calendarioId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarioId) {
    throw new Error('Falta GOOGLE_CALENDAR_ID en backend/.env');
  }

  const respuesta = await calendar.events.insert({
    calendarId: calendarioId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startIso, timeZone: 'America/Santiago' },
      end: { dateTime: endIso, timeZone: 'America/Santiago' },
    },
  });

  return respuesta.data;
};

export const eliminarEventoCalendar = async (calendarId, eventId) => {
  const { calendar } = await inicializarCuentaServicio();
  await calendar.events.delete({ calendarId, eventId });
};
