import crypto from 'node:crypto';
import path from 'node:path';
import { entorno } from '../../config/entorno.js';
import { ESTADOS_TEXTO } from '../../domain/constantes.js';
import { normalizarComparacion, normalizarEspacios } from '../../utils/texto.js';

const PALABRAS_VACIAS = new Set([
  'para', 'como', 'con', 'por', 'del', 'las', 'los', 'una', 'unos', 'unas', 'que', 'esta',
  'este', 'estos', 'estas', 'sus', 'mas', 'pero', 'entre', 'desde', 'hasta', 'sobre', 'cuando',
  'donde', 'porque', 'segun', 'cada', 'todo', 'toda', 'todos', 'todas', 'otro', 'otra',
  'anos', 'ano', 'experiencia', 'trabajo', 'trabajos', 'empresa', 'empresas', 'cargo', 'cargos',
  'funciones', 'responsable', 'responsabilidades', 'logros', 'objetivo', 'perfil', 'curriculum',
  'vitae', 'datos', 'personales', 'contacto', 'telefono', 'correo', 'email', 'direccion',
  'formacion', 'educacion', 'academica', 'estudios', 'titulo', 'institucion', 'universidad',
  'conocimientos', 'habilidades', 'competencias', 'idiomas', 'referencias', 'disponibilidad',
  'presente', 'actual', 'actualmente', 'durante', 'desde', 'hasta', 'mediante', 'realice',
  'realizado', 'realizar', 'desempeno', 'desempenada', 'desempenado', 'desarrollo', 'gestion',
  'apoyo', 'equipo', 'equipos', 'area', 'areas', 'actividades', 'proyectos', 'proyecto',
  'nivel', 'empresa', 'industrial', 'nacional', 'region', 'ciudad', 'pais', 'mes', 'meses',
  'año', 'años', 'ano', 'anos', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]);

const MAX_PALABRAS_CLAVE = 30;

export const calcularHash = (texto) =>
  crypto.createHash('sha256').update(String(texto ?? ''), 'utf8').digest('hex');

export const contarCaracteresUtiles = (texto) =>
  String(texto ?? '').replace(/\s+/g, '').length;

const detectarAnosExperiencia = (textoNormalizado) => {
  const candidatos = [];
  const patrones = [
    /(\d{1,2})\s*(?:\+)?\s*anos?\s+(?:de\s+)?(?:experiencia|trayectoria|trabajo)/g,
    /(?:experiencia|trayectoria)\s+(?:de\s+|por\s+|con\s+)?(\d{1,2})\s*(?:\+)?\s*anos?/g,
    /(?:mas\s+de\s+)?(\d{1,2})\s*(?:\+)?\s*anos?\s+(?:en|como|trabajando)/g,
  ];

  for (const patron of patrones) {
    for (const coincidencia of textoNormalizado.matchAll(patron)) {
      const anos = Number(coincidencia[1]);
      if (Number.isFinite(anos) && anos > 0) {
        candidatos.push(anos);
      }
    }
  }

  const patronRango = /\b(19|20)\d{2}\s*(?:[-–—]\s*|\s+a\s+)((?:19|20)\d{2}|actual|presente|hoy)\b/g;
  for (const coincidencia of textoNormalizado.matchAll(patronRango)) {
    const inicio = Number(coincidencia[0].slice(0, 4));
    const finTexto = coincidencia[2];
    const fin = /^\d{4}$/.test(finTexto) ? Number(finTexto) : new Date().getFullYear();
    const diferencia = fin - inicio;
    if (Number.isFinite(diferencia) && diferencia > 0 && diferencia <= 60) {
      candidatos.push(diferencia);
    }
  }

  return candidatos.length > 0 ? Math.min(Math.max(...candidatos), 60) : 0;
};

const detectarPalabrasClave = (textoNormalizado) => {
  const conteo = new Map();
  for (const palabra of textoNormalizado.match(/[a-z0-9][a-z0-9+#.]*/g) ?? []) {
    if (palabra.length < 3 || /^\d+$/.test(palabra) || PALABRAS_VACIAS.has(palabra)) {
      continue;
    }
    conteo.set(palabra, (conteo.get(palabra) ?? 0) + 1);
  }

  return [...conteo.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_PALABRAS_CLAVE)
    .map(([palabra]) => palabra);
};

export const extraerMetadatosCV = (texto) => {
  const normalizado = normalizarComparacion(texto);
  return {
    anosExperiencia: detectarAnosExperiencia(normalizado),
    palabrasClave: detectarPalabrasClave(normalizado),
  };
};

const armarResultado = ({ textoExtraido, paginas, modelo }) => {
  const texto = normalizarEspacios(textoExtraido).slice(0, entorno.documentos.maxCaracteresTexto);
  const caracteres = texto.length;
  const estado =
    contarCaracteresUtiles(texto) < 50 ? ESTADOS_TEXTO.SIN_TEXTO : ESTADOS_TEXTO.OK;
  const metadatos = extraerMetadatosCV(texto);
  return {
    texto: texto || null,
    textoHash: texto ? calcularHash(texto) : null,
    paginas: paginas === null || paginas === undefined ? null : Number(paginas),
    caracteres,
    estado,
    modeloExtraccion: modelo,
    error: null,
    ...metadatos,
  };
};

const errorResultado = (mensaje, modelo = null) => ({
  texto: null,
  textoHash: null,
  paginas: null,
  caracteres: 0,
  estado: ESTADOS_TEXTO.ERROR,
  modeloExtraccion: modelo,
  error: String(mensaje ?? 'No se pudo extraer el texto').slice(0, 500),
  anosExperiencia: 0,
  palabrasClave: [],
});

const noSoportado = () => ({
  texto: null,
  textoHash: null,
  paginas: null,
  caracteres: 0,
  estado: ESTADOS_TEXTO.NO_SOPORTADO,
  modeloExtraccion: null,
  error: null,
  anosExperiencia: 0,
  palabrasClave: [],
});

const extraerPDF = async (buffer) => {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const resultado = await parser.getText();
    return armarResultado({
      textoExtraido: resultado?.text ?? '',
      paginas: resultado?.total ?? resultado?.pages?.length ?? null,
      modelo: 'pdf-parse',
    });
  } finally {
    await parser.destroy().catch(() => undefined);
  }
};

const extraerDOCX = async (buffer) => {
  const { default: mammoth } = await import('mammoth');
  const resultado = await mammoth.extractRawText({ buffer });
  return armarResultado({
    textoExtraido: resultado?.value ?? '',
    paginas: null,
    modelo: 'mammoth',
  });
};

export const extraerTexto = async ({ buffer, nombreOriginal }) => {
  const extension = path.extname(String(nombreOriginal ?? '')).toLowerCase();
  if (!buffer || buffer.length === 0) {
    return errorResultado('El archivo está vacío');
  }
  try {
    if (extension === '.pdf') {
      return await extraerPDF(buffer);
    }
    if (extension === '.docx') {
      return await extraerDOCX(buffer);
    }
    return noSoportado();
  } catch (error) {
    return errorResultado(
      `No se pudo leer el documento: ${error?.message ?? 'formato no reconocido'}`,
      extension === '.pdf' ? 'pdf-parse' : extension === '.docx' ? 'mammoth' : null,
    );
  }
};
