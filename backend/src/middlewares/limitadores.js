import rateLimit from 'express-rate-limit';
import { entorno } from '../config/entorno.js';

const crearLimitador = ({ ventanaMs, limite, mensaje }) =>
  rateLimit({
    windowMs: ventanaMs,
    limit: limite,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { ok: false, mensaje },
  });

export const limitadorLogin = crearLimitador({
  ventanaMs: 15 * 60 * 1000,
  limite: entorno.esProduccion ? 8 : 40,
  mensaje: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.',
});

export const limitadorPostulaciones = crearLimitador({
  ventanaMs: 60 * 60 * 1000,
  limite: entorno.esProduccion ? 15 : 60,
  mensaje: 'Se alcanzó el límite de postulaciones permitidas. Intenta más tarde.',
});

export const limitadorConsulta = crearLimitador({
  ventanaMs: 15 * 60 * 1000,
  limite: entorno.esProduccion ? 12 : 80,
  mensaje: 'Demasiadas consultas de estado. Intenta nuevamente en unos minutos.',
});
