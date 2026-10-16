import { entorno } from './entorno.js';

const modulo = entorno.db.url ? await import('./postgres.js') : await import('./sqlite.js');

export const { dbUsuarios, dbArchivos, dbCandidatos, dbHistorial } = modulo;

export const migrarJsonSiExiste = modulo.migrarJsonSiExiste ?? (async () => 0);

export const migrarLegado = modulo.migrarLegado ?? (async () => 0);

export const motorBaseDatos = entorno.db.url ? 'postgresql' : 'sqlite';
