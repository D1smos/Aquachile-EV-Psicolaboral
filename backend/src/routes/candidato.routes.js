import { Router } from 'express';
import { requiereAutenticacion, requiereRol } from '../middlewares/autenticacion.js';
import { subirPostulacion } from '../middlewares/archivos.js';
import { ROL_EVALUADOR } from '../services/auth.service.js';
import {
  actualizar,
  actualizarEstado,
  asistir,
  comparar,
  crearManual,
  descargarArchivo,
  eliminar,
  evaluar,
  exportarCsv,
  historial,
  informePdf,
  listar,
  obtener,
} from '../controllers/candidato.controller.js';

export const rutasCandidatos = Router();

rutasCandidatos.use(requiereAutenticacion);
rutasCandidatos.get('/', listar);
rutasCandidatos.get('/exportar.csv', exportarCsv);
rutasCandidatos.get('/comparar', comparar);
rutasCandidatos.post('/', subirPostulacion, crearManual);
rutasCandidatos.get('/:id', obtener);
rutasCandidatos.put('/:id', actualizar);
rutasCandidatos.delete('/:id', eliminar);
rutasCandidatos.patch('/:id/estado', actualizarEstado);
rutasCandidatos.post('/:id/evaluacion', requiereRol(ROL_EVALUADOR), evaluar);
rutasCandidatos.post('/:id/asistente', requiereRol(ROL_EVALUADOR), asistir);
rutasCandidatos.get('/:id/informe.pdf', informePdf);
rutasCandidatos.get('/:id/historial', historial);
rutasCandidatos.get('/:id/archivos/:archivoId', descargarArchivo);
