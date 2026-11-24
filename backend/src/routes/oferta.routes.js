import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion.js';
import { ROL_EVALUADOR } from '../services/auth.service.js';
import { actualizarOferta, cambiarEstadoOferta, crearOferta, eliminarOferta, listarOfertasPrivadas, listarOfertasPublicas, obtenerOfertaPublica } from '../controllers/oferta.controller.js';

export const rutasOfertas = Router();

rutasOfertas.get('/publicas', listarOfertasPublicas);
rutasOfertas.get('/publicas/:id', obtenerOfertaPublica);
rutasOfertas.get('/', requiereAutenticacion, listarOfertasPrivadas);
rutasOfertas.post('/', requiereAutenticacion, requiereRol(ROL_EVALUADOR), crearOferta);
rutasOfertas.put('/:id', requiereAutenticacion, requiereRol(ROL_EVALUADOR), actualizarOferta);
rutasOfertas.patch('/:id/estado', requiereAutenticacion, requiereRol(ROL_EVALUADOR), cambiarEstadoOferta);
rutasOfertas.delete('/:id', requiereAutenticacion, requiereRol(ROL_EVALUADOR), eliminarOferta);
