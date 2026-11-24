import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-modulos-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-modulos-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.STORAGE_PROVIDER = 'local';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.EVALUADOR_EMAIL = 'evaluador@modulos.cl';
process.env.EVALUADOR_PASSWORD = 'ClaveEvaluador123!';
process.env.EVALUADOR_NOMBRE = 'Evaluador de Módulos';
process.env.ANALISTA_EMAIL = 'analista@modulos.cl';
process.env.ANALISTA_PASSWORD = 'ClaveAnalista123!';
process.env.ANALISTA_NOMBRE = 'Analista de Módulos';
process.env.GOOGLE_HABILITADO = 'false';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';

const { crearApp } = await import('../src/app.js');
const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion } = await import('../src/services/candidato.service.js');
const { dbCandidatos } = await import('../src/config/baseDatos.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');

await inicializarBaseDatos();

const servidor = await new Promise((resolver) => {
  const instancia = crearApp().listen(0, '127.0.0.1', () => resolver(instancia));
});
const baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;

after(async () => {
  await new Promise((resolver) => servidor.close(resolver));
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

const datosCandidato = (extra = {}) => ({
  nombre: 'Paula Módulos',
  rut: '12.345.678-5',
  correo: 'paula@modulos.cl',
  telefono: '912345678',
  familiaCargo: 'Técnico B/C',
  cargo: 'Monitor Producción',
  formacion: 'Técnico',
  disponibilidad: 'Inmediata',
  aniosExperiencia: 6,
  motivacion: 'Busco aportar en producción.',
  aceptaPrivacidad: true,
  ...extra,
});

const candidato = await crearPostulacion(datosCandidato(), null, 'prueba módulos');
const token = await iniciarSesion('evaluador@modulos.cl', 'ClaveEvaluador123!');

test('catálogos, sesión y perfil responden a los usuarios internos', async () => {
  const publico = await peticion('GET', '/catalogos');
  assert.equal(publico.respuesta.status, 200);
  assert.ok(publico.datos.familiasCargos['Técnico B/C'].includes('Monitor Producción'));

  const cuestionario = await peticion('GET', '/catalogos/evaluacion', { token });
  assert.equal(cuestionario.respuesta.status, 200);
  assert.ok(Array.isArray(cuestionario.datos.preguntas));

  const invalido = await peticion('POST', '/auth/login', {
    cuerpo: { email: 'no-es-correo', password: '123' },
  });
  assert.equal(invalido.respuesta.status, 400);
  assert.equal(invalido.datos.detalle.length, 2);

  const credenciales = await peticion('POST', '/auth/login', {
    cuerpo: { email: 'evaluador@modulos.cl', password: 'incorrecta' },
  });
  assert.equal(credenciales.respuesta.status, 401);

  const perfil = await peticion('GET', '/auth/perfil', { token });
  assert.equal(perfil.respuesta.status, 200);
  assert.equal(perfil.datos.usuario.email, 'evaluador@modulos.cl');

  const inexistente = await peticion('GET', '/ruta-inexistente', { token });
  assert.equal(inexistente.respuesta.status, 404);
});

test('gestiona el ciclo completo de una oferta laboral', async () => {
  const sinToken = await peticion('POST', '/ofertas', {
    cuerpo: { titulo: 'Operador de Planta' },
  });
  assert.equal(sinToken.respuesta.status, 401);

  const invalida = await peticion('POST', '/ofertas', {
    token,
    cuerpo: { titulo: 'Incompleta', cupos: 0 },
  });
  assert.equal(invalida.respuesta.status, 400);
  assert.ok(invalida.datos.detalle.some((item) => item.campo === 'cupos'));

  const creacion = await peticion('POST', '/ofertas', {
    token,
    cuerpo: {
      titulo: 'Operador de Planta',
      descripcion: 'Operación segura de la línea de proceso.',
      ubicacion: 'Puerto Montt',
      categoria: 'Calidad Modular',
      modalidad: 'Presencial',
      cupos: 2,
    },
  });
  assert.equal(creacion.respuesta.status, 201);
  assert.equal(creacion.datos.oferta.estado, 'borrador');
  assert.equal(creacion.datos.oferta.cupos, 2);
  const ofertaId = creacion.datos.oferta.id;

  const privadas = await peticion('GET', '/ofertas', { token });
  assert.equal(privadas.respuesta.status, 200);
  assert.ok(privadas.datos.total >= 1);

  const publicasOcultas = await peticion('GET', '/ofertas/publicas');
  assert.ok(publicasOcultas.datos.total >= 2);

  const oculta = await peticion('GET', `/ofertas/publicas/${ofertaId}`);
  assert.equal(oculta.respuesta.status, 404);

  const publicacion = await peticion('PATCH', `/ofertas/${ofertaId}/estado`, {
    token,
    cuerpo: { estado: 'publicada' },
  });
  assert.equal(publicacion.respuesta.status, 200);
  assert.equal(publicacion.datos.oferta.estado, 'publicada');

  const publicas = await peticion('GET', '/ofertas/publicas?categoria=Calidad%20Modular');
  assert.equal(publicas.datos.total, 1);
  assert.equal(publicas.datos.ofertas[0].id, ofertaId);

  const detalle = await peticion('GET', `/ofertas/publicas/${ofertaId}`);
  assert.equal(detalle.respuesta.status, 200);

  const actualizacion = await peticion('PUT', `/ofertas/${ofertaId}`, {
    token,
    cuerpo: { titulo: 'Operador de Planta Senior' },
  });
  assert.equal(actualizacion.respuesta.status, 200);
  assert.equal(actualizacion.datos.oferta.titulo, 'Operador de Planta Senior');

  const estadoInvalido = await peticion('PATCH', `/ofertas/${ofertaId}/estado`, {
    token,
    cuerpo: { estado: 'inventado' },
  });
  assert.equal(estadoInvalido.respuesta.status, 400);

  const eliminacion = await peticion('DELETE', `/ofertas/${ofertaId}`, { token });
  assert.equal(eliminacion.respuesta.status, 200);
  const segundaEliminacion = await peticion('DELETE', `/ofertas/${ofertaId}`, { token });
  assert.equal(segundaEliminacion.respuesta.status, 404);
});

test('expone asistencia, comparación, historial, informe y exportación de candidatos', async () => {
  const asistencia = await peticion('POST', `/candidatos/${candidato.id}/asistente`, {
    token,
    cuerpo: {},
  });
  assert.equal(asistencia.respuesta.status, 200);
  assert.equal(asistencia.datos.asistencia.requiere_revision_humana, true);
  assert.equal(asistencia.datos.asistencia.sinCv, true);

  await dbCandidatos.actualizar(candidato.id, { afinidadIA: 71 });
  const segundo = await crearPostulacion(
    datosCandidato({ rut: '13.333.333-3', correo: 'segundo@modulos.cl' }),
    null,
    'prueba módulos',
  );
  await dbCandidatos.actualizar(segundo.id, { afinidadIA: 91 });

  const comparacion = await peticion(
    'GET',
    `/candidatos/comparar?cargo=${encodeURIComponent('Monitor Producción')}&candidatoId=${candidato.id}`,
    { token },
  );
  assert.equal(comparacion.respuesta.status, 200);
  assert.equal(comparacion.datos.total, 2);
  assert.equal(comparacion.datos.posicion, 2);
  assert.equal(comparacion.datos.ranking[0].id, segundo.id);

  const sinCargo = await peticion('GET', '/candidatos/comparar', { token });
  assert.equal(sinCargo.respuesta.status, 400);

  const historial = await peticion('GET', `/candidatos/${candidato.id}/historial`, { token });
  assert.equal(historial.respuesta.status, 200);
  assert.ok(historial.datos.total >= 1);

  const informe = await fetch(`${baseUrl}/candidatos/${candidato.id}/informe.pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(informe.status, 200);
  assert.equal(informe.headers.get('content-type'), 'application/pdf');
  assert.ok((await informe.arrayBuffer()).byteLength > 0);

  const csv = await fetch(`${baseUrl}/candidatos/exportar.csv?busqueda=paula`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), /Paula Módulos/);

  const aprobacion = await peticion('PATCH', `/candidatos/${candidato.id}/estado`, {
    token,
    cuerpo: { estado: 'Aprobado', motivo: 'Cumple los requisitos' },
  });
  assert.equal(aprobacion.respuesta.status, 200);
  assert.equal(aprobacion.datos.candidato.estado, 'Aprobado');
});

test('agenda entrevistas locales y las sincroniza sin Google configurado', async () => {
  const invalida = await peticion('POST', '/entrevistas', { token, cuerpo: {} });
  assert.equal(invalida.respuesta.status, 400);
  assert.ok(invalida.datos.detalle.length >= 2);

  const creacion = await peticion('POST', '/entrevistas', {
    token,
    cuerpo: {
      candidatoId: candidato.id,
      fechaInicio: '2026-12-01T10:00:00-03:00',
      lugar: 'Sala 3',
    },
  });
  assert.equal(creacion.respuesta.status, 201);
  assert.equal(creacion.datos.sincronizada, false);
  assert.equal(creacion.datos.entrevista.candidato.id, candidato.id);
  const entrevistaId = creacion.datos.entrevista.id;

  const listado = await peticion(
    'GET',
    `/entrevistas?candidatoId=${candidato.id}&desde=2026-12-01&hasta=2026-12-31`,
    { token },
  );
  assert.equal(listado.respuesta.status, 200);
  assert.equal(listado.datos.total, 1);

  const detalle = await peticion('GET', `/entrevistas/${entrevistaId}`, { token });
  assert.equal(detalle.respuesta.status, 200);

  const actualizacion = await peticion('PATCH', `/entrevistas/${entrevistaId}`, {
    token,
    cuerpo: { notas: 'Llevar prueba técnica', estado: 'realizada' },
  });
  assert.equal(actualizacion.respuesta.status, 200);
  assert.equal(actualizacion.datos.entrevista.notas, 'Llevar prueba técnica');

  const sincronizacion = await peticion('POST', `/entrevistas/${entrevistaId}/sincronizar`, {
    token,
  });
  assert.equal(sincronizacion.respuesta.status, 200);
  assert.equal(sincronizacion.datos.sincronizada, false);

  const eliminacion = await peticion('DELETE', `/entrevistas/${entrevistaId}`, { token });
  assert.equal(eliminacion.respuesta.status, 200);
  const eliminada = await peticion('GET', `/entrevistas/${entrevistaId}`, { token });
  assert.equal(eliminada.respuesta.status, 404);
});

test('informa el estado de Google Calendar y rechaza conexiones sin configuración', async () => {
  const estado = await peticion('GET', '/integraciones/google/estado', { token });
  assert.equal(estado.respuesta.status, 200);
  assert.equal(estado.datos.habilitado, false);
  assert.equal(estado.datos.conectado, false);

  const conectar = await peticion('GET', '/integraciones/google/conectar', { token });
  assert.equal(conectar.respuesta.status, 500);

  const desconectar = await peticion('DELETE', '/integraciones/google', { token });
  assert.equal(desconectar.respuesta.status, 200);

  const sinCodigo = await peticion('GET', '/integraciones/google/callback');
  assert.equal(sinCodigo.respuesta.status, 400);

  const cancelado = await peticion('GET', '/integraciones/google/callback?error=access_denied');
  assert.equal(cancelado.respuesta.status, 400);
});
