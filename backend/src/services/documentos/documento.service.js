import path from 'node:path';
import crypto from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { dbArchivos, dbDocumentosTexto } from '../../config/baseDatos.js';
import { almacenamiento } from '../almacenamiento/index.js';
import { ErrorHttp, noEncontrado } from '../../utils/ErrorHttp.js';
import { extraerTexto } from './extraerTexto.js';
import { MIME_POR_EXTENSION, extensionDe } from './tipos.js';

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

export const limpiarSubidos = async (claves = []) => {
  for (const clave of claves) {
    try {
      await almacenamiento.eliminar(clave);
    } catch {
      continue;
    }
  }
};

const limpiarTemporal = async (archivo) => {
  if (!archivo?.path) {
    return;
  }
  try {
    await unlink(archivo.path);
  } catch {
    return;
  }
};

export const prepararArchivo = async (tipo, archivo, candidatoId, subidos = []) => {
  const buffer = archivo.buffer ?? (await readFile(archivo.path));
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

  await limpiarTemporal(archivo);

  return {
    buffer,
    archivo: {
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
    },
  };
};

export const procesarDocumento = async (archivo, buffer) => {
  const extraido = await extraerTexto({
    buffer,
    nombreOriginal: archivo.nombreOriginal,
    mimetype: archivo.mimetype,
  });
  return dbDocumentosTexto.guardar({ archivoId: archivo.id, ...extraido });
};

export const resumenDocumento = (documento) => {
  if (!documento) {
    return null;
  }
  const { texto, ...resto } = documento;
  return resto;
};

export const guardarDocumento = async ({ candidatoId, tipo, archivo }) => {
  const subidos = [];
  const preparado = await prepararArchivo(tipo, archivo, candidatoId, subidos);
  try {
    await dbArchivos.insertar(candidatoId, preparado.archivo);
    const documento = await procesarDocumento(preparado.archivo, preparado.buffer);
    return { archivo: preparado.archivo, documento };
  } catch (error) {
    await dbArchivos.eliminar(preparado.archivo.id).catch(() => undefined);
    await limpiarSubidos(subidos);
    throw error;
  }
};

const buscarArchivo = async (candidatoId, archivoId) => {
  const archivo = await dbArchivos.obtenerPorId(archivoId);
  if (!archivo || archivo.candidatoId !== String(candidatoId) || archivo.deletedAt) {
    throw noEncontrado('Archivo');
  }
  return archivo;
};

const leerBufferArchivo = async (archivo) => {
  const clave = archivo.storageKey || archivo.ruta;
  if (!clave) {
    throw new ErrorHttp('El archivo no tiene una ubicación registrada', 500);
  }
  return almacenamiento.leer(clave);
};

export const obtenerTextoDocumento = async (candidatoId, archivoId) => {
  const archivo = await buscarArchivo(candidatoId, archivoId);
  const documento = await dbDocumentosTexto.obtenerPorArchivo(archivo.id);
  if (!documento) {
    throw noEncontrado('Texto del documento');
  }
  return { archivo, documento };
};

export const reprocesarDocumento = async (candidatoId, archivoId) => {
  const archivo = await buscarArchivo(candidatoId, archivoId);
  const buffer = await leerBufferArchivo(archivo);
  const documento = await procesarDocumento(archivo, buffer);
  return { archivo, documento };
};

export const eliminarDocumento = async (candidatoId, archivoId) => {
  const archivo = await buscarArchivo(candidatoId, archivoId);
  const clave = archivo.storageKey || archivo.ruta;
  const referencias = clave ? await dbArchivos.contarPorStorageKey(clave) : 0;
  const eliminado = await dbArchivos.eliminar(archivo.id);
  if (!eliminado) {
    throw noEncontrado('Archivo');
  }
  if (clave && referencias <= 1) {
    try {
      await almacenamiento.eliminar(clave);
    } catch {
      return archivo;
    }
  }
  return archivo;
};
