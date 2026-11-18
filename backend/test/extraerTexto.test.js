import test from 'node:test';
import assert from 'node:assert/strict';
import PDFDocument from 'pdfkit';
import JSZip from 'jszip';

process.env.JWT_SECRET ||= 'secreto-extraccion-texto';
const { extraerMetadatosCV, extraerTexto } = await import(
  '../src/services/documentos/extraerTexto.js'
);

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

test('la heurística detecta años de experiencia y rangos de años', () => {
  const metadatos = extraerMetadatosCV(
    'Experiencia de 7 años en operaciones. Trabajé entre 2019 - 2024 en planta.',
  );
  assert.equal(metadatos.anosExperiencia, 7);
});

test('la heurística extrae palabras clave relevantes sin repetir', () => {
  const metadatos = extraerMetadatosCV(
    'Python SQL Excel Python mantenimiento mantenimiento producción.',
  );
  assert.ok(metadatos.palabrasClave.includes('python'));
  assert.ok(metadatos.palabrasClave.includes('sql'));
  assert.ok(metadatos.palabrasClave.includes('mantenimiento'));
  assert.equal(metadatos.palabrasClave.filter((palabra) => palabra === 'python').length, 1);
});

test('extrae texto de un PDF y calcula metadatos', async () => {
  const buffer = await generarPdf(
    'Experiencia de 9 años en producción industrial. Manejo de Python, SQL y Excel.',
  );
  const resultado = await extraerTexto({ buffer, nombreOriginal: 'cv.pdf' });
  assert.equal(resultado.estado, 'ok');
  assert.equal(resultado.paginas, 1);
  assert.match(resultado.texto, /Python/);
  assert.equal(resultado.anosExperiencia, 9);
  assert.ok(resultado.palabrasClave.includes('python'));
  assert.equal(resultado.textoHash.length, 64);
});

test('un PDF con menos de 50 caracteres útiles queda sin texto', async () => {
  const buffer = await generarPdf('Hola');
  const resultado = await extraerTexto({ buffer, nombreOriginal: 'cv.pdf' });
  assert.equal(resultado.estado, 'sin_texto');
  assert.ok(resultado.caracteres < 50);
});

test('extrae texto de un DOCX', async () => {
  const buffer = await generarDocx(
    'Experiencia de 6 años en mantenimiento industrial. Conocimientos de Python y SQL.',
  );
  const resultado = await extraerTexto({ buffer, nombreOriginal: 'cv.docx' });
  assert.equal(resultado.estado, 'ok');
  assert.match(resultado.texto, /mantenimiento/);
  assert.equal(resultado.anosExperiencia, 6);
  assert.equal(resultado.modeloExtraccion, 'mammoth');
});

test('marca como no soportado un formato sin extractor', async () => {
  const resultado = await extraerTexto({
    buffer: Buffer.from('contenido de word antiguo'),
    nombreOriginal: 'cv.doc',
  });
  assert.equal(resultado.estado, 'no_soportado');
  assert.equal(resultado.texto, null);
});

test('un archivo vacío devuelve error', async () => {
  const resultado = await extraerTexto({ buffer: Buffer.alloc(0), nombreOriginal: 'cv.pdf' });
  assert.equal(resultado.estado, 'error');
});
