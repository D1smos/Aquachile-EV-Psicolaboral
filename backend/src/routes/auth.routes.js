import { Router } from 'express';
import { requiereAutenticacion } from '../middlewares/autenticacion.js';
import { limitadorLogin } from '../middlewares/limitadores.js';
import { login, perfil } from '../controllers/auth.controller.js';

export const rutasAuth = Router();

rutasAuth.post('/login', limitadorLogin, login);
rutasAuth.get('/perfil', requiereAutenticacion, perfil);
