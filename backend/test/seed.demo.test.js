import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-seed-demo-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-seed-demo-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'true';
process.env.STORAGE_PROVIDER = 'local';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.EVALUADOR_EMAIL = 'evaluador@demo.cl';
process.env.EVALUADOR_PASSWORD = 'ClaveEvaluador123!';
process.env.EVALUADOR_NOMBRE = 'Evaluador Demo';
process.env.ANALISTA_EMAIL = 'analista@demo.cl';
process.env.ANALISTA_PASSWORD = 'ClaveAnalista123!';
process.env.ANALISTA_NOMBRE = 'Analista Demo';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';

const { inicializarBaseDatos, reiniciarDemo, RONDAS_DEMO } = await import(
  '../src/services/seed.service.js'
);
const { buscarPorEmail } = await import('../src/services/auth.service.js');
const { dbCandidatos, dbHistorial, dbOfertas } = await import('../src/config/baseDatos.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');

after(async () => {
  cerrarBaseDatos();
  await rm(directorioPrueba, { recursive: true, force: true });
});

await inicializarBaseDatos();

test('inicializa las cuentas internas y el lote demostrativo una sola vez', async () => {
  assert.ok(await buscarPorEmail('evaluador@demo.cl'));
  assert.ok(await buscarPorEmail('analista@demo.cl'));
  assert.equal(await dbCandidatos.contar(), RONDAS_DEMO.length);
  assert.equal(await dbOfertas.contar(), 2);

  await inicializarBaseDatos();
  assert.equal(await dbCandidatos.contar(), RONDAS_DEMO.length);
});

test('el lote demo registra historial y evaluaciones cuando hay respuestas', async () => {
  const candidatos = await dbCandidatos.listarTodos();
  const evaluado = candidatos.find((candidato) => candidato.puntaje !== null);
  assert.ok(evaluado);
  assert.ok(evaluado.idoneidad);
  assert.ok(Array.isArray(evaluado.dimensiones));
  assert.ok(evaluado.fechaEvaluacion);

  const sinEvaluar = candidatos.find((candidato) => candidato.puntaje === null);
  assert.ok(sinEvaluar);
  assert.equal(sinEvaluar.observaciones, null);

  const historial = await dbHistorial.listarPorCandidato(candidatos[0].id);
  assert.ok(historial.length >= 1);
  assert.equal(historial[0].motivo, 'Registro inicial del candidato');
});

test('reiniciarDemo reemplaza los candidatos conservando las cuentas internas', async () => {
  const antes = await dbCandidatos.listarTodos();
  await dbCandidatos.actualizar(antes[0].id, { nombre: 'Nombre temporal' });

  const resultado = await reiniciarDemo();
  assert.equal(resultado.length, RONDAS_DEMO.length);
  assert.ok(!resultado.some((candidato) => candidato.nombre === 'Nombre temporal'));
  assert.equal(await dbCandidatos.contar(), RONDAS_DEMO.length);
  assert.ok(await buscarPorEmail('evaluador@demo.cl'));
  assert.ok(await buscarPorEmail('analista@demo.cl'));
});
