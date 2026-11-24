import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/autenticacion.js';
import { documentos } from '../controllers/candidato.controller.js';

export const rutasArchivos = Router();

rutasArchivos.use(requiereAutenticacion);
rutasArchivos.get('/', documentos);
