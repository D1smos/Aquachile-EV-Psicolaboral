import { dbAnalisisIA, dbDocumentosTexto } from '../../config/baseDatos.js';
import { entorno } from '../../config/entorno.js';
import { ESTADOS_ANALISIS, ESTADOS_TEXTO, TIPOS_ARCHIVO } from '../../domain/constantes.js';
import { ErrorHttp, noEncontrado } from '../../utils/ErrorHttp.js';
import { obtenerCandidato } from '../candidato.service.js';
import { calcularHash } from '../documentos/extraerTexto.js';
import { validarEsquemaAnalisis } from './esquema.js';
import { PROMPT_VERSION, construirPrompt } from './prompts.js';
import { consultarOpenRouter } from './proveedor.js';

const buscarDocumento = async (candidato, archivoId) => {
  const archivos = candidato.archivos ?? [];
  const archivo = archivoId
    ? archivos.find((elemento) => elemento.id === archivoId)
    : archivos.find((elemento) => elemento.tipo === TIPOS_ARCHIVO.CV);
  if (!archivo) {
    throw new ErrorHttp('El candidato no tiene documentos para analizar', 422, [
      { codigo: 'SIN_DOCUMENTO', mensaje: 'Sube un CV en PDF o DOCX antes de analizar' },
    ]);
  }
  const documento = await dbDocumentosTexto.obtenerPorArchivo(archivo.id);
  if (!documento || !documento.texto || documento.estado !== ESTADOS_TEXTO.OK) {
    throw new ErrorHttp('El documento no tiene texto utilizable', 422, [
      { codigo: 'SIN_TEXTO', mensaje: 'El documento no tiene texto extraído suficiente' },
    ]);
  }
  return { archivo, documento };
};

const buscarEnCache = async ({ candidatoId, textoHash, cargo, promptVersion }) => {
  for (const modelo of [entorno.ia.modelo, ...entorno.ia.fallbackModels]) {
    const cache = await dbAnalisisIA.buscarCache({
      candidatoId,
      textoHash,
      cargo,
      promptVersion,
      modelo,
    });
    if (cache) {
      return cache;
    }
  }
  return null;
};

const enriquecerDocumento = async (documento, analisis) =>
  dbDocumentosTexto.guardar({
    ...documento,
    anosExperiencia: analisis.anosExperienciaEstimados,
    palabrasClave: analisis.palabrasClaveDetectadas,
  });

export const generarAnalisis = async (
  candidatoId,
  { archivoId = null, cargo = null, forzar = false, generadoPor = null, proveedor = consultarOpenRouter } = {},
) => {
  const candidato = await obtenerCandidato(candidatoId);
  const { archivo, documento } = await buscarDocumento(candidato, archivoId);
  const cargoAnalisis = String(cargo || candidato.cargo || '').trim();
  if (!cargoAnalisis) {
    throw new ErrorHttp('El cargo es obligatorio para analizar', 400);
  }
  const textoHash = documento.textoHash || calcularHash(documento.texto);

  if (!forzar) {
    const cache = await buscarEnCache({
      candidatoId: candidato.id,
      textoHash,
      cargo: cargoAnalisis,
      promptVersion: PROMPT_VERSION,
    });
    if (cache) {
      return { analisis: cache, cacheHit: true, archivo, documento };
    }
  }

  const prompt = construirPrompt({ candidato, cargo: cargoAnalisis, texto: documento.texto });
  const respuesta = await proveedor({ prompt, modelo: entorno.ia.modelo });
  const validado = validarEsquemaAnalisis(respuesta?.json ?? respuesta?.contenido ?? respuesta);
  const modelo = respuesta?.modelo ?? entorno.ia.modelo;
  const analisis = await dbAnalisisIA.insertar({
    candidatoId: candidato.id,
    archivoId: archivo.id,
    textoHash,
    cargo: cargoAnalisis,
    promptVersion: PROMPT_VERSION,
    modelo,
    resultado: validado,
    estado: ESTADOS_ANALISIS.BORRADOR,
    generadoPor,
    tokensEntrada: respuesta?.tokensEntrada ?? 0,
    tokensSalida: respuesta?.tokensSalida ?? 0,
  });
  const documentoActualizado = await enriquecerDocumento(documento, validado);
  return { analisis, cacheHit: false, archivo, documento: documentoActualizado };
};

export const obtenerAnalisisCandidato = async (candidatoId) => {
  await obtenerCandidato(candidatoId);
  const historial = await dbAnalisisIA.listarPorCandidato(candidatoId);
  return { ultimo: historial[0] ?? null, historial };
};

export const revisarAnalisis = async (id, { estado, revisadoPor = null, comentario = null }) => {
  const actual = await dbAnalisisIA.obtenerPorId(id);
  if (!actual) {
    throw noEncontrado('Análisis IA');
  }
  const analisis = await dbAnalisisIA.actualizarRevision(id, { estado, revisadoPor });
  return { analisis, comentario: comentario ?? null };
};
