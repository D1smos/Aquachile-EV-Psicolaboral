import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/autenticacion.js';
import {
  callback,
  conectar,
  desconectar,
  estado,
} from '../controllers/integraciones.controller.js';

export const rutasIntegraciones = Router();

rutasIntegraciones.get('/google/callback', callback);
rutasIntegraciones.use(requiereAutenticacion);
rutasIntegraciones.get('/google/estado', estado);
rutasIntegraciones.get('/google/conectar', conectar);
rutasIntegraciones.delete('/google', desconectar);
