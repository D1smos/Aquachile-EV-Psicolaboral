import path from 'node:path';
import crypto from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { dbArchivos, dbCandidatos, dbHistorial } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { almacenamiento } from './almacenamiento/index.js';
import { ESTADOS_PROCESO, TIPOS_ARCHIVO } from '../domain/constantes.js';
import { ErrorHttp, noEncontrado } from '../utils/ErrorHttp.js';
import { normalizarRut } from '../utils/validadores.js';

const MENSAJE_DUPLICADO =
  'Ya existe una postulación con esos datos. Revisa la ficha existente o contacta a Reclutamiento.';

const MIME_POR_EXTENSION = Object.freeze({
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

const MIME_FIRMA_ESPERADA = Object.freeze({
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
});

const validarFirma = async (buffer, extension) => {
  if (extension === '.doc') {
    return;
  }
  const detectado = await fileTypeFromBuffer(buffer);
  const esperados = MIME_FIRMA_ESPERADA[extension] ?? [];
  if (!detectado || !esperados.includes(detectado.mime)) {
    throw new ErrorHttp('El contenido del archivo no coincide con su extensión', 400);
  }
};

const extensionDe = (archivo) =>
  path.extname(archivo.originalname || archivo.filename || archivo.path || '').toLowerCase();

const limpiarSubidos = async (claves) => {
  for (const clave of claves) {
    try {
      await almacenamiento.eliminar(clave);
    } catch {
      // La limpieza no debe ocultar el error original.
    }
  }
};

const limpiarTemporales = async (archivos) => {
  for (const archivo of archivos) {
    try {
      await unlink(archivo.path);
    } catch {
      // El archivo temporal pudo haber sido eliminado antes.
    }
  }
};

const prepararArchivo = async (tipo, archivo, candidatoId, subidos) => {
  const buffer = await readFile(archivo.path);
  const extension = extensionDe(archivo);
  await validarFirma(buffer, extension);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const mimetype = archivo.mimetype || MIME_POR_EXTENSION[extension] || 'application/octet-stream';

  const existente = await dbArchivos.buscarPorHash(hash);
  const reutilizable =
    existente?.storageKey &&
    existente.proveedor === almacenamiento.proveedor &&
    (existente.bucket ?? null) === (almacenamiento.bucket ?? null);

  let ubicacion;
  if (reutilizable) {
    ubicacion = {
      key: existente.storageKey,
      proveedor: existente.proveedor,
      bucket: existente.bucket ?? null,
    };
  } else {
    const key = `documentos/${tipo}/${hash}${extension}`;
    ubicacion = await almacenamiento.guardar({ key, buffer, mimetype });
    subidos.push(ubicacion.key);
  }

  try {
    await unlink(archivo.path);
  } catch {
    // Si el staging ya no existe, continuar.
  }

  return {
    id: crypto.randomUUID(),
    tipo,
    nombreOriginal: archivo.originalname,
    nombreAlmacenado: path.basename(ubicacion.key),
    ruta: ubicacion.key,
    mimetype,
    tamano: buffer.length,
    storageKey: ubicacion.key,
    proveedor: ubicacion.proveedor,
    bucket: ubicacion.bucket,
    hash,
    creadoEn: new Date().toISOString(),
  };
};

const generarFolio = () => {
  const anio = new Date().getFullYear();
  return `AQ-${anio}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

export const crearPostulacion = async (datos, archivos, responsable = 'postulación pública') => {
  const rut = String(datos.rut).trim();
  const correo = String(datos.correo).trim().toLowerCase();
  const porRut = await dbCandidatos.buscarPorRut(rut);
  if (porRut) {
    throw new ErrorHttp(MENSAJE_DUPLICADO, 409);
  }
  const porCorreo = await dbCandidatos.buscarPorEmail(correo);
  if (porCorreo) {
    throw new ErrorHttp(MENSAJE_DUPLICADO, 409);
  }
  const ahora = new Date().toISOString();
  const aceptaPrivacidad =
    datos.aceptaPrivacidad === true ||
    datos.aceptaPrivacidad === 'true' ||
    datos.aceptaPrivacidad === 'on';

  const id = crypto.randomUUID();
  const subidos = [];
  const temporales = [...(archivos?.cv ?? []), ...(archivos?.antecedentes ?? [])];
  const listaArchivos = [];

  try {
    const cv = archivos?.cv?.[0];
    if (cv) {
      listaArchivos.push(await prepararArchivo(TIPOS_ARCHIVO.CV, cv, id, subidos));
    }
    for (const antecedente of archivos?.antecedentes ?? []) {
      listaArchivos.push(
        await prepararArchivo(TIPOS_ARCHIVO.ANTECEDENTES, antecedente, id, subidos),
      );
    }
  } catch (error) {
    await limpiarSubidos(subidos);
    await limpiarTemporales(temporales);
    throw error;
  }

  const candidato = {
    id,
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
    consentimiento: aceptaPrivacidad,
    fechaConsentimiento: aceptaPrivacidad ? ahora : null,
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

  let creado;
  try {
    creado = await dbCandidatos.insertar(candidato);
    for (const archivo of listaArchivos) {
      await dbArchivos.insertar(creado.id, archivo);
    }
  } catch (error) {
    await limpiarSubidos(subidos);
    throw error;
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
  return { archivo };
};

export const rutaLocalArchivo = (archivo) => {
  const clave = archivo.storageKey || archivo.ruta;
  if (!clave) {
    throw new ErrorHttp('El archivo no tiene una ubicación registrada', 500);
  }
  const rutaAbsoluta = path.resolve(entorno.directorios.uploads, String(clave).replace(/\\/g, '/'));
  const raizUploads = `${path.resolve(entorno.directorios.uploads)}${path.sep}`;
  if (!rutaAbsoluta.startsWith(raizUploads)) {
    throw new ErrorHttp('Ruta de archivo inválida', 400);
  }
  return rutaAbsoluta;
};

export const fichaCandidato = async (id) => {
  const candidato = await obtenerCandidato(id);
  const historial = await dbHistorial.listarPorCandidato(id);
  return { candidato, historial };
};

const normalizarTexto = (valor) =>
  String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const listarDocumentos = async ({
  q = '',
  tipo = '',
  candidatoId = '',
  desde = '',
  hasta = '',
  pagina = 1,
  porPagina = 20,
} = {}) => {
  const candidatos = await listarCandidatos();
  const termino = normalizarTexto(String(q).trim());
  const filas = [];

  for (const candidato of candidatos) {
    for (const archivo of candidato.archivos ?? []) {
      if (tipo && archivo.tipo !== tipo) {
        continue;
      }
      if (candidatoId && candidato.id !== candidatoId) {
        continue;
      }
      if (desde && String(archivo.creadoEn ?? '') < desde) {
        continue;
      }
      if (hasta && String(archivo.creadoEn ?? '') > `${hasta}T23:59:59.999Z`) {
        continue;
      }
      if (termino) {
        const texto = normalizarTexto(
          `${candidato.nombre} ${candidato.folio} ${archivo.nombreOriginal} ${archivo.tipo}`,
        );
        if (!texto.includes(termino)) {
          continue;
        }
      }
      filas.push({
        ...archivo,
        candidatoId: candidato.id,
        folio: candidato.folio,
        candidatoNombre: candidato.nombre,
        candidatoEstado: candidato.estado,
      });
    }
  }

  filas.sort((a, b) => String(b.creadoEn).localeCompare(String(a.creadoEn)));
  const total = filas.length;
  const tamanoPagina = Math.min(Math.max(Number(porPagina) || 20, 1), 100);
  const paginaActual = Math.max(Number(pagina) || 1, 1);
  const inicio = (paginaActual - 1) * tamanoPagina;

  return {
    total,
    pagina: paginaActual,
    porPagina: tamanoPagina,
    archivos: filas.slice(inicio, inicio + tamanoPagina),
  };
};

export const urlArchivo = async (candidatoId, archivoId, modo = 'preview') => {
  const candidato = await obtenerCandidato(candidatoId);
  const { archivo } = localizarArchivo(candidato, archivoId);
  if (almacenamiento.proveedor === 'supabase' && archivo.storageKey) {
    const url = await almacenamiento.urlFirmada(archivo.storageKey, {
      descarga: modo === 'download',
      nombre: archivo.nombreOriginal,
    });
    return { url, expiraEn: entorno.almacenamiento.ttl, local: false, archivo };
  }
  return { url: null, expiraEn: null, local: true, archivo };
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
      if (archivo.storageKey) {
        const referencias = await dbArchivos.contarPorStorageKey(archivo.storageKey);
        if (referencias <= 1) {
          await almacenamiento.eliminar(archivo.storageKey);
        }
      } else {
        await unlink(rutaLocalArchivo(archivo));
      }
    } catch {
      // No bloquear la eliminación por un archivo ya ausente.
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

export const resumenSeguimiento = (candidato) => ({
  folio: candidato.folio,
  nombre: candidato.nombre,
  cargo: candidato.cargo,
  familiaCargo: candidato.familiaCargo,
  estado: candidato.estado,
  fechaPostulacion: candidato.fechaPostulacion,
  fechaActualizacion: candidato.fechaActualizacion,
});

export const consultarPostulacionPublica = async (folio, rut) => {
  const candidato = await dbCandidatos.buscarPorFolio(folio);
  if (!candidato || normalizarRut(candidato.rut) !== normalizarRut(rut)) {
    throw new ErrorHttp('No encontramos una postulación con esos datos.', 404);
  }
  return resumenSeguimiento(candidato);
};
