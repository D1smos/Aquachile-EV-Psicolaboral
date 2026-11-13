import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { dbArchivos, dbCandidatos } from '../config/baseDatos.js';
import { entorno } from '../config/entorno.js';
import { almacenamiento } from '../services/almacenamiento/index.js';
import { logger } from '../utils/logger.js';

async function migrar() {
  logger.info(`Iniciando migración de archivos (Proveedor: ${almacenamiento.proveedor})`);

  const candidatos = await dbCandidatos.listarTodos();
  let procesados = 0;
  let subidos = 0;
  let errores = 0;
  let huérfanos = 0;

  for (const candidato of candidatos) {
    const archivos = await dbArchivos.listarPorCandidato(candidato.id, {
      incluirEliminados: true,
    });

    for (const archivo of archivos) {
      if (archivo.deletedAt || (archivo.hash && archivo.storageKey)) {
        continue;
      }

      procesados++;
      const rutaLocal = path.resolve(entorno.directorios.uploads, archivo.ruta);

      try {
        const buffer = await readFile(rutaLocal);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const extension = path
          .extname(archivo.nombreOriginal || archivo.ruta)
          .toLowerCase();
        const keyHash = `documentos/${archivo.tipo}/${hash}${extension}`;

        logger.info(
          `Procesando [${archivo.tipo}] ${archivo.nombreOriginal} (Candidato: ${candidato.folio})`,
        );

        let storageKey = String(archivo.ruta).replace(/\\/g, '/');

        if (almacenamiento.proveedor === 'supabase') {
          storageKey = keyHash;
          const existe = await almacenamiento.existe(storageKey);
          if (!existe) {
            await almacenamiento.guardar({
              key: storageKey,
              buffer,
              mimetype: archivo.mimetype,
            });
            subidos++;
          }
        }

        await dbArchivos.actualizar(archivo.id, {
          hash,
          storageKey,
          proveedor: almacenamiento.proveedor,
          bucket: almacenamiento.bucket,
          nombreAlmacenado: path.basename(storageKey),
        });
      } catch (err) {
        if (err.code === 'ENOENT') {
          logger.warn(
            `Archivo no encontrado en disco: ${archivo.ruta}. Marcando como eliminado.`,
          );
          await dbArchivos.marcarEliminado(archivo.id);
          huérfanos++;
        } else {
          logger.error(`Error procesando ${archivo.ruta}: ${err.message}`);
          errores++;
        }
      }
    }
  }

  logger.info('--- Resumen de Migración ---');
  logger.info(`Archivos procesados: ${procesados}`);
  logger.info(`Archivos subidos a la nube: ${subidos}`);
  logger.info(`Archivos huérfanos marcados: ${huérfanos}`);
  logger.info(`Errores: ${errores}`);
  process.exit(errores > 0 ? 1 : 0);
}

migrar().catch((err) => {
  logger.error(`Error fatal en migración: ${err.message}`);
  process.exit(1);
});
