import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import JSZip from 'jszip';

const directorioPrueba = await mkdtemp(path.join(tmpdir(), 'aquachile-asistente-ia-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-asistente-ia-aquachile';
process.env.DATABASE_URL = '';
process.env.SEED_DEMO = 'false';
process.env.STORAGE_PROVIDER = 'local';
process.env.DIRECTORIO_DATOS = path.join(directorioPrueba, 'data');
process.env.DIRECTORIO_UPLOADS = path.join(directorioPrueba, 'uploads');
process.env.IA_HABILITADA = 'true';
process.env.LLM_API_KEY = 'clave-de-prueba';
process.env.LLM_MODEL = 'modelo-prueba:free';
process.env.SMTP_HOST = '';
process.env.RESEND_API_KEY = '';

const { inicializarBaseDatos } = await import('../src/services/seed.service.js');
const { crearPostulacion } = await import('../src/services/candidato.service.js');
const { dbArchivos, dbCandidatos } = await import('../src/config/baseDatos.js');
const { cerrarBaseDatos } = await import('../src/config/sqlite.js');
const {
  compararPorCargo,
  construirAsistencia,
  generarAsistencia,
  normalizarContextoEvaluacion,
} = await import('../src/services/asistente.service.js');

await inicializarBaseDatos();

after(async () => {
  cerrarBaseDatos();
  await rm(directorioPrueba, { recursive: true, force: true });
});

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

const generarDocx = async (texto) => {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${texto}</w:t></w:r></w:p></w:body></w:document>`,
  );
  return zip.generateAsync({ type: 'nodebuffer' });
};

const datos = (extra = {}) => ({
  nombre: 'Tomás Asistente',
  rut: '12.345.678-5',
  correo: 'tomas@asistente.cl',
  telefono: '912345678',
  familiaCargo: 'Técnico B/C',
  cargo: 'Monitor Producción',
  formacion: 'Técnico',
  disponibilidad: 'Inmediata',
  aniosExperiencia: 4,
  motivacion: 'Asistencia automática.',
  aceptaPrivacidad: true,
  ...extra,
});

const respuestaValida = (borrador = 'Borrador profesional con evidencia suficiente para revisión humana.') => ({
  resumenEjecutivo: 'Resumen ejecutivo de la asistencia generada.',
  cargo: 'Monitor Producción',
  anosExperienciaEstimados: 5,
  palabrasClave: ['monitor', 'produccion', 'monitor'],
  borradorObservacion: borrador,
  fortalezasCV: ['Experiencia en planta'],
  brechasCV: ['Inglés no declarado'],
  sugerenciasEntrevista: ['Validar trabajo en turnos'],
});

test('genera asistencia con IA a partir de un CV PDF y sanea la respuesta', async () => {
  const pdf = await generarPdf(
    'Experiencia como monitor de producción en planta, manejo de turnos y seguridad.',
  );
  const candidato = await crearPostulacion(
    datos(),
    {
      cv: [
        {
          buffer: pdf,
          originalname: 'cv-tomas.pdf',
          mimetype: 'application/pdf',
        },
      ],
    },
    'prueba asistencia',
  );

  let promptRecibido = null;
  const asistencia = await generarAsistencia(
    candidato.id,
    { evaluacion: { respuestas: { p1: 5, p2: 4, p3: 5, p4: 4, p5: 5 } } },
    {
      proveedor: async ({ prompt }) => {
        promptRecibido = prompt;
        return { json: respuestaValida(), modelo: 'modelo-respuesta' };
      },
    },
  );

  assert.equal(asistencia.fuente, 'ia');
  assert.equal(asistencia.modelo, 'modelo-respuesta');
  assert.equal(asistencia.borradorObservacion, respuestaValida().borradorObservacion);
  assert.deepEqual(asistencia.datosClave.palabrasClave, ['monitor', 'produccion']);
  assert.equal(asistencia.datosClave.anosExperienciaEstimados, 5);
  assert.equal(asistencia.requiere_revision_humana, true);
  assert.match(promptRecibido.usuario, /<documento_no_confiable>/);
  assert.match(promptRecibido.usuario, /monitor de producción/i);
});

test('mantiene la asistencia local si la respuesta de IA es inválida o falla', async () => {
  const pdf = await generarPdf('Experiencia como monitor de producción en planta.');
  const candidato = await crearPostulacion(
    datos({ rut: '13.333.333-3', correo: 'invalida@asistente.cl' }),
    {
      cv: [{ buffer: pdf, originalname: 'cv.pdf', mimetype: 'application/pdf' }],
    },
    'prueba asistencia',
  );

  const invalida = await generarAsistencia(candidato.id, {}, {
    proveedor: async () => ({ json: { borradorObservacion: 'muy corto' } }),
  });
  assert.equal(invalida.fuente, 'local');
  assert.match(invalida.borradorObservacion, /validado por el evaluador/);

  const falla = await generarAsistencia(candidato.id, {}, {
    proveedor: async () => {
      throw new Error('Proveedor caído');
    },
  });
  assert.equal(falla.fuente, 'local');
  assert.match(falla.advertenciaIA, /No fue posible usar IA/);
});

test('extrae texto de DOCX y acepta respuestas envueltas en contenido', async () => {
  const docx = await generarDocx(
    'Experiencia como monitor de producción, bodega y control de calidad.',
  );
  const candidato = await crearPostulacion(
    datos({ rut: '14.444.444-4', correo: 'docx@asistente.cl' }),
    {
      cv: [
        {
          buffer: docx,
          originalname: 'cv.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ],
    },
    'prueba asistencia',
  );

  const asistencia = await generarAsistencia(candidato.id, {}, {
    proveedor: async () => ({ contenido: respuestaValida('Borrador desde contenido válido y revisable.') }),
  });
  assert.equal(asistencia.fuente, 'ia');
  assert.equal(asistencia.modelo, process.env.LLM_MODEL);
  assert.equal(asistencia.sinCv, false);
});

test('sin archivo legible usa la asistencia local y no llama al proveedor', async () => {
  const candidato = await crearPostulacion(
    datos({ rut: '15.555.555-6', correo: 'sincv@asistente.cl' }),
    null,
    'prueba asistencia',
  );

  let llamadas = 0;
  const asistencia = await generarAsistencia(candidato.id, {}, {
    proveedor: async () => {
      llamadas += 1;
      return { json: respuestaValida() };
    },
  });
  assert.equal(asistencia.sinCv, true);
  assert.equal(asistencia.fuente, 'local');
  assert.equal(llamadas, 0);
});

test('tolera CV PDF ausente y formatos sin extractor', async () => {
  const pdfPerdido = await crearPostulacion(
    datos({ rut: '16.666.666-K', correo: 'perdido@asistente.cl' }),
    null,
    'prueba asistencia',
  );
  await dbArchivos.insertar(pdfPerdido.id, {
    id: crypto.randomUUID(),
    tipo: 'cv',
    nombreOriginal: 'cv-perdido.pdf',
    nombreAlmacenado: 'cv-perdido.pdf',
    ruta: 'documentos/cv/no-existe.pdf',
    mimetype: 'application/pdf',
    tamano: 10,
    storageKey: 'documentos/cv/no-existe.pdf',
    proveedor: 'local',
    bucket: null,
    hash: `hash-${pdfPerdido.id}`,
    creadoEn: new Date().toISOString(),
  });
  const sinArchivo = await generarAsistencia(pdfPerdido.id, {}, {
    proveedor: async () => ({ json: respuestaValida() }),
  });
  assert.equal(sinArchivo.sinCv, true);

  const texto = await crearPostulacion(
    datos({ rut: '17.777.777-7', correo: 'texto@asistente.cl' }),
    null,
    'prueba asistencia',
  );
  await dbArchivos.insertar(texto.id, {
    id: crypto.randomUUID(),
    tipo: 'cv',
    nombreOriginal: 'cv.txt',
    nombreAlmacenado: 'cv.txt',
    ruta: 'documentos/cv/cv.txt',
    mimetype: 'text/plain',
    tamano: 10,
    storageKey: 'documentos/cv/cv.txt',
    proveedor: 'local',
    bucket: null,
    hash: `hash-${texto.id}`,
    creadoEn: new Date().toISOString(),
  });
  const noSoportado = await generarAsistencia(texto.id, {}, {
    proveedor: async () => ({ json: respuestaValida() }),
  });
  assert.equal(noSoportado.sinCv, true);
});

test('calcula el contexto desde respuestas y descarta dimensiones incompletas', () => {
  const contexto = normalizarContextoEvaluacion({
    evaluacion: {
      puntaje: 50,
      respuestas: { p1: 5, p2: 5, p3: 5, p4: 5, p5: 5 },
      dimensiones: [
        { id: 'sin-nombre', puntaje: 10 },
        { id: 'd1', nombre: 'Comunicación', puntaje: 90 },
        { nombre: '   ' },
      ],
    },
  });
  assert.equal(contexto.puntaje, 50);
  assert.equal(contexto.dimensiones.length, 1);
  assert.equal(contexto.dimensiones[0].nombre, 'Comunicación');

  const vacio = normalizarContextoEvaluacion(null);
  assert.equal(vacio.puntaje, null);
  assert.deepEqual(vacio.dimensiones, []);
});

test('compara candidatos del mismo cargo por afinidad y calcula la posición', async () => {
  const primero = await crearPostulacion(
    datos({ rut: '18.888.888-8', correo: 'compara1@asistente.cl' }),
    null,
    'prueba comparación',
  );
  const segundo = await crearPostulacion(
    datos({ rut: '19.999.999-9', correo: 'compara2@asistente.cl' }),
    null,
    'prueba comparación',
  );
  const ajeno = await crearPostulacion(
    datos({ cargo: 'Gruero', familiaCargo: 'Operario Calificado', rut: '20.111.111-1', correo: 'ajeno@asistente.cl' }),
    null,
    'prueba comparación',
  );
  await dbCandidatos.actualizar(primero.id, { afinidadIA: 64 });
  await dbCandidatos.actualizar(segundo.id, { afinidadIA: 88 });
  await dbCandidatos.actualizar(ajeno.id, { afinidadIA: 99 });

  const resultado = await compararPorCargo('Monitor Producción', primero.id);
  assert.equal(resultado.total, 2);
  assert.equal(resultado.posicion, 2);
  assert.equal(resultado.ranking[0].id, segundo.id);

  const sinPosicion = await compararPorCargo('Monitor Producción');
  assert.equal(sinPosicion.posicion, null);
  assert.equal(sinPosicion.ranking.length, 2);

  const local = construirAsistencia(
    { ...datos(), cargo: 'Cargo Sin Claves' },
    'texto sin coincidencias',
  );
  assert.equal(local.afinidad, 0);
});
