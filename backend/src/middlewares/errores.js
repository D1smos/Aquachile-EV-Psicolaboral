import multer from 'multer';
import { logger } from '../utils/logger.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

const ERRORES_MULTER = {
  LIMIT_FILE_SIZE: { codigo: 413, mensaje: 'El archivo supera el tamaño máximo permitido' },
  LIMIT_FILE_COUNT: { codigo: 400, mensaje: 'Se superó la cantidad máxima de archivos adjuntos' },
  LIMIT_UNEXPECTED_FILE: { codigo: 400, mensaje: 'Se recibió un archivo en un campo no permitido' },
};

export const manejarNoEncontrado = (req, _res, siguiente) => {
  siguiente(new ErrorHttp(`Ruta ${req.method} ${req.originalUrl} no encontrada`, 404));
};

export const manejarError = (error, req, res, siguiente) => {
  if (res.headersSent) {
    siguiente(error);
    return;
  }

  let codigo = Number(error.codigo ?? error.status ?? 500);
  let mensaje = error.message || 'Error interno del servidor';
  const detalle = error.detalle;

  if (error instanceof multer.MulterError) {
    const gestionado = ERRORES_MULTER[error.code];
    codigo = gestionado?.codigo ?? 400;
    mensaje = gestionado?.mensaje ?? 'Error al procesar los archivos adjuntos';
  } else if (error.type === 'entity.parse.failed') {
    codigo = 400;
    mensaje = 'El cuerpo JSON recibido no es válido';
  }

  if (codigo >= 500) {
    logger.error('Error no controlado en la API', {
      ruta: `${req.method} ${req.originalUrl}`,
      mensaje: error.message,
      pila: error.stack,
    });
    codigo = 500;
    mensaje = 'Error interno del servidor';
  } else {
    logger.warn('Solicitud rechazada', {
      ruta: `${req.method} ${req.originalUrl}`,
      codigo,
      mensaje,
    });
  }

  res.status(codigo).json({ ok: false, mensaje, ...(detalle ? { detalle } : {}) });
};
