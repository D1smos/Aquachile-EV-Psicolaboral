import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-exportacion-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-exportacion-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.STORAGE_PROVIDER = 'local';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.EVALUADOR_EMAIL = 'evaluador@exportacion.cl';
process.env.EVALUADOR_PASSWORD = 'ClaveEvaluador123!';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';

const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion, guardarAsistencia } = await import('../src/services/candidato.service.js');
const { dbCandidatos, dbHistorial } = await import('../src/config/baseDatos.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');
const { filtrarParaExportar, generarCsv, generarInformePdf } = await import(
  '../src/services/exportacion.service.js'
);

await inicializarBaseDatos();

after(async () => {
  cerrarBaseDatos();
  await rm(directorioPrueba, { recursive: true, force: true });
});

const crear = (extra = {}) =>
  crearPostulacion(
    {
      nombre: 'Elena Exportación',
      rut: '12.345.678-5',
      correo: 'elena@exportacion.cl',
      telefono: '912345678',
      familiaCargo: 'Técnico B/C',
      cargo: 'Monitor Producción',
      formacion: 'Técnico',
      disponibilidad: 'Inmediata',
      aniosExperiencia: 4,
      motivacion: 'Exportar antecedentes.',
      aceptaPrivacidad: true,
      ...extra,
    },
    null,
    'prueba exportación',
  );

test('filtra candidatos por estado, cargo, fechas y búsqueda sin tildes', async () => {
  const primero = await crear();
  const segundo = await crear({
    nombre: 'José Muñoz',
    rut: '13.333.333-3',
    correo: 'jose@exportacion.cl',
    cargo: 'Gruero',
    familiaCargo: 'Operario Calificado',
  });

  const todos = await dbCandidatos.listarTodos();
  const porEstado = filtrarParaExportar(todos, { estado: 'Pendiente' });
  assert.equal(porEstado.length, 2);

  const porCargo = filtrarParaExportar(todos, { cargo: 'Gruero' });
  assert.equal(porCargo.length, 1);
  assert.equal(porCargo[0].id, segundo.id);

  const porBusqueda = filtrarParaExportar(todos, { busqueda: 'jose' });
  assert.equal(porBusqueda.length, 1);
  assert.equal(porBusqueda[0].id, segundo.id);

  const desde = primero.fechaPostulacion.slice(0, 10);
  const porFecha = filtrarParaExportar(todos, { desde, hasta: desde });
  assert.equal(porFecha.length, 2);

  const futura = filtrarParaExportar(todos, { desde: '2099-01-01' });
  assert.equal(futura.length, 0);

  const anterior = filtrarParaExportar(todos, { hasta: '2000-01-01' });
  assert.equal(anterior.length, 0);
});

test('genera un CSV con BOM, encabezados y escape de caracteres especiales', () => {
  const csv = generarCsv([
    {
      folio: 'AQ-1',
      nombre: 'Nombre; con "punto y coma"',
      rut: '1-9',
      correo: 'a@b.cl',
      telefono: '912345678',
      familiaCargo: 'Técnico',
      cargo: 'Cargo',
      formacion: 'Técnico',
      aniosExperiencia: 2,
      disponibilidad: 'Inmediata',
      estado: 'Pendiente',
      puntaje: null,
      idoneidad: null,
      fechaPostulacion: '2026-01-01T00:00:00.000Z',
    },
  ]);
  assert.ok(csv.startsWith('\ufefffolio;nombre;rut;'));
  assert.match(csv, /Nombre; con ""punto y coma""/);
  assert.ok(csv.endsWith('\n'));
});

test('genera el informe PDF con evaluación, apoyo automático e historial', async () => {
  const candidato = await crear({ correo: 'pdf@exportacion.cl', rut: '14.444.444-4' });
  await guardarAsistencia(candidato.id, {
    resumen: 'Resumen automático de prueba.',
    afinidad: 72,
    borradorObservacion: 'Borrador de observación.',
  });
  await dbHistorial.registrar({
    candidatoId: candidato.id,
    etapaAnterior: 'Pendiente',
    etapaNueva: 'En Proceso',
    responsable: 'evaluador@exportacion.cl',
    motivo: 'Entrevista agendada',
  });

  const pdf = await generarInformePdf(candidato.id);
  assert.ok(Buffer.isBuffer(pdf));
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
});

test('genera el informe PDF con valores por defecto y sin movimientos', async () => {
  const ahora = new Date().toISOString();
  const candidato = await dbCandidatos.insertar({
    id: crypto.randomUUID(),
    folio: 'AQ-2026-SINHIST',
    nombre: 'Sin Historial',
    rut: '15.555.555-6',
    correo: 'sinhistorial@exportacion.cl',
    telefono: '912345678',
    familiaCargo: 'Técnico B/C',
    cargo: 'Monitor Producción',
    formacion: 'Técnico',
    disponibilidad: 'Inmediata',
    aniosExperiencia: 1,
    motivacion: '',
    estado: 'Pendiente',
    respuestas: null,
    puntaje: null,
    dimensiones: [],
    idoneidad: null,
    observaciones: null,
    archivos: [],
    fechaPostulacion: ahora,
    fechaActualizacion: ahora,
  });

  const pdf = await generarInformePdf(candidato.id);
  assert.ok(Buffer.isBuffer(pdf));
  assert.ok(pdf.length > 0);
});
