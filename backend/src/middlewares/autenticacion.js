import jwt from 'jsonwebtoken';
import { entorno } from '../config/entorno.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

export const requiereAutenticacion = (req, res, siguiente) => {
  const cabecera = req.headers.authorization ?? '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    siguiente(new ErrorHttp('Token de autenticación requerido', 401));
    return;
  }

  try {
    req.usuario = jwt.verify(token, entorno.jwt.secreto);
    siguiente();
  } catch {
    siguiente(new ErrorHttp('Sesión inválida o expirada, vuelve a iniciar sesión', 401));
  }
};

export const requiereRol =
  (...roles) =>
  (req, res, siguiente) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      siguiente(new ErrorHttp('No tienes permiso para realizar esta acción', 403));
      return;
    }
    siguiente();
  };
