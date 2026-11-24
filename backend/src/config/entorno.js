import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const raizBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

dotenv.config({ path: path.join(raizBackend, '.env') });

const requerir = (clave) => {
  const valor = process.env[clave];
  if (!valor) {
    throw new Error(`Falta la variable de entorno obligatoria "${clave}". Configura el archivo .env (ver .env.example).`);
  }
  return valor;
};

const aEntero = (valor, defecto) => {
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : defecto;
};

const aLista = (valor) =>
  String(valor ?? '')
    .split(',')
    .map((elemento) => elemento.trim())
    .filter(Boolean);

const aRuta = (valor, defecto) => (valor ? path.resolve(String(valor)) : defecto);

export const entorno = Object.freeze({
  raizBackend,
  esProduccion: process.env.NODE_ENV === 'production',
  puerto: aEntero(process.env.PORT, 5000),
  jwt: {
    secreto: requerir('JWT_SECRET'),
    expiracion: process.env.JWT_EXPIRES_IN ?? '8h',
  },
  corsOrigenes: aLista(process.env.CORS_ORIGIN),
  servirFrontend: process.env.SERVE_FRONTEND === 'true',
  urlPublica: String(
    process.env.PUBLIC_APP_URL ??
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'),
  ).replace(/\/+$/, ''),
  db: {
    url: process.env.DATABASE_URL ?? '',
  },
  limiteArchivoMb: aEntero(process.env.LIMITE_ARCHIVO_MB, 5),
  seedDemo: process.env.SEED_DEMO === 'true',
  correo: {
    host: process.env.SMTP_HOST ?? '',
    puerto: aEntero(process.env.SMTP_PORT, 587),
    seguro: process.env.SMTP_SECURE === 'true',
    usuario: process.env.SMTP_USER ?? '',
    clave: process.env.SMTP_PASS ?? '',
    remitente: process.env.SMTP_FROM ?? '',
    responderA: process.env.SMTP_REPLY_TO ?? '',
  },
  evaluador: {
    email: process.env.EVALUADOR_EMAIL ?? '',
    nombre: process.env.EVALUADOR_NOMBRE ?? 'Evaluador Psicolaboral',
    password: process.env.EVALUADOR_PASSWORD ?? '',
  },
  analista: {
    email: process.env.ANALISTA_EMAIL ?? '',
    nombre: process.env.ANALISTA_NOMBRE ?? 'Analista de Reclutamiento',
    password: process.env.ANALISTA_PASSWORD ?? '',
  },
  directorios: {
    uploads: aRuta(process.env.DIRECTORIO_UPLOADS, path.join(raizBackend, 'uploads')),
    datos: aRuta(process.env.DIRECTORIO_DATOS, path.join(raizBackend, 'data')),
    frontend: path.resolve(raizBackend, '..', 'frontend', 'dist'),
  },
});
