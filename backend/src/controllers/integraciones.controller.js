import { entorno } from '../config/entorno.js';
import { envolver } from '../utils/envolver.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import {
  construirUrlAutorizacion,
  desconectarGoogle,
  estadoGoogle,
  intercambiarYGuardarGoogle,
  verificarEstadoOAuth,
} from '../services/google/oauth.js';

const redirigirAgenda = (res, estado) => {
  if (entorno.urlPublica) {
    res.redirect(`${entorno.urlPublica}/agenda?google=${estado}`);
    return true;
  }
  return false;
};

export const estado = envolver(async (req, res) => {
  res.json({ ok: true, ...(await estadoGoogle(req.usuario.email)) });
});

export const conectar = envolver(async (req, res) => {
  res.json({ ok: true, url: construirUrlAutorizacion(req.usuario.email) });
});

export const callback = envolver(async (req, res) => {
  const { code, state, error } = req.query ?? {};
  if (error) {
    throw new ErrorHttp('Google canceló la autorización', 400);
  }
  if (!code) {
    throw new ErrorHttp('Google no entregó el código de autorización', 400);
  }
  const usuarioEmail = verificarEstadoOAuth(state);
  await intercambiarYGuardarGoogle(String(code), usuarioEmail);
  if (!redirigirAgenda(res, 'conectado')) {
    res.json({ ok: true, mensaje: 'Google Calendar conectado', usuarioEmail });
  }
});

export const desconectar = envolver(async (req, res) => {
  await desconectarGoogle(req.usuario.email);
  res.json({ ok: true, mensaje: 'Google Calendar desconectado' });
});
