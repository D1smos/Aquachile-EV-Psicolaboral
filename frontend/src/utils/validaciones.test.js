import test from 'node:test';
import assert from 'node:assert/strict';
import {
  archivoCvValido,
  esRutValido,
  esTelefonoValido,
  formatearRut,
  validarCredenciales,
  validarPostulacion,
} from './validaciones.js';

test('valida el RUT chileno con dígito verificador', () => {
  assert.equal(esRutValido('12.345.678-5'), true);
  assert.equal(esRutValido('12.345.678-9'), false);
  assert.equal(formatearRut('123456785'), '12.345.678-5');
});

test('valida teléfonos móviles', () => {
  assert.equal(esTelefonoValido('9 1234 5678'), true);
  assert.equal(esTelefonoValido('+56 9 1234 5678'), true);
  assert.equal(esTelefonoValido('2 345 6789'), false);
});

test('valida el CV adjunto por extensión y tamaño', () => {
  const valido = { name: 'cv-maria.pdf', size: 1024 };
  const pesado = { name: 'cv-maria.pdf', size: 6 * 1024 * 1024 };
  const imagen = { name: 'foto.png', size: 1024 };
  assert.equal(archivoCvValido(valido), true);
  assert.equal(archivoCvValido(pesado), false);
  assert.equal(archivoCvValido(imagen), false);
  assert.equal(archivoCvValido(undefined), false);
});

test('la postulación exige todos los campos del formulario', () => {
  const incompleto = validarPostulacion({}, {});
  assert.equal(incompleto.valido, false);
  assert.ok(Object.keys(incompleto.errores).includes('cv'));

  const completo = validarPostulacion(
    {
      nombre: 'María José González',
      rut: '12.345.678-5',
      correo: 'maria@correo.cl',
      telefono: '912345678',
      familiaCargo: 'Técnico B/C',
      cargo: 'Monitor Producción',
      aniosExperiencia: 3,
      formacion: 'Técnico',
      disponibilidad: 'Inmediata',
      motivacion: 'Me interesa el cargo',
      aceptaPrivacidad: true,
    },
    { cv: { name: 'cv.pdf', size: 2048 } },
  );
  assert.deepEqual(completo.errores, {});
  assert.equal(completo.valido, true);

  const sinConsentimiento = validarPostulacion(
    {
      nombre: 'María José González',
      rut: '12.345.678-5',
      correo: 'maria@correo.cl',
      telefono: '912345678',
      familiaCargo: 'Técnico B/C',
      cargo: 'Monitor Producción',
      aniosExperiencia: 3,
      formacion: 'Técnico',
      disponibilidad: 'Inmediata',
      motivacion: 'Me interesa el cargo',
      aceptaPrivacidad: false,
    },
    { cv: { name: 'cv.pdf', size: 2048 } },
  );
  assert.equal(sinConsentimiento.valido, false);
  assert.ok(sinConsentimiento.errores.aceptaPrivacidad);
});

test('valida las credenciales de acceso', () => {
  assert.equal(validarCredenciales({ email: 'no-es-correo', password: '123' }).valido, false);
  assert.equal(
    validarCredenciales({ email: 'evaluador@aquachile.cl', password: 'secreta123' }).valido,
    true,
  );
});
