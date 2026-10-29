import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-api-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-integracion-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.EVALUADOR_EMAIL = 'evaluador@prueba.cl';
process.env.EVALUADOR_PASSWORD = 'ClaveEvaluador123!';
process.env.EVALUADOR_NOMBRE = 'Evaluador de Prueba';
process.env.ANALISTA_EMAIL = 'analista@prueba.cl';
process.env.ANALISTA_PASSWORD = 'ClaveAnalista123!';
process.env.ANALISTA_NOMBRE = 'Analista de Prueba';
process.env.SMTP_HOST = '';

const { crearApp } = await import('../src/app.js');
const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion } = await import('../src/services/candidato.service.js');

await inicializarBaseDatos();

const servidor = await new Promise((resolver) => {
  const instancia = crearApp().listen(0, '127.0.0.1', () => resolver(instancia));
});
const baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;

after(async () => {
  await new Promise((resolver) => servidor.close(resolver));
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

const datosCandidato = (extra = {}) => ({
  nombre: 'Ana Pérez',
  rut: '12.345.678-5',
  correo: 'ana@example.com',
  telefono: '912345678',
  familiaCargo: 'Técnico B/C',
  cargo: 'Monitor Producción',
  formacion: 'Técnico',
  disponibilidad: 'Inmediata',
  aniosExperiencia: 4,
  motivacion: 'Busco desarrollarme en producción.',
  aceptaPrivacidad: true,
  ...extra,
});

const candidato = await crearPostulacion(datosCandidato(), null, 'prueba de integración');

test('la postulación pública registra el consentimiento', () => {
  assert.equal(candidato.consentimiento, true);
  assert.ok(candidato.fechaConsentimiento);
});

test('permisos de candidatos y consulta pública', async (t) => {
  const tokenEvaluador = await iniciarSesion('evaluador@prueba.cl', 'ClaveEvaluador123!');
  const tokenAnalista = await iniciarSesion('analista@prueba.cl', 'ClaveAnalista123!');

  await t.test('el analista puede ver y exportar, pero no editar ni eliminar', async () => {
    const listado = await peticion('GET', '/candidatos', { token: tokenAnalista });
    assert.equal(listado.respuesta.status, 200);
    assert.equal(listado.datos.total, 1);

    const exportacion = await fetch(`${baseUrl}/candidatos/exportar.csv`, {
      headers: { Authorization: `Bearer ${tokenAnalista}` },
    });
    assert.equal(exportacion.status, 200);

    const edicion = await peticion('PUT', `/candidatos/${candidato.id}`, {
      token: tokenAnalista,
      cuerpo: datosCandidato(),
    });
    assert.equal(edicion.respuesta.status, 403);

    const cambioEstado = await peticion('PATCH', `/candidatos/${candidato.id}/estado`, {
      token: tokenAnalista,
      cuerpo: { estado: 'Aprobado' },
    });
    assert.equal(cambioEstado.respuesta.status, 403);

    const eliminacion = await peticion('DELETE', `/candidatos/${candidato.id}`, {
      token: tokenAnalista,
    });
    assert.equal(eliminacion.respuesta.status, 403);
  });

  await t.test('el evaluador conserva la edición, el cambio de estado y el borrado', async () => {
    const edicion = await peticion('PUT', `/candidatos/${candidato.id}`, {
      token: tokenEvaluador,
      cuerpo: datosCandidato({ telefono: '923456789' }),
    });
    assert.equal(edicion.respuesta.status, 200);
    assert.equal(edicion.datos.candidato.telefono, '923456789');

    const cambioEstado = await peticion('PATCH', `/candidatos/${candidato.id}/estado`, {
      token: tokenEvaluador,
      cuerpo: { estado: 'En Proceso' },
    });
    assert.equal(cambioEstado.respuesta.status, 200);
    assert.equal(cambioEstado.datos.candidato.estado, 'En Proceso');

    const segundo = await crearPostulacion(
      datosCandidato({ rut: '11.111.111-1', correo: 'borrar@example.com' }),
      null,
      'prueba de integración',
    );
    const eliminacion = await peticion('DELETE', `/candidatos/${segundo.id}`, {
      token: tokenEvaluador,
    });
    assert.equal(eliminacion.respuesta.status, 200);
    const consulta = await peticion('GET', `/candidatos/${segundo.id}`, { token: tokenEvaluador });
    assert.equal(consulta.respuesta.status, 404);
  });

  await t.test('la consulta pública exige folio y RUT correctos y devuelve datos mínimos', async () => {
    const correcta = await peticion('POST', '/postulaciones/consulta', {
      cuerpo: { folio: candidato.folio.toLowerCase(), rut: '12.345.678-5' },
    });
    assert.equal(correcta.respuesta.status, 200);
    assert.equal(correcta.datos.candidato.folio, candidato.folio);
    assert.equal(correcta.datos.candidato.estado, 'En Proceso');
    assert.equal(correcta.datos.candidato.correo, undefined);
    assert.equal(correcta.datos.candidato.telefono, undefined);
    assert.equal(correcta.datos.candidato.rut, undefined);
    assert.equal(correcta.datos.candidato.id, undefined);

    const rutIncorrecto = await peticion('POST', '/postulaciones/consulta', {
      cuerpo: { folio: candidato.folio, rut: '11.111.111-1' },
    });
    assert.equal(rutIncorrecto.respuesta.status, 404);

    const folioInexistente = await peticion('POST', '/postulaciones/consulta', {
      cuerpo: { folio: 'AQ-2026-FFFFFFFF', rut: '12.345.678-5' },
    });
    assert.equal(folioInexistente.respuesta.status, 404);
    assert.equal(folioInexistente.datos.mensaje, rutIncorrecto.datos.mensaje);

    const invalida = await peticion('POST', '/postulaciones/consulta', {
      cuerpo: { folio: '123', rut: '1' },
    });
    assert.equal(invalida.respuesta.status, 400);
  });

  await t.test('un duplicado no revela el folio existente', async () => {
    await assert.rejects(
      crearPostulacion(datosCandidato(), null, 'postulación pública'),
      (error) => {
        assert.equal(error.codigo, 409);
        assert.ok(!error.message.includes(candidato.folio));
        return true;
      },
    );
  });
});
