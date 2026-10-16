import path from 'node:path';
import crypto from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { dbArchivos, dbCandidatos, dbHistorial } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { ESTADOS_PROCESO, TIPOS_ARCHIVO } from '../domain/constantes.js';
import { ErrorHttp, noEncontrado } from '../utils/ErrorHttp.js';

const nuevoArchivo = (tipo, archivo) => ({
  id: crypto.randomUUID(),
  tipo,
  nombreOriginal: archivo.originalname,
  nombreAlmacenado: archivo.filename,
  ruta: path.relative(entorno.directorios.uploads, archivo.path),
  mimetype: archivo.mimetype,
  tamano: archivo.size,
  creadoEn: new Date().toISOString(),
});

const generarFolio = () => {
  const anio = new Date().getFullYear();
  return `AQ-${anio}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

export const crearPostulacion = async (datos, archivos, responsable = 'postulación pública') => {
  const rut = String(datos.rut).trim();
  const correo = String(datos.correo).trim().toLowerCase();
  const porRut = await dbCandidatos.buscarPorRut(rut);
  if (porRut) {
    throw new ErrorHttp(`Ya existe un candidato con el RUT ${rut} (folio ${porRut.folio})`, 409);
  }
  const porCorreo = await dbCandidatos.buscarPorEmail(correo);
  if (porCorreo) {
    throw new ErrorHttp(`Ya existe un candidato con el correo ${correo} (folio ${porCorreo.folio})`, 409);
  }
  const ahora = new Date().toISOString();
  const antecedentes = (archivos?.antecedentes ?? []).map((archivo) =>
    nuevoArchivo(TIPOS_ARCHIVO.ANTECEDENTES, archivo),
  );
  const cv = archivos?.cv?.[0];
  const listaArchivos = cv ? [nuevoArchivo(TIPOS_ARCHIVO.CV, cv), ...antecedentes] : antecedentes;

  const candidato = {
    id: crypto.randomUUID(),
    folio: generarFolio(),
    nombre: String(datos.nombre).trim(),
    rut: String(datos.rut).trim(),
    correo: String(datos.correo).trim().toLowerCase(),
    telefono: String(datos.telefono).trim(),
    familiaCargo: String(datos.familiaCargo).trim(),
    cargo: String(datos.cargo).trim(),
    formacion: String(datos.formacion).trim(),
    disponibilidad: String(datos.disponibilidad).trim(),
    aniosExperiencia: Number(datos.aniosExperiencia),
    motivacion: String(datos.motivacion ?? '').trim(),
    estado: ESTADOS_PROCESO.PENDIENTE,
    respuestas: null,
    puntaje: null,
    dimensiones: [],
    idoneidad: null,
    observaciones: null,
    evaluadoPor: null,
    fechaEvaluacion: null,
    archivos: listaArchivos,
    fechaPostulacion: ahora,
    fechaActualizacion: ahora,
  };

  const creado = await dbCandidatos.insertar(candidato);
  for (const archivo of listaArchivos) {
    await dbArchivos.insertar(creado.id, archivo);
  }
  const completo = await dbCandidatos.obtenerPorId(creado.id);
  await dbHistorial.registrar({
    candidatoId: completo.id,
    etapaAnterior: null,
    etapaNueva: completo.estado,
    responsable,
    motivo: 'Postulación registrada',
  });
  return completo;
};

export const listarCandidatos = async () => dbCandidatos.listarTodos();

export const obtenerCandidato = async (id) => {
  const candidato = await dbCandidatos.obtenerPorId(id);
  if (!candidato) {
    throw noEncontrado('Candidato');
  }
  return candidato;
};

export const cambiarEstado = async (id, estado, responsable = null, motivo = 'Cambio de estado manual') => {
  const actual = await obtenerCandidato(id);
  const actualizado = await dbCandidatos.actualizar(id, {
    estado,
    fechaActualizacion: new Date().toISOString(),
  });
  if (!actualizado) {
    throw noEncontrado('Candidato');
  }
  if (actual.estado !== estado) {
    await dbHistorial.registrar({
      candidatoId: id,
      etapaAnterior: actual.estado,
      etapaNueva: estado,
      responsable,
      motivo,
    });
  }
  return actualizado;
};

export const registrarEvaluacion = async (id, datos) => {
  const ahora = new Date().toISOString();
  const actual = await obtenerCandidato(id);
  const actualizado = await dbCandidatos.actualizar(id, {
    estado: datos.estado,
    respuestas: datos.respuestas,
    puntaje: datos.puntaje,
    dimensiones: datos.dimensiones,
    idoneidad: datos.idoneidad,
    observaciones: datos.observaciones,
    evaluadoPor: datos.evaluadoPor,
    fechaEvaluacion: ahora,
    fechaActualizacion: ahora,
  });
  if (!actualizado) {
    throw noEncontrado('Candidato');
  }
  await dbHistorial.registrar({
    candidatoId: id,
    etapaAnterior: actual.estado,
    etapaNueva: actualizado.estado,
    responsable: datos.evaluadoPor ?? null,
    motivo: 'Evaluación registrada',
  });
  return actualizado;
};

export const guardarAsistencia = async (id, asistencia) => {
  const actualizado = await dbCandidatos.actualizar(id, {
    resumenIA: asistencia.resumen,
    afinidadIA: asistencia.afinidad,
    borradorIA: asistencia.borrador,
    fechaAsistencia: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
  });
  if (!actualizado) {
    throw noEncontrado('Candidato');
  }
  return actualizado;
};

export const obtenerHistorial = async (id) => {
  await obtenerCandidato(id);
  return dbHistorial.listarPorCandidato(id);
};

export const localizarArchivo = (candidato, archivoId) => {
  const archivo = candidato.archivos.find((elemento) => elemento.id === archivoId);
  if (!archivo) {
    throw noEncontrado('Archivo');
  }
  const rutaAbsoluta = path.resolve(entorno.directorios.uploads, archivo.ruta);
  const raizUploads = `${entorno.directorios.uploads}${path.sep}`;
  if (!rutaAbsoluta.startsWith(raizUploads)) {
    throw new ErrorHttp('Ruta de archivo inválida', 400);
  }
  return { archivo, rutaAbsoluta };
};

export const editarCandidato = async (id, datos, responsable = null) => {
  const actual = await obtenerCandidato(id);
  const rut = String(datos.rut).trim();
  const correo = String(datos.correo).trim().toLowerCase();
  const porRut = await dbCandidatos.buscarPorRut(rut);
  if (porRut && porRut.id !== id) {
    throw new ErrorHttp(`Ya existe otro candidato con el RUT ${rut} (folio ${porRut.folio})`, 409);
  }
  const porCorreo = await dbCandidatos.buscarPorEmail(correo);
  if (porCorreo && porCorreo.id !== id) {
    throw new ErrorHttp(`Ya existe otro candidato con el correo ${correo} (folio ${porCorreo.folio})`, 409);
  }
  const cambios = {
    nombre: String(datos.nombre).trim(),
    rut: String(datos.rut).trim(),
    correo: String(datos.correo).trim().toLowerCase(),
    telefono: String(datos.telefono).trim(),
    familiaCargo: String(datos.familiaCargo).trim(),
    cargo: String(datos.cargo).trim(),
    formacion: String(datos.formacion).trim(),
    disponibilidad: String(datos.disponibilidad).trim(),
    aniosExperiencia: Number(datos.aniosExperiencia),
    motivacion: String(datos.motivacion ?? '').trim(),
    fechaActualizacion: new Date().toISOString(),
  };
  const actualizado = await dbCandidatos.actualizar(id, cambios);
  if (!actualizado) {
    throw noEncontrado('Candidato');
  }
  await dbHistorial.registrar({
    candidatoId: id,
    etapaAnterior: actual.estado,
    etapaNueva: actual.estado,
    responsable,
    motivo: 'Ficha del candidato actualizada',
  });
  return actualizado;
};

export const eliminarCandidato = async (id) => {
  const candidato = await obtenerCandidato(id);
  for (const archivo of candidato.archivos) {
    try {
      await unlink(path.resolve(entorno.directorios.uploads, archivo.ruta));
    } catch {
      continue;
    }
  }
  const eliminado = await dbCandidatos.eliminar(id);
  if (!eliminado) {
    throw noEncontrado('Candidato');
  }
  return candidato;
};

export const resumenPublico = (candidato) => ({
  id: candidato.id,
  folio: candidato.folio,
  nombre: candidato.nombre,
  cargo: candidato.cargo,
  familiaCargo: candidato.familiaCargo,
  estado: candidato.estado,
  fechaPostulacion: candidato.fechaPostulacion,
});
