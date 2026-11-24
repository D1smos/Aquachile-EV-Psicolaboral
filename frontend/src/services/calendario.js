import { api } from './api.js';

const consulta = (filtros = {}) => {
  const parametros = new URLSearchParams();
  if (filtros.desde) parametros.set('desde', filtros.desde);
  if (filtros.hasta) parametros.set('hasta', filtros.hasta);
  if (filtros.candidatoId) parametros.set('candidatoId', filtros.candidatoId);
  const texto = parametros.toString();
  return texto ? `?${texto}` : '';
};

export const listarEntrevistas = (filtros = {}) => api.get(`/entrevistas${consulta(filtros)}`);

export const obtenerEntrevista = (id) => api.get(`/entrevistas/${id}`);

export const crearEntrevista = (payload) => api.post('/entrevistas', payload);

export const actualizarEntrevista = (id, payload) => api.patch(`/entrevistas/${id}`, payload);

export const eliminarEntrevista = (id) => api.eliminar(`/entrevistas/${id}`);

export const sincronizarEntrevista = (id) => api.post(`/entrevistas/${id}/sincronizar`);

export const obtenerEstadoGoogle = () => api.get('/integraciones/google/estado');

export const obtenerUrlConexionGoogle = () => api.get('/integraciones/google/conectar');

export const desconectarGoogle = () => api.eliminar('/integraciones/google');
