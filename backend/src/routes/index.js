import { Router } from 'express';
import { rutasAnalisisGlobal } from './analisis.routes.js';
import { rutasArchivos } from './archivo.routes.js';
import { rutasAuth } from './auth.routes.js';
import { rutasCatalogos } from './catalogo.routes.js';
import { rutasCandidatos } from './candidato.routes.js';
import { rutasEntrevistas } from './entrevista.routes.js';
import { rutasIntegraciones } from './integracion.routes.js';
import { rutasPostulaciones } from './postulacion.routes.js';
import { rutasOfertas } from './oferta.routes.js';

export const rutasApi = Router();

rutasApi.use('/analisis-ia', rutasAnalisisGlobal);
rutasApi.use('/archivos', rutasArchivos);
rutasApi.use('/auth', rutasAuth);
rutasApi.use('/catalogos', rutasCatalogos);
rutasApi.use('/candidatos', rutasCandidatos);
rutasApi.use('/entrevistas', rutasEntrevistas);
rutasApi.use('/integraciones', rutasIntegraciones);
rutasApi.use('/postulaciones', rutasPostulaciones);
rutasApi.use('/ofertas', rutasOfertas);
