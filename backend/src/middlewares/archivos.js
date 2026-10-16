import { mkdirSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { entorno } from '../config/entorno.js';
import { TIPOS_ARCHIVO } from '../domain/constantes.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

const EXTENSIONES_PERMITIDAS = new Set(['.pdf', '.doc', '.docx']);
const EXTENSIONES_ANTECEDENTES = new Set(['.pdf', '.doc', '.docx', '.xlsx']);
const MIME_PERMITIDOS = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MIME_ANTECEDENTES = new Set([
  ...MIME_PERMITIDOS,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAXIMO_ARCHIVOS = 5;

const almacenamiento = multer.diskStorage({
  destination: (req, file, callback) => {
    const carpeta = path.join(entorno.directorios.uploads, file.fieldname);
    mkdirSync(carpeta, { recursive: true });
    callback(null, carpeta);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const filtroArchivos = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const esAntecedente = file.fieldname === TIPOS_ARCHIVO.ANTECEDENTES;
  const extensiones = esAntecedente ? EXTENSIONES_ANTECEDENTES : EXTENSIONES_PERMITIDAS;
  const mimes = esAntecedente ? MIME_ANTECEDENTES : MIME_PERMITIDOS;
  if (!extensiones.has(extension) || !mimes.has(file.mimetype)) {
    callback(
      new ErrorHttp('Solo se aceptan archivos PDF, DOC, DOCX o XLSX en antecedentes', 400, [
        { campo: file.fieldname, mensaje: 'Formato de archivo no permitido' },
      ]),
    );
    return;
  }
  callback(null, true);
};

const limites = {
  fileSize: entorno.limiteArchivoMb * 1024 * 1024,
  files: MAXIMO_ARCHIVOS,
};

export const subirPostulacion = multer({ storage: almacenamiento, fileFilter: filtroArchivos, limites }).fields([
  { name: TIPOS_ARCHIVO.CV, maxCount: 1 },
  { name: TIPOS_ARCHIVO.ANTECEDENTES, maxCount: 4 },
]);
