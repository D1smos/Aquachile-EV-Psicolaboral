import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { entorno } from '../../config/entorno.js';
import { ErrorHttp } from '../../utils/ErrorHttp.js';

export const proveedor = 'local';

export const bucket = null;

const normalizar = (key) => String(key ?? '').replace(/\\/g, '/').replace(/^\/+/, '');

const resolver = (key) => {
  const relativa = normalizar(key);
  const absoluta = path.resolve(entorno.directorios.uploads, relativa);
  const raiz = `${path.resolve(entorno.directorios.uploads)}${path.sep}`;
  if (!absoluta.startsWith(raiz)) {
    throw new ErrorHttp('Ruta de archivo inválida', 400);
  }
  return absoluta;
};

export const guardar = async ({ key, buffer }) => {
  const destino = resolver(key);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, buffer);
  return { key: normalizar(key), proveedor, bucket: null };
};

export const urlFirmada = async () => null;

export const eliminar = async (key) => {
  try {
    await unlink(resolver(key));
  } catch {
    // Si el archivo ya no existe, no es un error para el llamador.
  }
};

export const existe = async (key) => {
  try {
    const informacion = await stat(resolver(key));
    return informacion.isFile();
  } catch {
    return false;
  }
};

export const leer = async (key) => readFile(resolver(key));

export const rutaAbsoluta = (key) => resolver(key);
