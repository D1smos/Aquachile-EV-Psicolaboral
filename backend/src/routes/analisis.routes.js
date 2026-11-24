import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion.js';
import { limitadorIA } from '../middlewares/limitadores.js';
import { ROL_EVALUADOR } from '../services/auth.service.js';
import { analizar, listar, revisar } from '../controllers/analisis.controller.js';

export const rutasAnalisis = Router({ mergeParams: true });

rutasAnalisis.get('/', listar);
rutasAnalisis.post('/', requiereRol(ROL_EVALUADOR), limitadorIA, analizar);
rutasAnalisis.patch('/:analisisId/revision', requiereRol(ROL_EVALUADOR), revisar);

export const rutasAnalisisGlobal = Router();

rutasAnalisisGlobal.patch(
  '/:id/revision',
  requiereAutenticacion,
  requiereRol(ROL_EVALUADOR),
  revisar,
);
