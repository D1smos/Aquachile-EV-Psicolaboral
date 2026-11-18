import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion.js';
import { ROL_EVALUADOR } from '../services/auth.service.js';
import {
  actualizar,
  crear,
  eliminar,
  listar,
  obtener,
  sincronizar,
} from '../controllers/entrevistas.controller.js';

export const rutasEntrevistas = Router();

rutasEntrevistas.use(requiereAutenticacion);
rutasEntrevistas.get('/', listar);
rutasEntrevistas.get('/:id', obtener);
rutasEntrevistas.post('/', requiereRol(ROL_EVALUADOR), crear);
rutasEntrevistas.patch('/:id', requiereRol(ROL_EVALUADOR), actualizar);
rutasEntrevistas.delete('/:id', requiereRol(ROL_EVALUADOR), eliminar);
rutasEntrevistas.post('/:id/sincronizar', requiereRol(ROL_EVALUADOR), sincronizar);
