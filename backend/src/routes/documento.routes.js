import { Router } from 'express';
import { requiereRol } from '../middlewares/autenticacion.js';
import { subirDocumento as subirDocumentoMiddleware } from '../middlewares/archivos.js';
import { ROL_EVALUADOR } from '../services/auth.service.js';
import {
  eliminarDocumentoController,
  reprocesarDocumentoController,
  subirDocumento,
  textoDocumento,
} from '../controllers/documento.controller.js';

export const rutasDocumentos = Router({ mergeParams: true });

rutasDocumentos.post(
  '/',
  requiereRol(ROL_EVALUADOR),
  subirDocumentoMiddleware,
  subirDocumento,
);
rutasDocumentos.get('/:archivoId/texto', textoDocumento);
rutasDocumentos.post(
  '/:archivoId/reprocesar',
  requiereRol(ROL_EVALUADOR),
  reprocesarDocumentoController,
);
rutasDocumentos.delete('/:archivoId', requiereRol(ROL_EVALUADOR), eliminarDocumentoController);
