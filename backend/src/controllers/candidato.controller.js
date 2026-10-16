import path from 'node:path';
import { stat } from 'node:fs/promises';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { envolver } from '../utils/envolver.js';
import { descartarArchivos } from '../utils/archivos.js';
import {
  cambiarEstado,
  crearPostulacion,
  editarCandidato,
  eliminarCandidato,
  guardarAsistencia,
  listarCandidatos,
  localizarArchivo,
  obtenerCandidato,
  obtenerHistorial,
  registrarEvaluacion,
} from '../services/candidato.service.js';
import { validarPostulacion } from '../validators/postulacion.validator.js';
import { estadoPorIdoneidad, evaluarRespuestas } from '../services/evaluacion.service.js';
import { generarAsistencia, compararPorCargo } from '../services/asistente.service.js';
import { generarCsv, generarInformePdf, filtrarParaExportar } from '../services/exportacion.service.js';
import { validarEstado, validarEvaluacion } from '../validators/evaluacion.validator.js';

const lanzarErrores = (errores, mensaje) => {
  if (errores.length > 0) {
    throw new ErrorHttp(mensaje, 400, errores);
  }
};

const cabeceraContenido = (nombreOriginal) => {
  const ascii = nombreOriginal.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombreOriginal)}`;
};

export const listar = envolver(async (req, res) => {
  const candidatos = await listarCandidatos();
  res.json({ ok: true, total: candidatos.length, candidatos });
});

export const crearManual = envolver(async (req, res) => {
  const errores = validarPostulacion(req.body ?? {});
  if (errores.length > 0) {
    await descartarArchivos(req.files);
    throw new ErrorHttp('Revisa los datos del candidato', 400, errores);
  }

  const candidato = await crearPostulacion(req.body, req.files, req.usuario.email);
  res.status(201).json({
    ok: true,
    mensaje: `Candidato ${candidato.nombre} registrado con folio ${candidato.folio}`,
    candidato,
  });
});

export const actualizar = envolver(async (req, res) => {
  const errores = validarPostulacion(req.body ?? {});
  lanzarErrores(errores, 'Revisa los datos del candidato');

  const candidato = await editarCandidato(req.params.id, req.body, req.usuario.email);
  res.json({ ok: true, mensaje: 'Ficha del candidato actualizada', candidato });
});

export const eliminar = envolver(async (req, res) => {
  const candidato = await eliminarCandidato(req.params.id);
  res.json({ ok: true, mensaje: `Candidato ${candidato.nombre} eliminado`, id: candidato.id });
});

export const obtener = envolver(async (req, res) => {
  const candidato = await obtenerCandidato(req.params.id);
  res.json({ ok: true, candidato });
});

export const actualizarEstado = envolver(async (req, res) => {
  const errores = validarEstado(req.body?.estado);
  lanzarErrores(errores, 'Estado de proceso no válido');

  const candidato = await cambiarEstado(
    req.params.id,
    req.body.estado,
    req.usuario.email,
    String(req.body.motivo ?? '').trim() || 'Cambio de estado manual',
  );
  res.json({ ok: true, mensaje: `Estado actualizado a "${candidato.estado}"`, candidato });
});

export const evaluar = envolver(async (req, res) => {
  const errores = validarEvaluacion(req.body ?? {});
  lanzarErrores(errores, 'Revisa las respuestas de la evaluación');

  const candidato = await obtenerCandidato(req.params.id);
  const resultado = evaluarRespuestas(req.body.respuestas);
  const estado = req.body.estado ?? estadoPorIdoneidad(resultado.idoneidad);

  const actualizado = await registrarEvaluacion(candidato.id, {
    ...resultado,
    respuestas: req.body.respuestas,
    observaciones: String(req.body.observaciones ?? '').trim() || null,
    evaluadoPor: req.usuario.email,
    estado,
  });

  res.json({
    ok: true,
    mensaje: 'Evaluación registrada correctamente',
    candidato: actualizado,
  });
});

export const asistir = envolver(async (req, res) => {
  const asistencia = await generarAsistencia(req.params.id);
  const candidato = await guardarAsistencia(req.params.id, asistencia);
  res.json({
    ok: true,
    mensaje: 'Asistencia generada a partir del perfil y los documentos',
    asistencia,
    candidato,
  });
});

export const exportarCsv = envolver(async (req, res) => {
  const candidatos = await listarCandidatos();
  const filtrados = filtrarParaExportar(candidatos, req.query ?? {});
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="candidatos.csv"');
  res.send(generarCsv(filtrados));
});

export const informePdf = envolver(async (req, res) => {
  const candidato = await obtenerCandidato(req.params.id);
  const documento = await generarInformePdf(candidato.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ficha-${candidato.folio}.pdf"`);
  res.send(documento);
});

export const comparar = envolver(async (req, res) => {
  const cargo = String(req.query.cargo ?? '').trim();
  if (!cargo) {
    throw new ErrorHttp('Indica el cargo a comparar', 400, [
      { campo: 'cargo', mensaje: 'Indica el cargo a comparar' },
    ]);
  }
  const resultado = await compararPorCargo(cargo, String(req.query.candidatoId ?? '') || null);
  res.json({ ok: true, ...resultado });
});

export const historial = envolver(async (req, res) => {
  const eventos = await obtenerHistorial(req.params.id);
  res.json({ ok: true, total: eventos.length, historial: eventos });
});

export const descargarArchivo = envolver(async (req, res, next) => {
  const candidato = await obtenerCandidato(req.params.id);
  const { archivo, rutaAbsoluta } = localizarArchivo(candidato, req.params.archivoId);

  const informacion = await stat(rutaAbsoluta).catch(() => null);
  if (!informacion?.isFile()) {
    throw new ErrorHttp('El archivo ya no está disponible', 404);
  }

  res.setHeader('Content-Disposition', cabeceraContenido(archivo.nombreOriginal));
  res.sendFile(path.resolve(rutaAbsoluta), { cacheControl: true, maxAge: '5m' }, (error) => {
    if (error && !res.headersSent) {
      next(error);
    }
  });
});
