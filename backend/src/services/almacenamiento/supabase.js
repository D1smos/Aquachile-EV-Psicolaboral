import { createClient } from '@supabase/supabase-js';
import { entorno } from '../../config/entorno.js';
import { ErrorHttp } from '../../utils/ErrorHttp.js';

export const proveedor = 'supabase';

export const bucket = entorno.almacenamiento.bucket;

let cliente = null;

const obtenerCliente = () => {
  const { url, serviceRoleKey } = entorno.almacenamiento.supabase;
  if (!url || !serviceRoleKey) {
    throw new ErrorHttp(
      'Supabase Storage no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en backend/.env.',
      500,
    );
  }
  if (!cliente) {
    cliente = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
};

const normalizar = (key) => String(key ?? '').replace(/\\/g, '/').replace(/^\/+/, '');

const exigirBucket = () => {
  if (!bucket) {
    throw new ErrorHttp('Define SUPABASE_BUCKET en backend/.env.', 500);
  }
  return bucket;
};

export const guardar = async ({ key, buffer, mimetype }) => {
  const destino = normalizar(key);
  const { error } = await obtenerCliente()
    .storage.from(exigirBucket())
    .upload(destino, buffer, { contentType: mimetype, upsert: true });
  if (error) {
    throw new ErrorHttp(`No se pudo subir el archivo a Supabase Storage: ${error.message}`, 502);
  }
  return { key: destino, proveedor, bucket: exigirBucket() };
};

export const urlFirmada = async (key, { descarga = false, nombre } = {}) => {
  const destino = normalizar(key);
  const opciones = descarga ? { download: nombre || true } : undefined;
  const { data, error } = await obtenerCliente()
    .storage.from(exigirBucket())
    .createSignedUrl(destino, entorno.almacenamiento.ttl, opciones);
  if (error) {
    throw new ErrorHttp(`No se pudo firmar la URL del archivo: ${error.message}`, 502);
  }
  return data.signedUrl;
};

export const eliminar = async (key) => {
  const destino = normalizar(key);
  const { error } = await obtenerCliente().storage.from(exigirBucket()).remove([destino]);
  if (error) {
    throw new ErrorHttp(`No se pudo eliminar el archivo de Supabase Storage: ${error.message}`, 502);
  }
};

export const leer = async (key) => {
  const { data, error } = await obtenerCliente()
    .storage.from(exigirBucket())
    .download(normalizar(key));
  if (error) {
    throw new ErrorHttp(`No se pudo leer el archivo de Supabase Storage: ${error.message}`, 502);
  }
  return Buffer.from(await data.arrayBuffer());
};

export const existe = async (key) => {
  const destino = normalizar(key);
  const partes = destino.split('/');
  const nombre = partes.pop();
  const carpeta = partes.join('/');
  const { data, error } = await obtenerCliente()
    .storage.from(exigirBucket())
    .list(carpeta, { search: nombre, limit: 100 });
  if (error) {
    return false;
  }
  return (data ?? []).some((elemento) => elemento.name === nombre);
};
