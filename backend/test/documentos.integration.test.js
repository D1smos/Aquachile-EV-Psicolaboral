import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-documentos-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-documentos-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.STORAGE_PROVIDER = 'local';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.EVALUADOR_EMAIL = 'evaluador@documentos.cl';
process.env.EVALUADOR_PASSWORD = 'ClaveEvaluador123!';
process.env.EVALUADOR_NOMBRE = 'Evaluador de Documentos';
process.env.ANALISTA_EMAIL = 'analista@documentos.cl';
process.env.ANALISTA_PASSWORD = 'ClaveAnalista123!';
process.env.ANALISTA_NOMBRE = 'Analista de Documentos';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';

const { crearApp } = await import('../src/app.js');
const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion } = await import('../src/services/candidato.service.js');
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

const generarPdf = (texto) =>
  new Promise((resolve, reject) => {
    const documento = new PDFDocument();
    const partes = [];
    documento.on('data', (parte) => partes.push(parte));
    documento.on('end', () => resolve(Buffer.concat(partes)));
    documento.on('error', reject);
    documento.fontSize(12).text(texto);
    documento.end();
  });

const datosCandidato = {
  nombre: 'Carla Documentos',
  rut: '13.333.333-3',
  correo: 'carla@documentos.cl',
  telefono: '933344455',
  familiaCargo: 'Técnico B/C',
  cargo: 'Monitor Producción',
  formacion: 'Técnico',
  disponibilidad: 'Inmediata',
  aniosExperiencia: 2,
  motivacion: 'Postulación de prueba para documentos.',
  aceptaPrivacidad: true,
};

const candidato = await crearPostulacion(datosCandidato, null, 'prueba documentos');

const subir = async (tipo, buffer, nombre, token) => {
  const formulario = new FormData();
  formulario.append('tipo', tipo);
  formulario.append('archivo', new Blob([buffer], { type: 'application/pdf' }), nombre);
  const respuesta = await fetch(`${baseUrl}/candidatos/${candidato.id}/documentos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formulario,
  });
  const datos = respuesta.headers.get('content-type')?.includes('application/json')
    ? await respuesta.json()
    : null;
  return { respuesta, datos };
};

test('sube un CV, extrae texto y metadatos sin exponer el texto en el resumen', async () => {
  const token = await iniciarSesion('evaluador@documentos.cl', 'ClaveEvaluador123!');
  const buffer = await generarPdf(
    'Experiencia de 10 años en producción industrial. Manejo avanzado de Python, SQL y Excel.',
  );
  const { respuesta, datos } = await subir('cv', buffer, 'cv-carla.pdf', token);

  assert.equal(respuesta.status, 201);
  assert.equal(datos.archivo.tipo, 'cv');
  assert.equal(datos.documento.estado, 'ok');
  assert.equal(datos.documento.anosExperiencia, 10);
  assert.ok(datos.documento.palabrasClave.includes('python'));
  assert.equal(datos.documento.texto, undefined);

  const texto = await peticion(
    'GET',
    `/candidatos/${candidato.id}/documentos/${datos.archivo.id}/texto`,
    { token },
  );
  assert.equal(texto.respuesta.status, 200);
  assert.equal(texto.datos.estado, 'ok');
  assert.match(texto.datos.texto, /Python/);
  assert.equal(texto.datos.anosExperiencia, 10);
  assert.ok(texto.datos.palabrasClave.includes('sql'));
});

test('filtra candidatos por experiencia mínima y palabras clave sin incluir el texto', async () => {
  const token = await iniciarSesion('evaluador@documentos.cl', 'ClaveEvaluador123!');
  const filtrado = await peticion(
    'GET',
    '/candidatos?minExperiencia=8&palabrasClave=python',
    { token },
  );
  assert.equal(filtrado.respuesta.status, 200);
  assert.equal(filtrado.datos.total, 1);
  assert.equal(filtrado.datos.candidatos[0].id, candidato.id);
  assert.ok(!JSON.stringify(filtrado.datos.candidatos).includes('Manejo avanzado'));

  const porExperiencia = await peticion('GET', '/candidatos?minExperiencia=99', { token });
  assert.equal(porExperiencia.datos.total, 0);

  const porPalabra = await peticion('GET', '/candidatos?palabrasClave=java', { token });
  assert.equal(porPalabra.datos.total, 0);
});

test('reprocesa un documento y mantiene el texto disponible', async () => {
  const token = await iniciarSesion('evaluador@documentos.cl', 'ClaveEvaluador123!');
  const listado = await peticion('GET', '/candidatos', { token });
  const archivo = listado.datos.candidatos[0].archivos.find((item) => item.tipo === 'cv');
  const { respuesta, datos } = await peticion(
    'POST',
    `/candidatos/${candidato.id}/documentos/${archivo.id}/reprocesar`,
    { token },
  );
  assert.equal(respuesta.status, 200);
  assert.equal(datos.documento.estado, 'ok');
  assert.equal(datos.documento.anosExperiencia, 10);
});

test('el analista no puede subir ni eliminar documentos', async () => {
  const token = await iniciarSesion('analista@documentos.cl', 'ClaveAnalista123!');
  const buffer = await generarPdf('Documento interno sin permisos de analista.');
  const subida = await subir('informe', buffer, 'informe.pdf', token);
  assert.equal(subida.respuesta.status, 403);

  const listado = await peticion('GET', '/candidatos', { token });
  const archivo = listado.datos.candidatos[0].archivos[0];
  const eliminacion = await peticion(
    'DELETE',
    `/candidatos/${candidato.id}/documentos/${archivo.id}`,
    { token },
  );
  assert.equal(eliminacion.respuesta.status, 403);
});

test('elimina el documento y su texto', async () => {
  const token = await iniciarSesion('evaluador@documentos.cl', 'ClaveEvaluador123!');
  const listado = await peticion('GET', '/candidatos', { token });
  const archivo = listado.datos.candidatos[0].archivos[0];
  const eliminacion = await peticion(
    'DELETE',
    `/candidatos/${candidato.id}/documentos/${archivo.id}`,
    { token },
  );
  assert.equal(eliminacion.respuesta.status, 200);

  const texto = await peticion(
    'GET',
    `/candidatos/${candidato.id}/documentos/${archivo.id}/texto`,
    { token },
  );
  assert.equal(texto.respuesta.status, 404);

  const ficha = await peticion('GET', `/candidatos/${candidato.id}`, { token });
  assert.equal(ficha.datos.candidato.archivos.length, 0);
});
