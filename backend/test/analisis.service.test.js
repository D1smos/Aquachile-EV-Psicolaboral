import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-analisis-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-analisis-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.IA_HABILITADA = 'true';
process.env.LLM_API_KEY = 'clave-de-prueba';
process.env.LLM_MODEL = 'google/gemini-2.0-flash-exp:free';
process.env.LLM_FALLBACK_MODELS = 'meta-llama/llama-3.3-70b-instruct:free';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';

const { dbArchivos, dbDocumentosTexto, dbAnalisisIA } = await import('../src/config/baseDatos.js');
const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion } = await import('../src/services/candidato.service.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');
const { generarAnalisis, revisarAnalisis } = await import('../src/services/ia/analisis.service.js');
const { consultarOpenRouter } = await import('../src/services/ia/proveedor.js');

await inicializarBaseDatos();

after(async () => {
  cerrarBaseDatos();
  await rm(directorioPrueba, { recursive: true, force: true });
});

const analisisMock = (extra = {}) => ({
  version: '1.0',
  resumen: 'Experiencia compatible con el cargo y con evidencia suficiente en el currículum.',
  anosExperienciaEstimados: 8,
  palabrasClaveDetectadas: ['python', 'sql', 'produccion'],
  afinidad: { score: 82, nivel: 'alto', justificacion: 'Cumple los requisitos principales.' },
  fortalezas: [{ titulo: 'Experiencia', evidencia: 'Ocho años en planta', documento: 'cv.pdf' }],
  brechas: [{ titulo: 'Inglés', evidencia: 'No declarado', documento: 'cv.pdf' }],
  competencias: [
    {
      id: 'produccion',
      nombre: 'Gestión de producción',
      nivel: 4,
      evidencia: ['Turnos y metas'],
      confianza: 0.9,
    },
  ],
  preguntasEntrevista: [
    { pregunta: '¿Cómo gestionó turnos?', objetivo: 'Validar experiencia', competenciaId: 'produccion' },
  ],
  recomendacion: { codigo: 'avanzar', texto: 'Continuar con entrevista.' },
  confianza: 0.86,
  advertencias: [],
  ...extra,
});

const crearCandidatoConCv = async ({ correo, rut, conTexto = true }) => {
  const candidato = await crearPostulacion(
    {
      nombre: 'Candidato Análisis',
      rut,
      correo,
      telefono: '944455566',
      familiaCargo: 'Técnico B/C',
      cargo: 'Monitor Producción',
      formacion: 'Técnico',
      disponibilidad: 'Inmediata',
      aniosExperiencia: 3,
      motivacion: 'Prueba de análisis con IA.',
      aceptaPrivacidad: true,
    },
    null,
    'prueba análisis',
  );
  const archivo = {
    id: crypto.randomUUID(),
    tipo: 'cv',
    nombreOriginal: 'cv.pdf',
    nombreAlmacenado: 'cv.pdf',
    ruta: 'documentos/cv/cv.pdf',
    mimetype: 'application/pdf',
    tamano: 120,
    storageKey: 'documentos/cv/cv.pdf',
    proveedor: 'local',
    bucket: null,
    hash: `hash-${candidato.id}`,
    creadoEn: new Date().toISOString(),
  };
  await dbArchivos.insertar(candidato.id, archivo);
  if (conTexto) {
    await dbDocumentosTexto.guardar({
      archivoId: archivo.id,
      texto: 'Ocho años de experiencia en producción, manejo de Python y SQL.',
      textoHash: `texto-${candidato.id}`,
      paginas: 1,
      caracteres: 71,
      anosExperiencia: 0,
      palabrasClave: [],
      estado: 'ok',
      modeloExtraccion: 'prueba',
    });
  }
  return { candidato, archivo };
};

test('genera, cachea, enriquece el CV y permite revisar el análisis', async () => {
  const { candidato, archivo } = await crearCandidatoConCv({
    correo: 'analisis@prueba.cl',
    rut: '13.333.333-3',
  });
  let llamadas = 0;
  const proveedor = async () => {
    llamadas += 1;
    return {
      json: analisisMock({ resumen: `Análisis generado en la llamada ${llamadas}.` }),
      tokensEntrada: 120,
      tokensSalida: 80,
    };
  };

  const primero = await generarAnalisis(candidato.id, {
    generadoPor: 'evaluador@prueba.cl',
    proveedor,
  });
  assert.equal(primero.cacheHit, false);
  assert.equal(primero.analisis.estado, 'borrador');
  assert.equal(primero.analisis.modelo, process.env.LLM_MODEL);
  assert.equal(primero.analisis.tokensEntrada, 120);
  assert.equal(primero.documento.anosExperiencia, 8);
  assert.deepEqual(primero.documento.palabrasClave, ['python', 'sql', 'produccion']);
  assert.equal(llamadas, 1);

  const segundo = await generarAnalisis(candidato.id, { proveedor });
  assert.equal(segundo.cacheHit, true);
  assert.equal(segundo.analisis.id, primero.analisis.id);
  assert.equal(llamadas, 1);

  const forzado = await generarAnalisis(candidato.id, { forzar: true, proveedor });
  assert.equal(forzado.cacheHit, false);
  assert.equal(forzado.analisis.id, primero.analisis.id);
  assert.equal(llamadas, 2);
  assert.equal((await dbAnalisisIA.listarPorCandidato(candidato.id)).length, 1);

  const revisado = await revisarAnalisis(forzado.analisis.id, {
    estado: 'revisado',
    revisadoPor: 'evaluador@prueba.cl',
    comentario: 'Revisado en prueba',
  });
  assert.equal(revisado.analisis.estado, 'revisado');
  assert.equal(revisado.analisis.revisadoPor, 'evaluador@prueba.cl');
  assert.equal(revisado.comentario, 'Revisado en prueba');

  const cacheTrasRevision = await generarAnalisis(candidato.id, { proveedor });
  assert.equal(cacheTrasRevision.cacheHit, true);
  assert.equal(cacheTrasRevision.analisis.estado, 'revisado');
  assert.ok(archivo.id);
});

test('sin texto utilizable devuelve 422 y no llama al proveedor', async () => {
  const { candidato } = await crearCandidatoConCv({
    correo: 'sintexto@prueba.cl',
    rut: '14.444.444-4',
    conTexto: false,
  });
  let llamadas = 0;
  await assert.rejects(
    () =>
      generarAnalisis(candidato.id, {
        proveedor: async () => {
          llamadas += 1;
          return { json: analisisMock() };
        },
      }),
    (error) => error.codigo === 422,
  );
  assert.equal(llamadas, 0);
});

test('el proveedor usa el modelo de respaldo ante 429 y omite provider en modelos free', async () => {
  const cuerpos = [];
  const fetchMock = async (url, opciones) => {
    const cuerpo = JSON.parse(opciones.body);
    cuerpos.push(cuerpo);
    if (cuerpo.model === process.env.LLM_MODEL) {
      return new Response('', { status: 429 });
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(analisisMock()) } }],
        usage: { prompt_tokens: 5, completion_tokens: 7 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  const resultado = await consultarOpenRouter({
    prompt: { sistema: 'sistema', usuario: 'usuario' },
    fetchImpl: fetchMock,
  });
  assert.equal(resultado.modelo, 'meta-llama/llama-3.3-70b-instruct:free');
  assert.equal(cuerpos.length, 3);
  assert.equal(cuerpos[0].provider, undefined);
  assert.deepEqual(cuerpos[0].response_format, { type: 'json_object' });
  assert.equal(resultado.tokensEntrada, 5);
  assert.equal(resultado.tokensSalida, 7);
});

test('reintenta sin response_format cuando el modelo free responde 400', async () => {
  let intentos = 0;
  const cuerpos = [];
  const fetchMock = async (url, opciones) => {
    const cuerpo = JSON.parse(opciones.body);
    cuerpos.push(cuerpo);
    intentos += 1;
    if (intentos === 1) {
      return new Response('', { status: 400 });
    }
    return new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify(analisisMock()) } }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };

  await consultarOpenRouter({
    prompt: { sistema: 'sistema', usuario: 'usuario' },
    fetchImpl: fetchMock,
  });
  assert.equal(cuerpos[0].response_format.type, 'json_object');
  assert.equal(cuerpos[1].response_format, undefined);
  assert.equal(cuerpos[1].model, process.env.LLM_MODEL);
});
