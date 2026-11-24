import { api } from './api.js';

export const obtenerAnalisisIA = (candidatoId) =>
  api.get(`/candidatos/${candidatoId}/analisis`);

export const generarAnalisisIA = (candidatoId, payload = {}) =>
  api.post(`/candidatos/${candidatoId}/analisis`, payload);

export const revisarAnalisisIA = (analisisId, payload) =>
  api.patch(`/analisis-ia/${analisisId}/revision`, payload);

export const solicitarAsistenciaEvaluacion = (candidatoId, payload = {}) =>
  api.post(`/candidatos/${candidatoId}/asistente`, payload);

export const subirDocumentoCandidato = (candidatoId, formData) =>
  api.post(`/candidatos/${candidatoId}/documentos`, formData);

export const obtenerTextoDocumento = (candidatoId, archivoId) =>
  api.get(`/candidatos/${candidatoId}/documentos/${archivoId}/texto`);

export const reprocesarDocumento = (candidatoId, archivoId) =>
  api.post(`/candidatos/${candidatoId}/documentos/${archivoId}/reprocesar`);
