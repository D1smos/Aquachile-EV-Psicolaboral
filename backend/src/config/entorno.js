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
  documentos: {
    limiteMb: aEntero(process.env.LIMITE_DOCUMENTO_MB, 10),
    maxCaracteresTexto: aEntero(process.env.MAX_CARACTERES_TEXTO, 120000),
    maxCaracteresPrompt: aEntero(process.env.MAX_CARACTERES_PROMPT, 24000),
  },
  ia: {
    habilitada: process.env.IA_HABILITADA === 'true',
    proveedor: String(process.env.LLM_PROVIDER ?? 'openrouter').trim().toLowerCase() || 'openrouter',
    baseUrl: String(process.env.LLM_BASE_URL ?? 'https://openrouter.ai/api/v1').trim().replace(/\/+$/, ''),
    apiKey: String(process.env.LLM_API_KEY ?? '').trim(),
    modelo: String(process.env.LLM_MODEL ?? 'google/gemini-2.0-flash-exp:free').trim(),
    fallbackModels: aLista(process.env.LLM_FALLBACK_MODELS ?? 'meta-llama/llama-3.3-70b-instruct:free,qwen/qwen-2.5-72b-instruct:free'),
    timeoutMs: aEntero(process.env.LLM_TIMEOUT_MS, 45000),
    maxTokens: aEntero(process.env.LLM_MAX_TOKENS, 2000),
    rateLimit: aEntero(process.env.IA_RATE_LIMIT, 10),
    appUrl: String(process.env.LLM_APP_URL ?? 'http://localhost:5173').trim().replace(/\/+$/, ''),
    appName: String(process.env.LLM_APP_NAME ?? 'AquaChile-Psicolaboral').trim() || 'AquaChile-Psicolaboral',
  },
  google: {
    habilitado: process.env.GOOGLE_HABILITADO === 'true',
    clientId: String(process.env.GOOGLE_CLIENT_ID ?? '').trim(),
    clientSecret: String(process.env.GOOGLE_CLIENT_SECRET ?? '').trim(),
    redirectUri: String(
      process.env.GOOGLE_REDIRECT_URI ??
        'http://localhost:5000/api/integraciones/google/callback',
    ).trim(),
    calendarId: String(process.env.GOOGLE_CALENDAR_ID ?? 'primary').trim() || 'primary',
    oauthStateSecret: String(process.env.GOOGLE_OAUTH_STATE_SECRET ?? '').trim(),
    tokenEncryptionKey: String(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? '').trim(),
    timezone: String(process.env.CALENDAR_TIMEZONE ?? 'America/Santiago').trim() || 'America/Santiago',
  },
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
  resend: {
    apiKey: String(process.env.RESEND_API_KEY ?? '').trim(),
    fromEmail: String(process.env.RESEND_FROM_EMAIL ?? 'AquaChile <onboarding@resend.dev>').trim(),
    encargadoEmail: String(process.env.RESEND_ENCARGADO_EMAIL ?? 'evaluador@aquachile.cl').trim(),
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
  almacenamiento: {
    proveedor: String(process.env.STORAGE_PROVIDER ?? 'local').trim().toLowerCase() || 'local',
    bucket: String(process.env.SUPABASE_BUCKET ?? '').trim(),
    ttl: aEntero(process.env.STORAGE_SIGNED_URL_TTL, 60),
    supabase: {
      url: String(process.env.SUPABASE_URL ?? '').trim(),
      serviceRoleKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim(),
    },
  },
});
