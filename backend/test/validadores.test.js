import test from 'node:test';
import assert from 'node:assert/strict';
import {
  esCorreoValido,
  esRutValido,
  esTelefonoValido,
  enteroEnRango,
} from '../src/utils/validadores.js';
import { validarPostulacion } from '../src/validators/postulacion.validator.js';

test('valida correos electrónicos', () => {
  assert.equal(esCorreoValido('persona@dominio.cl'), true);
  assert.equal(esCorreoValido('sin-arroba.cl'), false);
  assert.equal(esCorreoValido(''), false);
});

test('valida teléfonos móviles chilenos de 9 dígitos', () => {
  assert.equal(esTelefonoValido('912345678'), true);
  assert.equal(esTelefonoValido('+56 9 1234 5678'), true);
  assert.equal(esTelefonoValido('812345678'), false);
  assert.equal(esTelefonoValido('12345'), false);
});

test('valida RUT con dígito verificador', () => {
  assert.equal(esRutValido('12.345.678-5'), true);
  assert.equal(esRutValido('123456785'), true);
  assert.equal(esRutValido('12.345.678-9'), false);
  assert.equal(esRutValido('abc'), false);
});

test('valida enteros dentro de un rango', () => {
  assert.equal(enteroEnRango(5, 0, 45), true);
  assert.equal(enteroEnRango(50, 0, 45), false);
  assert.equal(enteroEnRango('5.5', 0, 45), false);
});

test('la postulación exige campos completos y válidos', () => {
  assert.equal(validarPostulacion({}).length > 0, true);

  const errores = validarPostulacion({
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
  });
  assert.deepEqual(errores, []);

  const conCargoInvalido = validarPostulacion({
    nombre: 'María José González',
    rut: '12.345.678-5',
    correo: 'maria@correo.cl',
    telefono: '912345678',
    familiaCargo: 'Técnico B/C',
    cargo: 'Piloto de Drones',
    aniosExperiencia: 3,
    formacion: 'Técnico',
    disponibilidad: 'Inmediata',
  });
  assert.equal(conCargoInvalido.some((error) => error.campo === 'cargo'), true);
});
