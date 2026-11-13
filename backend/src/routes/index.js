import { Router } from 'express';
import { rutasArchivos } from './archivo.routes.js';
import { rutasAuth } from './auth.routes.js';
import { rutasCatalogos } from './catalogo.routes.js';
import { rutasCandidatos } from './candidato.routes.js';
import { rutasPostulaciones } from './postulacion.routes.js';

export const rutasApi = Router();

rutasApi.use('/archivos', rutasArchivos);
rutasApi.use('/auth', rutasAuth);
rutasApi.use('/catalogos', rutasCatalogos);
rutasApi.use('/candidatos', rutasCandidatos);
rutasApi.use('/postulaciones', rutasPostulaciones);
