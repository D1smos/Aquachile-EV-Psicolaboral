import { ErrorHttp } from '../utils/ErrorHttp.js';
import { envolver } from '../utils/envolver.js';
import { validarRevision, validarSolicitudAnalisis } from '../validators/analisis.validator.js';
import {
  generarAnalisis,
  obtenerAnalisisCandidato,
  revisarAnalisis,
} from '../services/ia/analisis.service.js';

const lanzarErrores = (errores, mensaje) => {
  if (errores.length > 0) {
    throw new ErrorHttp(mensaje, 400, errores);
  }
};

export const analizar = envolver(async (req, res) => {
  const errores = validarSolicitudAnalisis(req.body ?? {});
  lanzarErrores(errores, 'Revisa los datos del análisis');

  const resultado = await generarAnalisis(req.params.id, {
    archivoId: req.body?.archivoId ?? null,
    cargo: req.body?.cargo ?? null,
    forzar: req.body?.forzar === true,
    generadoPor: req.usuario.email,
  });
  res.status(resultado.cacheHit ? 200 : 201).json({
    ok: true,
    mensaje: resultado.cacheHit
      ? 'Análisis recuperado desde la caché'
      : 'Análisis generado y guardado como borrador',
    cacheHit: resultado.cacheHit,
    analisis: resultado.analisis,
  });
});

export const listar = envolver(async (req, res) => {
  const { ultimo, historial } = await obtenerAnalisisCandidato(req.params.id);
  res.json({ ok: true, ultimo, historial });
});

export const revisar = envolver(async (req, res) => {
  const errores = validarRevision(req.body ?? {});
  lanzarErrores(errores, 'Revisa la revisión del análisis');

  const analisisId = req.params.analisisId ?? req.params.id;
  const { analisis, comentario } = await revisarAnalisis(analisisId, {
    estado: req.body.estado,
    revisadoPor: req.usuario.email,
    comentario: req.body.comentario ?? null,
  });
  res.json({
    ok: true,
    mensaje: `Análisis marcado como "${analisis.estado}"`,
    analisis,
    comentario,
  });
});
