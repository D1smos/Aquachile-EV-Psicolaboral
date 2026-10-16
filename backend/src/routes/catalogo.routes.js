import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/autenticacion.js';
import { obtenerCatalogos, obtenerCuestionario } from '../controllers/catalogo.controller.js';

export const rutasCatalogos = Router();

rutasCatalogos.get('/', obtenerCatalogos);
rutasCatalogos.get('/evaluacion', requiereAutenticacion, obtenerCuestionario);
