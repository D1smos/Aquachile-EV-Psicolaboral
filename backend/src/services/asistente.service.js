import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { dbCandidatos } from '../config/baseDatos.js';
import { TIPOS_ARCHIVO } from '../domain/constantes.js';
import { localizarArchivo, obtenerCandidato } from './candidato.service.js';

const MAX_CARACTERES = 4000;

const VACIAS = new Set([
  'de', 'la', 'el', 'en', 'los', 'del', 'se', 'las', 'por', 'un', 'una', 'unos', 'unas',
  'para', 'con', 'su', 'sus', 'al', 'como', 'mas', 'pero', 'este', 'esta', 'estos', 'estas',
  'entre', 'cuando', 'donde', 'porque', 'sobre', 'hasta', 'desde', 'son', 'fue',
]);

const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const palabrasClave = (texto) =>
  [...new Set(normalizar(texto).split(/[^a-z0-9]+/).filter((palabra) => palabra.length > 3 && !VACIAS.has(palabra)))];

const extraerPdf = async (ruta) => {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: await readFile(ruta) });
    let texto = null;
    try {
      const resultado = await parser.getText();
      texto = typeof resultado?.text === 'string' ? resultado.text : null;
    } finally {
      await parser.destroy().catch(() => undefined);
    }
    return texto ? texto.slice(0, MAX_CARACTERES) : null;
  } catch {
    return null;
  }
};

const extraerDocx = async (ruta) => {
  try {
    const { default: mammoth } = await import('mammoth');
    const resultado = await mammoth.extractRawText({ path: ruta });
    return typeof resultado?.value === 'string' ? resultado.value.slice(0, MAX_CARACTERES) : null;
  } catch {
    return null;
  }
};

const extraerTextoCv = async (candidato) => {
  const cv = (candidato.archivos ?? []).find((archivo) => archivo.tipo === TIPOS_ARCHIVO.CV);
  if (!cv) {
    return null;
  }
  try {
    const { rutaAbsoluta } = localizarArchivo(candidato, cv.id);
    const extension = path.extname(cv.nombreOriginal).toLowerCase();
    if (extension === '.pdf') {
      return await extraerPdf(rutaAbsoluta);
    }
    if (extension === '.docx') {
      return await extraerDocx(rutaAbsoluta);
    }
    return null;
  } catch {
    return null;
  }
};

const construirResumen = (candidato, afinidad) => {
  const base =
    `${candidato.nombre} postula al cargo ${candidato.cargo} (${candidato.familiaCargo}). ` +
    `Cuenta con ${candidato.aniosExperiencia} años de experiencia, formación ${candidato.formacion} ` +
    `y disponibilidad ${candidato.disponibilidad}.`;
  if (afinidad === null) {
    return `${base} Aún no hay CV legible para analizar afinidad con el cargo.`;
  }
  return `${base} Su CV muestra una afinidad de ${afinidad}% con los términos del cargo.`;
};

const construirBorrador = (candidato, afinidad, coincidencias) => {
  const fortalezas =
    candidato.aniosExperiencia >= 5
      ? `experiencia sólida de ${candidato.aniosExperiencia} años`
      : `motivación declarada: ${candidato.motivacion || 'no indicada'}`;
  const afinidadTexto =
    afinidad === null
      ? 'indagar en entrevista los antecedentes laborales (sin CV legible)'
      : `profundizar en ${coincidencias.slice(0, 3).join(', ') || 'las funciones del cargo'}`;
  return (
    `Borrador automático, revisar antes de usar. Destaca ${fortalezas} ` +
    `y disponibilidad ${candidato.disponibilidad}. Se sugiere ${afinidadTexto}.`
  );
};

export const semaforoDe = (afinidad) => {
  if (afinidad === null || afinidad === undefined) {
    return 'sin-datos';
  }
  if (afinidad >= 70) {
    return 'alto';
  }
  if (afinidad >= 40) {
    return 'medio';
  }
  return 'bajo';
};

export const construirAsistencia = (candidato, textoCv) => {
  const claves = palabrasClave(`${candidato.cargo} ${candidato.familiaCargo}`);
  let afinidad = null;
  let coincidencias = [];
  let faltantes = [];
  if (textoCv && claves.length > 0) {
    const texto = normalizar(textoCv);
    coincidencias = claves.filter((clave) => texto.includes(clave));
    faltantes = claves.filter((clave) => !texto.includes(clave));
    afinidad = Math.round((coincidencias.length / claves.length) * 100);
  }
  return {
    resumen: construirResumen(candidato, afinidad),
    afinidad,
    semaforo: semaforoDe(afinidad),
    coincidencias,
    faltantes,
    sinCv: !textoCv,
    borrador: construirBorrador(candidato, afinidad, coincidencias),
  };
};

export const compararPorCargo = async (cargo, candidatoId = null) => {
  const todos = await dbCandidatos.listarTodos();
  const delCargo = todos
    .filter((candidato) => candidato.cargo === cargo && Number.isFinite(candidato.afinidadIA))
    .sort((a, b) => b.afinidadIA - a.afinidadIA);
  const ranking = delCargo.map((candidato, indice) => ({
    posicion: indice + 1,
    id: candidato.id,
    nombre: candidato.nombre,
    folio: candidato.folio,
    afinidad: candidato.afinidadIA,
  }));
  const posicion = candidatoId
    ? (ranking.find((item) => item.id === candidatoId)?.posicion ?? null)
    : null;
  return { cargo, total: ranking.length, posicion, ranking };
};

export const generarAsistencia = async (candidatoId) => {
  const candidato = await obtenerCandidato(candidatoId);
  const textoCv = await extraerTextoCv(candidato);
  return construirAsistencia(candidato, textoCv);
};
