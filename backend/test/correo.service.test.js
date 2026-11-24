import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET ||= 'secreto-de-prueba';
const {
  construirCorreoAprobacion,
  construirCorreoConfirmacion,
  enviarCorreoAprobacion,
  enviarCorreoConfirmacion,
  requiereAvisoAprobacion,
} = await import('../src/services/correo.service.js');

const candidato = {
  id: 'candidato-1',
  nombre: 'Ana Pérez',
  correo: 'ana@example.com',
  cargo: 'Monitor Producción',
  folio: 'AQ-2026-ABC12345',
};

test('el correo de aprobación incluye nombre, cargo y folio', () => {
  const correo = construirCorreoAprobacion(candidato);
  assert.match(correo.asunto, /Monitor Producción/);
  assert.match(correo.texto, /Ana Pérez/);
  assert.match(correo.texto, /Monitor Producción/);
  assert.match(correo.texto, /AQ-2026-ABC12345/);
  assert.match(correo.texto, /entrevista psicolaboral/);
  assert.match(correo.texto, /presentarte/);
  assert.match(correo.html, /Ana Pérez/);
  assert.match(correo.html, /entrevista psicolaboral/);
  assert.match(correo.html, /presentarte/);
});

test('el correo escapa el HTML de los datos del candidato', () => {
  const correo = construirCorreoAprobacion({
    ...candidato,
    nombre: 'Ana <script>alert(1)</script>',
    cargo: 'Monitor & Operador',
  });
  assert.ok(!correo.html.includes('<script>'));
  assert.match(correo.html, /&lt;script&gt;/);
  assert.match(correo.html, /Monitor &amp; Operador/);
});

test('el asunto no permite inyectar saltos de línea', () => {
  const correo = construirCorreoAprobacion({ ...candidato, cargo: 'Monitor\r\nBcc: alguien@example.com' });
  assert.ok(!correo.asunto.includes('\n'));
  assert.ok(!correo.asunto.includes('\r'));
});

test('solo se notifica cuando el estado cambia a Aprobado', () => {
  assert.equal(
    requiereAvisoAprobacion({ estado: 'En Proceso' }, { estado: 'Aprobado' }),
    true,
  );
  assert.equal(
    requiereAvisoAprobacion({ estado: 'Aprobado' }, { estado: 'Aprobado' }),
    false,
  );
  assert.equal(
    requiereAvisoAprobacion({ estado: 'En Proceso' }, { estado: 'Rechazado' }),
    false,
  );
});

test('sin correo del candidato no intenta enviar', async () => {
  const resultado = await enviarCorreoAprobacion({ ...candidato, correo: '' });
  assert.equal(resultado.enviado, false);
  assert.match(resultado.motivo, /correo/i);
});

test('el correo de confirmación incluye folio, enlace y aviso de privacidad', () => {
  const correo = construirCorreoConfirmacion(candidato, 'https://aquachile.cl/consulta');

  assert.match(correo.asunto, /Recibimos tu postulación/);
  assert.match(correo.texto, /Ana Pérez/);
  assert.match(correo.texto, /AQ-2026-ABC12345/);
  assert.match(correo.texto, /https:\/\/aquachile.cl\/consulta/);
  assert.match(correo.texto, /12 meses/);
  assert.match(correo.html, /Consultar estado/);
});

test('la confirmación escapa HTML y no requiere enlace', () => {
  const correo = construirCorreoConfirmacion(
    { ...candidato, nombre: 'Ana <script>alert(1)</script>', cargo: 'Monitor & Operador' },
    '',
  );

  assert.ok(!correo.html.includes('<script>'));
  assert.match(correo.html, /&lt;script&gt;/);
  assert.match(correo.html, /Monitor &amp; Operador/);
  assert.ok(!correo.texto.includes('Consulta el estado aquí'));
});

test('sin correo del candidato no intenta enviar la confirmación', async () => {
  const resultado = await enviarCorreoConfirmacion({ ...candidato, correo: '' });
  assert.equal(resultado.enviado, false);
  assert.match(resultado.motivo, /correo/i);
});
