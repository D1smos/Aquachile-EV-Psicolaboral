import crypto from 'node:crypto';
import { dbGoogleCredenciales } from '../../config/baseDatos.js';
import { entorno } from '../../config/entorno.js';
import { ErrorHttp } from '../../utils/ErrorHttp.js';
import { cifrarToken, descifrarToken } from './cifrado.js';

const URL_AUTORIZACION = 'https://accounts.google.com/o/oauth2/v2/auth';
const URL_TOKEN = 'https://oauth2.googleapis.com/token';
const ALCANCES = ['https://www.googleapis.com/auth/calendar.events'];

const configurado = () =>
  Boolean(entorno.google.clientId && entorno.google.clientSecret && entorno.google.redirectUri);

const exigirConfiguracion = () => {
  if (!entorno.google.habilitado) {
    throw new ErrorHttp('Google Calendar no está habilitado', 503, [
      { codigo: 'GOOGLE_NO_HABILITADO', mensaje: 'Configura GOOGLE_HABILITADO=true' },
    ]);
  }
  if (!configurado()) {
    throw new ErrorHttp('Google Calendar no está configurado', 503, [
      {
        codigo: 'GOOGLE_NO_CONFIGURADO',
        mensaje: 'Configura GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI',
      },
    ]);
  }
};

const secretoEstado = () => entorno.google.oauthStateSecret || entorno.jwt.secreto;

export const crearEstadoOAuth = (usuarioEmail) => {
  const payload = Buffer.from(
    JSON.stringify({
      email: String(usuarioEmail).trim().toLowerCase(),
      exp: Date.now() + 10 * 60 * 1000,
      nonce: crypto.randomUUID(),
    }),
  ).toString('base64url');
  const firma = crypto.createHmac('sha256', secretoEstado()).update(payload).digest('base64url');
  return `${payload}.${firma}`;
};

export const verificarEstadoOAuth = (estado) => {
  const [payload, firma] = String(estado ?? '').split('.');
  if (!payload || !firma) {
    throw new ErrorHttp('Estado OAuth inválido', 400);
  }
  const esperada = crypto.createHmac('sha256', secretoEstado()).update(payload).digest('base64url');
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new ErrorHttp('Estado OAuth inválido', 400);
  }
  const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!datos?.email || Number(datos.exp) < Date.now()) {
    throw new ErrorHttp('Estado OAuth expirado', 400);
  }
  return datos.email;
};

export const construirUrlAutorizacion = (usuarioEmail) => {
  exigirConfiguracion();
  const parametros = new URLSearchParams({
    client_id: entorno.google.clientId,
    redirect_uri: entorno.google.redirectUri,
    response_type: 'code',
    scope: ALCANCES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: crearEstadoOAuth(usuarioEmail),
  });
  return `${URL_AUTORIZACION}?${parametros.toString()}`;
};

const solicitarToken = async (parametros, fetchImpl) => {
  let respuesta;
  try {
    respuesta = await fetchImpl(URL_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(parametros).toString(),
    });
  } catch {
    throw new ErrorHttp('No se pudo conectar con Google', 502);
  }
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  if (!respuesta.ok || !datos?.access_token) {
    throw new ErrorHttp(
      datos?.error_description ?? 'Google rechazó la solicitud de token',
      502,
      [{ codigo: 'GOOGLE_TOKEN_ERROR', mensaje: datos?.error ?? 'token_error' }],
    );
  }
  return datos;
};

export const intercambiarCodigoGoogle = async (codigo, { fetchImpl = globalThis.fetch } = {}) => {
  exigirConfiguracion();
  return solicitarToken(
    {
      code: String(codigo),
      client_id: entorno.google.clientId,
      client_secret: entorno.google.clientSecret,
      redirect_uri: entorno.google.redirectUri,
      grant_type: 'authorization_code',
    },
    fetchImpl,
  );
};

export const refrescarTokenGoogle = async (
  refreshToken,
  { fetchImpl = globalThis.fetch } = {},
) => {
  exigirConfiguracion();
  return solicitarToken(
    {
      refresh_token: String(refreshToken),
      client_id: entorno.google.clientId,
      client_secret: entorno.google.clientSecret,
      grant_type: 'refresh_token',
    },
    fetchImpl,
  );
};

export const guardarCredencialesGoogle = async (usuarioEmail, tokens) => {
  const email = String(usuarioEmail).trim().toLowerCase();
  let refreshToken = tokens?.refresh_token;
  if (!refreshToken) {
    const previa = await dbGoogleCredenciales.obtenerPorUsuario(email);
    if (previa?.refreshTokenCifrado) {
      refreshToken = descifrarToken(previa.refreshTokenCifrado);
    }
  }
  if (!refreshToken) {
    throw new ErrorHttp('Google no entregó un refresh token; vuelve a autorizar la cuenta', 400);
  }
  return dbGoogleCredenciales.guardar({
    usuarioEmail: email,
    refreshTokenCifrado: cifrarToken(refreshToken),
    scope: tokens?.scope ?? ALCANCES.join(' '),
    tokenType: tokens?.token_type ?? 'Bearer',
  });
};

export const intercambiarYGuardarGoogle = async (codigo, usuarioEmail, { fetchImpl } = {}) => {
  const tokens = await intercambiarCodigoGoogle(codigo, { fetchImpl });
  await guardarCredencialesGoogle(usuarioEmail, tokens);
  return tokens;
};

export const obtenerAccessTokenGoogle = async (
  usuarioEmail,
  { fetchImpl = globalThis.fetch } = {},
) => {
  if (!entorno.google.habilitado || !configurado()) {
    return null;
  }
  const credencial = await dbGoogleCredenciales.obtenerPorUsuario(usuarioEmail);
  if (!credencial?.refreshTokenCifrado) {
    return null;
  }
  const refreshToken = descifrarToken(credencial.refreshTokenCifrado);
  const tokens = await refrescarTokenGoogle(refreshToken, { fetchImpl });
  return tokens.access_token;
};

export const estadoGoogle = async (usuarioEmail) => {
  const credencial = await dbGoogleCredenciales.obtenerPorUsuario(usuarioEmail);
  return {
    habilitado: entorno.google.habilitado,
    configurado: configurado(),
    conectado: Boolean(credencial),
    calendarId: entorno.google.calendarId,
    timezone: entorno.google.timezone,
    actualizadoEn: credencial?.actualizadoEn ?? null,
  };
};

export const desconectarGoogle = async (usuarioEmail) =>
  dbGoogleCredenciales.eliminar(usuarioEmail);
