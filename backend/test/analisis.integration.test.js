import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-analisis-api-'));

const contratoIA = {
  version: '1.0',
  resumen: 'Perfil compatible con el cargo, con experiencia y herramientas atingentes.',
  anosExperienciaEstimados: 7,
  palabrasClaveDetectadas: ['python', 'sql'],
  afinidad: { score: 80, nivel: 'alto', justificacion: 'Cumple los requisitos principales.' },
  fortalezas: [{ titulo: 'Experiencia', evidencia: 'Siete años en planta', documento: 'cv.pdf' }],
  brechas: [],
  competencias: [
    {
      id: 'produccion',
      nombre: 'Gestión de producción',
      nivel: 4,
      evidencia: ['Coordinación de turnos'],
      confianza: 0.85,
    },
  ],
  preguntasEntrevista: [
    { pregunta: '¿Cómo coordinó turnos?', objetivo: 'Validar experiencia', competenciaId: 'produccion' },
  ],
  recomendacion: { codigo: 'avanzar', texto: 'Continuar con entrevista.' },
  confianza: 0.84,
  advertencias: [],
};

const peticionesIA = [];
const servidorIA = await new Promise((resolver) => {
  const instancia = http.createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (parte) => {
      cuerpo += parte;
    });
    req.on('end', () => {
      peticionesIA.push(JSON.parse(cuerpo || '{}'));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(contratoIA) } }],
          usage: { prompt_tokens: 50, completion_tokens: 40 },
        }),
      );
    });
  });
  instancia.listen(0, '127.0.0.1', () => resolver(instancia));
});

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-analisis-api-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.EVALUADOR_EMAIL = 'evaluador@analisis.cl';
process.env.EVALUADOR_PASSWORD = 'ClaveEvaluador123!';
process.env.EVALUADOR_NOMBRE = 'Evaluador de Análisis';
process.env.ANALISTA_EMAIL = 'analista@analisis.cl';
process.env.ANALISTA_PASSWORD = 'ClaveAnalista123!';
process.env.ANALISTA_NOMBRE = 'Analista de Análisis';
process.env.IA_HABILITADA = 'true';
process.env.LLM_API_KEY = 'clave-de-prueba';
process.env.LLM_MODEL = 'google/gemini-2.0-flash-exp:free';
process.env.LLM_FALLBACK_MODELS = '';
process.env.LLM_BASE_URL = `http://127.0.0.1:${servidorIA.address().port}/api/v1`;
process.env.LLM_TIMEOUT_MS = '5000';
process.env.IA_RATE_LIMIT = '100';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';

const { crearApp } = await import('../src/app.js');
const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion } = await import('../src/services/candidato.service.js');
const { dbArchivos, dbDocumentosTexto } = await import('../src/config/baseDatos.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');

await inicializarBaseDatos();

const servidor = await new Promise((resolver) => {
  const instancia = crearApp().listen(0, '127.0.0.1', () => resolver(instancia));
});
const baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;

after(async () => {
  await new Promise((resolver) => servidor.close(resolver));
  await new Promise((resolver) => servidorIA.close(resolver));
  cerrarBaseDatos();
  await rm(directorioPrueba, { recursive: true, force: true });
});

const peticion = async (metodo, ruta, { token, cuerpo } = {}) => {
  const respuesta = await fetch(`${baseUrl}${ruta}`, {
    method: metodo,
    headers: {
      ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = respuesta.headers.get('content-type')?.includes('application/json')
    ? await respuesta.json()
    : null;
  return { respuesta, datos };
};

const iniciarSesion = async (email, password) => {
  const { respuesta, datos } = await peticion('POST', '/auth/login', { cuerpo: { email, password } });
  assert.equal(respuesta.status, 200);
  return datos.token;
};

const candidato = await crearPostulacion(
  {
    nombre: 'Candidata Análisis API',
    rut: '15.555.555-5',
    correo: 'candidata@analisis.cl',
    telefono: '955566677',
    familiaCargo: 'Técnico B/C',
    cargo: 'Monitor Producción',
    formacion: 'Técnico',
    disponibilidad: 'Inmediata',
    aniosExperiencia: 4,
    motivacion: 'Prueba de endpoints de análisis.',
    aceptaPrivacidad: true,
  },
  null,
  'prueba análisis API',
);

const archivo = {
  id: crypto.randomUUID(),
  tipo: 'cv',
  nombreOriginal: 'cv.pdf',
  nombreAlmacenado: 'cv.pdf',
  ruta: 'documentos/cv/cv.pdf',
  mimetype: 'application/pdf',
  tamano: 100,
  storageKey: 'documentos/cv/cv.pdf',
  proveedor: 'local',
  bucket: null,
  hash: `hash-${candidato.id}`,
  creadoEn: new Date().toISOString(),
};
await dbArchivos.insertar(candidato.id, archivo);
await dbDocumentosTexto.guardar({
  archivoId: archivo.id,
  texto: 'Siete años de experiencia en producción, con Python y SQL.',
  textoHash: `texto-${candidato.id}`,
  paginas: 1,
  caracteres: 58,
  anosExperiencia: 0,
  palabrasClave: [],
  estado: 'ok',
  modeloExtraccion: 'prueba',
});

test('expone análisis con caché, historial y revisión protegida por rol', async () => {
  const tokenEvaluador = await iniciarSesion('evaluador@analisis.cl', 'ClaveEvaluador123!');
  const tokenAnalista = await iniciarSesion('analista@analisis.cl', 'ClaveAnalista123!');

  const primero = await peticion('POST', `/candidatos/${candidato.id}/analisis`, {
    token: tokenEvaluador,
    cuerpo: { cargo: 'Monitor Producción' },
  });
  assert.equal(primero.respuesta.status, 201);
  assert.equal(primero.datos.cacheHit, false);
  assert.equal(primero.datos.analisis.estado, 'borrador');
  assert.equal(primero.datos.analisis.resultado.afinidad.score, 80);
  assert.equal(primero.datos.analisis.tokensEntrada, 50);
  assert.equal(peticionesIA.length, 1);
  assert.equal(peticionesIA[0].model, process.env.LLM_MODEL);
  assert.equal(peticionesIA[0].provider, undefined);
  assert.equal(peticionesIA[0].response_format.type, 'json_object');

  const segundo = await peticion('POST', `/candidatos/${candidato.id}/analisis`, {
    token: tokenEvaluador,
    cuerpo: { cargo: 'Monitor Producción' },
  });
  assert.equal(segundo.respuesta.status, 200);
  assert.equal(segundo.datos.cacheHit, true);
  assert.equal(segundo.datos.analisis.id, primero.datos.analisis.id);
  assert.equal(peticionesIA.length, 1);

  const historial = await peticion('GET', `/candidatos/${candidato.id}/analisis`, {
    token: tokenEvaluador,
  });
  assert.equal(historial.respuesta.status, 200);
  assert.equal(historial.datos.historial.length, 1);
  assert.ok(historial.datos.ultimo);

  const alias = await peticion('GET', `/candidatos/${candidato.id}/analisis-ia`, {
    token: tokenEvaluador,
  });
  assert.equal(alias.respuesta.status, 200);
  assert.equal(alias.datos.ultimo.id, historial.datos.ultimo.id);

  const analisisId = primero.datos.analisis.id;
  const sinToken = await peticion('PATCH', `/analisis-ia/${analisisId}/revision`, {
    cuerpo: { estado: 'revisado' },
  });
  assert.equal(sinToken.respuesta.status, 401);

  const analista = await peticion('PATCH', `/analisis-ia/${analisisId}/revision`, {
    token: tokenAnalista,
    cuerpo: { estado: 'revisado' },
  });
  assert.equal(analista.respuesta.status, 403);

  const revisionInvalida = await peticion('PATCH', `/analisis-ia/${analisisId}/revision`, {
    token: tokenEvaluador,
    cuerpo: { estado: 'aprobado' },
  });
  assert.equal(revisionInvalida.respuesta.status, 400);

  const revision = await peticion('PATCH', `/analisis-ia/${analisisId}/revision`, {
    token: tokenEvaluador,
    cuerpo: { estado: 'revisado', comentario: 'Sin observaciones' },
  });
  assert.equal(revision.respuesta.status, 200);
  assert.equal(revision.datos.analisis.estado, 'revisado');
  assert.equal(revision.datos.analisis.revisadoPor, 'evaluador@analisis.cl');
  assert.equal(revision.datos.comentario, 'Sin observaciones');

  const anidada = await peticion(
    'PATCH',
    `/candidatos/${candidato.id}/analisis/${analisisId}/revision`,
    { token: tokenEvaluador, cuerpo: { estado: 'descartado' } },
  );
  assert.equal(anidada.respuesta.status, 200);
  assert.equal(anidada.datos.analisis.estado, 'descartado');
});
