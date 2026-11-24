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
const { crearPostulacion, localizarArchivo } = await import('../src/services/candidato.service.js');
const { filtrarParaExportar, generarCsv } = await import('../src/services/exportacion.service.js');
const { validarEstado, validarEvaluacion } = await import('../src/validators/evaluacion.validator.js');
const { CUESTIONARIO } = await import('../src/domain/cuestionario.js');
const { descartarArchivos } = await import('../src/utils/archivos.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');

await inicializarBaseDatos();

const servidor = await new Promise((resolver) => {
  const instancia = crearApp().listen(0, '127.0.0.1', () => resolver(instancia));
});
const baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;
const raizUrl = `http://127.0.0.1:${servidor.address().port}`;

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

test('la especificación OpenAPI está disponible en JSON y documenta las rutas principales', async () => {
  const respuesta = await fetch(`${raizUrl}/api-docs.json`);
  assert.equal(respuesta.status, 200);
  const documento = await respuesta.json();
  assert.equal(documento.openapi, '3.0.3');
  assert.ok(documento.components.securitySchemes.bearerAuth);
  assert.ok(documento.paths['/postulaciones'].post);
  assert.ok(documento.paths['/ofertas/publicas'].get);
  assert.ok(documento.paths['/candidatos/{id}/cv'].get);
});

test('la API normaliza errores de ruta y JSON malformado', async () => {
  const desconocida = await fetch(`${raizUrl}/api/no-existe`);
  assert.equal(desconocida.status, 404);
  const jsonMalo = await fetch(`${baseUrl}/postulaciones/consulta`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{mal json',
  });
  assert.equal(jsonMalo.status, 400);
  assert.equal((await jsonMalo.json()).ok, false);
});

test('publica catálogo y protege cuestionario con opciones y dimensiones', async () => {
  const catalogo = await fetch(`${baseUrl}/catalogos`);
  assert.equal(catalogo.status, 200);
  assert.ok((await catalogo.json()).familiasCargos);
  const token = await iniciarSesion('evaluador@prueba.cl', 'ClaveEvaluador123!');
  const cuestionario = await fetch(`${baseUrl}/catalogos/evaluacion`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(cuestionario.status, 200);
  const datos = await cuestionario.json();
  assert.ok(datos.dimensiones.length > 0);
  assert.ok(datos.preguntas.length > 0);
  assert.equal(datos.opciones.length, 5);
});

test('el descarte de archivos admite campos vacíos y faltantes', async () => {
  await descartarArchivos();
  await descartarArchivos({ vacio: [null, {}], inexistente: [{ path: path.join(directorioPrueba, 'no-existe') }] });
});

test('ofertas públicas se filtran y el CRUD requiere rol evaluador', async () => {
  const publicas = await peticion('GET', '/ofertas/publicas');
  assert.equal(publicas.respuesta.status, 200);
  assert.ok(publicas.datos.ofertas.length >= 1);
  assert.ok(publicas.datos.ofertas.every((oferta) => oferta.estado === 'publicada'));

  const sinToken = await peticion('POST', '/ofertas', { cuerpo: { titulo: 'Oferta prueba' } });
  assert.equal(sinToken.respuesta.status, 401);
  const tokenAnalista = await iniciarSesion('analista@prueba.cl', 'ClaveAnalista123!');
  const denegada = await peticion('POST', '/ofertas', { token: tokenAnalista, cuerpo: { titulo: 'Oferta prueba' } });
  assert.equal(denegada.respuesta.status, 403);

  const tokenEvaluador = await iniciarSesion('evaluador@prueba.cl', 'ClaveEvaluador123!');
  const nueva = await peticion('POST', '/ofertas', {
    token: tokenEvaluador,
    cuerpo: { titulo: 'Técnico de Calidad', descripcion: 'Control de procesos.', ubicacion: 'Puerto Montt', familiaCargo: 'Técnico', categoria: 'Operaciones', modalidad: 'Presencial', fechaPublicacion: '2026-11-23', cupos: 1, funciones: 'Controlar procesos.', requisitos: 'Experiencia en calidad', beneficios: 'Seguro médico', sueldo: 'A convenir', estado: 'publicada' },
  });
  assert.equal(nueva.respuesta.status, 201);
  const detalle = await peticion('GET', `/ofertas/publicas/${nueva.datos.oferta.id}`);
  assert.equal(detalle.respuesta.status, 200);
  const invalida = await peticion('POST', '/ofertas', { token: tokenEvaluador, cuerpo: {} });
  assert.equal(invalida.respuesta.status, 400);
  const filtros = await peticion('GET', '/ofertas/publicas?categoria=Operaciones&modalidad=Presencial&q=Calidad');
  assert.ok(filtros.datos.ofertas.some((oferta) => oferta.id === nueva.datos.oferta.id));
  const filtradas = await peticion('GET', '/ofertas/publicas?ubicacion=Puerto%20Montt');
  assert.ok(filtradas.datos.ofertas.some((oferta) => oferta.id === nueva.datos.oferta.id));
  const actualizada = await peticion('PUT', `/ofertas/${nueva.datos.oferta.id}`, { token: tokenEvaluador, cuerpo: { estado: 'cerrada' } });
  assert.equal(actualizada.respuesta.status, 200);
  const eliminada = await peticion('DELETE', `/ofertas/${nueva.datos.oferta.id}`, { token: tokenEvaluador });
  assert.equal(eliminada.respuesta.status, 200);
});

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

test('exportación CSV filtra sin acentos y escapa campos con delimitadores', () => {
  const filas = [
    { folio: 'F1', nombre: 'José; "Pepe"', rut: '1', correo: 'j@x.cl', cargo: 'Operador', estado: 'Pendiente', fechaPostulacion: '2026-01-02' },
    { folio: 'F2', nombre: 'Ana', rut: '2', correo: 'a@x.cl', cargo: 'Técnico', estado: 'Aprobado', fechaPostulacion: '2026-04-02' },
  ];
  assert.equal(filtrarParaExportar(filas, { busqueda: 'jose', estado: 'Pendiente', cargo: 'Operador', desde: '2026-01-01', hasta: '2026-01-31' }).length, 1);
  assert.equal(filtrarParaExportar(filas, { desde: '2026-02-01' }).length, 1);
  assert.equal(filtrarParaExportar(filas, { hasta: '2026-03-31' }).length, 1);
  const csv = generarCsv(filas);
  assert.ok(csv.startsWith('\uFEFFfolio;nombre;'));
  assert.ok(csv.includes('"José; ""Pepe"""'));
  assert.ok(csv.endsWith('\n'));
});

test('validador de evaluación contempla estados y respuestas válidas e inválidas', () => {
  assert.deepEqual(validarEstado('Estado desconocido').length, 1);
  assert.deepEqual(validarEstado('Aprobado'), []);
  assert.ok(validarEvaluacion({}).length > 0);
  const respuestas = Object.fromEntries(CUESTIONARIO.preguntas.map((pregunta) => [pregunta.id, 4]));
  assert.deepEqual(validarEvaluacion({ respuestas }), []);
  assert.ok(validarEvaluacion({ respuestas: { ...respuestas, p1: 8 }, observaciones: 'x'.repeat(1001), estado: 'Mal' }).length > 0);
});

const candidato = await crearPostulacion(datosCandidato(), null, 'prueba de integración');

test('valida y registra una evaluación psicolaboral completa', async () => {
  const token = await iniciarSesion('evaluador@prueba.cl', 'ClaveEvaluador123!');
  const invalida = await peticion('POST', `/candidatos/${candidato.id}/evaluacion`, { token, cuerpo: {} });
  assert.equal(invalida.respuesta.status, 400);
  const respuestas = Object.fromEntries(CUESTIONARIO.preguntas.map((pregunta) => [pregunta.id, 5]));
  const guardada = await peticion('POST', `/candidatos/${candidato.id}/evaluacion`, {
    token, cuerpo: { respuestas, observaciones: 'Experiencia consistente', estado: 'Aprobado' },
  });
  assert.equal(guardada.respuesta.status, 200);
  assert.equal(guardada.datos.candidato.estado, 'Aprobado');
  assert.equal(guardada.datos.candidato.puntaje, 100);
});

test('la postulación pública registra el consentimiento', () => {
  assert.equal(candidato.consentimiento, true);
  assert.ok(candidato.fechaConsentimiento);
});

test('la asistencia conserva auditoría humana y las descargas CV están protegidas', async () => {
  const token = await iniciarSesion('evaluador@prueba.cl', 'ClaveEvaluador123!');
  const sinToken = await peticion('GET', `/candidatos/${candidato.id}/cv`);
  assert.equal(sinToken.respuesta.status, 401);
  const cvInexistente = await peticion('GET', `/candidatos/${candidato.id}/cv`, { token });
  assert.equal(cvInexistente.respuesta.status, 404);
  const asistencia = await peticion('POST', `/candidatos/${candidato.id}/asistente`, { token });
  assert.equal(asistencia.respuesta.status, 200);
  assert.ok(Array.isArray(asistencia.datos.asistencia.criterios_usados));
  assert.equal(typeof asistencia.datos.asistencia.limitaciones, 'string');
  assert.equal(asistencia.datos.asistencia.requiere_revision_humana, true);
  const informe = await fetch(`${baseUrl}/candidatos/${candidato.id}/informe.pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(informe.status, 200);
  assert.match(informe.headers.get('content-type'), /application\/pdf/);
  assert.ok((await informe.arrayBuffer()).byteLength > 100);
});

test('la localización de archivos rechaza rutas fuera de uploads y archivos ausentes', () => {
  assert.throws(
    () => localizarArchivo({ archivos: [{ id: 'malicioso', ruta: '../secreto.env' }] }, 'malicioso'),
    (error) => error.codigo === 400,
  );
  assert.throws(() => localizarArchivo({ archivos: [] }, 'ausente'), (error) => error.codigo === 404);
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

test('una postulación pública aparece en el panel del evaluador', async () => {
  const formulario = new FormData();
  const datos = datosCandidato({ rut: '22.222.222-2', correo: 'http@example.com' });
  Object.entries(datos).forEach(([campo, valor]) => formulario.append(campo, String(valor)));
  formulario.append(
    'cv',
    new Blob(['%PDF-1.4 postulación de prueba'], { type: 'application/pdf' }),
    'cv-postulacion.pdf',
  );

  const creacion = await fetch(`${baseUrl}/postulaciones`, {
    method: 'POST',
    body: formulario,
  });
  const creada = await creacion.json();
  assert.equal(creacion.status, 201);
  assert.ok(creada.candidato.folio);

  const tokenEvaluador = await iniciarSesion('evaluador@prueba.cl', 'ClaveEvaluador123!');
  const listado = await peticion('GET', '/candidatos', { token: tokenEvaluador });
  assert.equal(listado.respuesta.status, 200);
  const registro = listado.datos.candidatos.find(
    (candidatoListado) => candidatoListado.folio === creada.candidato.folio,
  );
  assert.ok(registro, 'La postulación pública debe aparecer en el listado del evaluador');
  assert.equal(registro.archivos.length, 1);
  assert.equal(registro.archivos[0].tipo, 'cv');
  assert.equal(registro.archivos[0].nombreOriginal, 'cv-postulacion.pdf');
  assert.match(registro.archivos[0].ruta, /^postulantes[\\/]/);

  const noAutorizada = await fetch(`${baseUrl}/candidatos/${registro.id}/cv`);
  assert.equal(noAutorizada.status, 401);

  const descarga = await fetch(
    `${baseUrl}/candidatos/${registro.id}/archivos/${registro.archivos[0].id}`,
    { headers: { Authorization: `Bearer ${tokenEvaluador}` } },
  );
  assert.equal(descarga.status, 200);
  const descargaCv = await fetch(`${baseUrl}/candidatos/${registro.id}/cv`, {
    headers: { Authorization: `Bearer ${tokenEvaluador}` },
  });
  assert.equal(descargaCv.status, 200);
  assert.equal(await descarga.text(), '%PDF-1.4 postulación de prueba');
});
