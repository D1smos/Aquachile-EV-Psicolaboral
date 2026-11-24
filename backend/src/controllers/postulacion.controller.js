import { ErrorHttp } from '../utils/ErrorHttp.js';
import { envolver } from '../utils/envolver.js';
import { descartarArchivos } from '../utils/archivos.js';
import { esRutValido } from '../utils/validadores.js';
import {
  consultarPostulacionPublica,
  crearPostulacion,
  resumenPublico,
} from '../services/candidato.service.js';
import { enviarCorreoConfirmacion } from '../services/correo.service.js';
import { validarPostulacion } from '../validators/postulacion.validator.js';

const FOLIO_REGEX = /^AQ-\d{4}-[A-F0-9]{8}$/;

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
  void enviarCorreoConfirmacion(candidato);
});

export const consultarPostulacionController = envolver(async (req, res) => {
  const folio = String(req.body?.folio ?? '').trim().toUpperCase();
  const rut = String(req.body?.rut ?? '').trim();
  const errores = [];

  if (!FOLIO_REGEX.test(folio)) {
    errores.push({ campo: 'folio', mensaje: 'Ingresa un folio válido, por ejemplo AQ-2026-ABC12345' });
  }
  if (!esRutValido(rut)) {
    errores.push({ campo: 'rut', mensaje: 'Ingresa un RUT válido, por ejemplo 12.345.678-5' });
  }

  if (errores.length > 0) {
    throw new ErrorHttp('Revisa los datos de la consulta', 400, errores);
  }

  const candidato = await consultarPostulacionPublica(folio, rut);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, candidato });
});
