import { Router } from 'express';
import { subirPostulacion } from '../middlewares/archivos.js';
import { limitadorConsulta, limitadorPostulaciones } from '../middlewares/limitadores.js';
import {
  consultarPostulacionController,
  crearPostulacionController,
} from '../controllers/postulacion.controller.js';

export const rutasPostulaciones = Router();

rutasPostulaciones.post('/consulta', limitadorConsulta, consultarPostulacionController);
rutasPostulaciones.post('/', limitadorPostulaciones, subirPostulacion, crearPostulacionController);
