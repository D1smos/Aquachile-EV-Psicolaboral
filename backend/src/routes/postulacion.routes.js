import { Router } from 'express';
import { subirPostulacion } from '../middlewares/archivos.js';
import { limitadorPostulaciones } from '../middlewares/limitadores.js';
import { crearPostulacionController } from '../controllers/postulacion.controller.js';

export const rutasPostulaciones = Router();

rutasPostulaciones.post('/', limitadorPostulaciones, subirPostulacion, crearPostulacionController);
