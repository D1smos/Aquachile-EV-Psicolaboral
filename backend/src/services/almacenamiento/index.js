import { entorno } from '../../config/entorno.js';

const modulo =
  entorno.almacenamiento.proveedor === 'supabase'
    ? await import('./supabase.js')
    : await import('./local.js');

export const almacenamiento = Object.freeze({
  proveedor: modulo.proveedor,
  bucket: modulo.bucket ?? null,
  guardar: modulo.guardar,
  urlFirmada: modulo.urlFirmada,
  eliminar: modulo.eliminar,
  existe: modulo.existe,
  ...(modulo.leer ? { leer: modulo.leer } : {}),
  ...(modulo.rutaAbsoluta ? { rutaAbsoluta: modulo.rutaAbsoluta } : {}),
});

export const usaSupabase = almacenamiento.proveedor === 'supabase';
