import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-oauth-aquachile';
process.env.GOOGLE_HABILITADO = 'true';
process.env.GOOGLE_CLIENT_ID = 'cliente-prueba';
process.env.GOOGLE_CLIENT_SECRET = 'secreto-prueba';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/integraciones/google/callback';
process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = 'clave-cifrado-de-prueba';

const { cifrarToken, descifrarToken } = await import('../src/services/google/cifrado.js');
const {
  construirUrlAutorizacion,
  crearEstadoOAuth,
  verificarEstadoOAuth,
} = await import('../src/services/google/oauth.js');

test('cifra y descifra el refresh token sin exponerlo', () => {
  const token = 'refresh-token-secreto';
  const cifrado = cifrarToken(token);
  assert.notEqual(cifrado, token);
  assert.equal(descifrarToken(cifrado), token);
});

test('firma y verifica el estado OAuth', () => {
  const estado = crearEstadoOAuth('Evaluador@AquaChile.cl');
  assert.equal(verificarEstadoOAuth(estado), 'evaluador@aquachile.cl');
  assert.throws(() => verificarEstadoOAuth(`${estado}x`), (error) => error.codigo === 400);
});

test('construye la URL de autorización con offline y consentimiento', () => {
  const url = new URL(construirUrlAutorizacion('evaluador@aquachile.cl'));
  assert.equal(url.origin, 'https://accounts.google.com');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('client_id'), 'cliente-prueba');
  assert.match(url.searchParams.get('scope'), /calendar\.events/);
  assert.ok(url.searchParams.get('state'));
});
