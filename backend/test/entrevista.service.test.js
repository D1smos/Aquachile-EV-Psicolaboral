import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-agenda-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-agenda-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.GOOGLE_HABILITADO = 'false';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';
process.env.RESEND_ENCARGADO_EMAIL = 'evaluador@aquachile.cl';

const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion } = await import('../src/services/candidato.service.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');
const {
  actualizarEntrevista,
  crearEntrevista,
  eliminarEntrevista,
  listarEntrevistas,
  sincronizarEntrevista,
} = await import('../src/services/entrevista.service.js');

await inicializarBaseDatos();

after(async () => {
  cerrarBaseDatos();
  await rm(directorioPrueba, { recursive: true, force: true });
});

const RUTS = {
  2: '12.345.678-5',
  3: '13.333.333-3',
  4: '14.444.444-4',
  5: '15.555.555-6',
  6: '16.666.666-k',
};

const crearCandidato = async (indice) =>
  crearPostulacion(
    {
      nombre: `Candidato Agenda ${indice}`,
      rut: RUTS[indice],
      correo: `agenda${indice}@prueba.cl`,
      telefono: '955112233',
      familiaCargo: 'Técnico B/C',
      cargo: 'Monitor Producción',
      formacion: 'Técnico',
      disponibilidad: 'Inmediata',
      aniosExperiencia: 4,
      motivacion: 'Coordinar una entrevista.',
      aceptaPrivacidad: true,
    },
    null,
    'prueba agenda',
  );

test('crea la entrevista local con título por defecto y duración de una hora', async () => {
  const candidato = await crearCandidato(2);
  const resultado = await crearEntrevista(
    {
      candidatoId: candidato.id,
      fechaInicio: '2026-12-01T10:00:00-03:00',
    },
    { usuarioEmail: 'evaluador@aquachile.cl' },
  );

  assert.equal(resultado.sincronizada, false);
  assert.equal(resultado.entrevista.estado, 'programada');
  assert.equal(resultado.entrevista.estadoSync, 'pendiente');
  assert.match(resultado.entrevista.titulo, /Candidato Agenda 2/);
  assert.equal(resultado.entrevista.candidatoNombre, 'Candidato Agenda 2');
  const inicio = new Date(resultado.entrevista.fechaInicio);
  const fin = new Date(resultado.entrevista.fechaFin);
  assert.equal(fin.getTime() - inicio.getTime(), 60 * 60 * 1000);
});

test('lista y filtra entrevistas por candidato y rango', async () => {
  const candidato = await crearCandidato(3);
  await crearEntrevista(
    {
      candidatoId: candidato.id,
      fechaInicio: '2026-12-05T09:00:00-03:00',
      fechaFin: '2026-12-05T10:00:00-03:00',
      lugar: 'Sala 2',
    },
    { usuarioEmail: 'evaluador@aquachile.cl' },
  );

  const todas = await listarEntrevistas({});
  assert.ok(todas.length >= 1);
  const filtradas = await listarEntrevistas({
    candidatoId: candidato.id,
    desde: '2026-12-01T00:00:00.000Z',
    hasta: '2026-12-31T23:59:59.999Z',
  });
  assert.equal(filtradas.length, 1);
  assert.equal(filtradas[0].lugar, 'Sala 2');
  assert.equal(filtradas[0].candidato.id, candidato.id);
});

test('actualiza la entrevista y elimina el registro local', async () => {
  const candidato = await crearCandidato(4);
  const { entrevista } = await crearEntrevista(
    {
      candidatoId: candidato.id,
      fechaInicio: '2026-12-10T11:00:00-03:00',
    },
    { usuarioEmail: 'evaluador@aquachile.cl' },
  );

  const resultado = await actualizarEntrevista(entrevista.id, {
    notas: 'Llevar prueba técnica',
    estado: 'realizada',
  });
  assert.equal(resultado.entrevista.notas, 'Llevar prueba técnica');
  assert.equal(resultado.entrevista.estado, 'realizada');

  const borrado = await eliminarEntrevista(entrevista.id);
  assert.equal(borrado.eliminada, true);
  assert.equal(await listarEntrevistas({ candidatoId: candidato.id }).then((f) => f.length), 0);
});

test('sin Google habilitado la sincronización mantiene el evento pendiente sin error', async () => {
  const candidato = await crearCandidato(5);
  const { entrevista } = await crearEntrevista(
    {
      candidatoId: candidato.id,
      fechaInicio: '2026-12-15T08:00:00-03:00',
    },
    { usuarioEmail: 'evaluador@aquachile.cl' },
  );
  const resultado = await sincronizarEntrevista(entrevista.id);
  assert.equal(resultado.sincronizada, false);
  assert.equal(resultado.entrevista.estadoSync, 'pendiente');
  assert.equal(resultado.entrevista.errorSync, null);
});

test('rechaza fechas inválidas o un término anterior al inicio', async () => {
  const candidato = await crearCandidato(6);
  await assert.rejects(
    () => crearEntrevista({ candidatoId: candidato.id, fechaInicio: 'no-es-fecha' }),
    (error) => error.codigo === 400,
  );
  await assert.rejects(
    () =>
      crearEntrevista({
        candidatoId: candidato.id,
        fechaInicio: '2026-12-20T10:00:00-03:00',
        fechaFin: '2026-12-20T09:00:00-03:00',
      }),
    (error) => error.codigo === 400,
  );
});
