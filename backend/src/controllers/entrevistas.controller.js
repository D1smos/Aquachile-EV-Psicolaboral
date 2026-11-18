import { envolver } from '../utils/envolver.js';
import { ErrorHttp, noEncontrado } from '../utils/ErrorHttp.js';
import { validarEntrevista } from '../validators/entrevista.validator.js';
import {
  actualizarEntrevista,
  crearEntrevista,
  eliminarEntrevista,
  listarEntrevistas,
  obtenerEntrevista,
  sincronizarEntrevista,
} from '../services/entrevista.service.js';

const lanzarErrores = (errores) => {
  if (errores.length > 0) {
    throw new ErrorHttp('Revisa los datos de la entrevista', 400, errores);
  }
};

export const listar = envolver(async (req, res) => {
  const entrevistas = await listarEntrevistas({
    desde: req.query?.desde ?? null,
    hasta: req.query?.hasta ?? null,
    candidatoId: req.query?.candidatoId ?? null,
  });
  res.json({ ok: true, total: entrevistas.length, entrevistas });
});

export const obtener = envolver(async (req, res) => {
  const entrevista = await obtenerEntrevista(req.params.id);
  if (!entrevista) {
    throw noEncontrado('Entrevista');
  }
  res.json({ ok: true, entrevista });
});

export const crear = envolver(async (req, res) => {
  lanzarErrores(validarEntrevista(req.body ?? {}));
  const resultado = await crearEntrevista(req.body, { usuarioEmail: req.usuario.email });
  res.status(201).json({
    ok: true,
    mensaje: resultado.sincronizada
      ? 'Entrevista agendada y sincronizada con Google Calendar'
      : 'Entrevista agendada',
    entrevista: resultado.entrevista,
    sincronizada: resultado.sincronizada,
    motivo: resultado.motivo ?? null,
  });
});

export const actualizar = envolver(async (req, res) => {
  lanzarErrores(validarEntrevista(req.body ?? {}, { parcial: true }));
  const resultado = await actualizarEntrevista(req.params.id, req.body ?? {}, {
    usuarioEmail: req.usuario.email,
  });
  res.json({
    ok: true,
    mensaje: 'Entrevista actualizada',
    entrevista: resultado.entrevista,
    sincronizada: resultado.sincronizada,
    motivo: resultado.motivo ?? null,
  });
});

export const sincronizar = envolver(async (req, res) => {
  const resultado = await sincronizarEntrevista(req.params.id, {
    usuarioEmail: req.usuario.email,
  });
  res.json({
    ok: true,
    mensaje: resultado.sincronizada
      ? 'Entrevista sincronizada con Google Calendar'
      : 'La entrevista se mantiene guardada localmente',
    entrevista: resultado.entrevista,
    sincronizada: resultado.sincronizada,
    motivo: resultado.motivo ?? null,
  });
});

export const eliminar = envolver(async (req, res) => {
  const resultado = await eliminarEntrevista(req.params.id, { usuarioEmail: req.usuario.email });
  res.json({ ok: true, mensaje: 'Entrevista eliminada', id: resultado.id });
});
