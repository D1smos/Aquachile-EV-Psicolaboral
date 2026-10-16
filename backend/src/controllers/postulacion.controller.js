import { ErrorHttp } from '../utils/ErrorHttp.js';
import { envolver } from '../utils/envolver.js';
import { descartarArchivos } from '../utils/archivos.js';
import { crearPostulacion, resumenPublico } from '../services/candidato.service.js';
import { validarPostulacion } from '../validators/postulacion.validator.js';

export const crearPostulacionController = envolver(async (req, res) => {
  const errores = validarPostulacion(req.body ?? {});
  const cv = req.files?.cv;

  if (!cv || cv.length === 0) {
    errores.push({ campo: 'cv', mensaje: 'Adjunta tu CV en formato PDF, DOC o DOCX' });
  }

  if (errores.length > 0) {
    await descartarArchivos(req.files);
    throw new ErrorHttp('Revisa los campos del formulario', 400, errores);
  }

  const candidato = await crearPostulacion(req.body, req.files);
  res.status(201).json({
    ok: true,
    mensaje: 'Postulación registrada correctamente',
    candidato: resumenPublico(candidato),
  });
});
