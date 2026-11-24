import { expect, test } from 'vitest';
import {
  archivoCvValido,
  esRutValido,
  esTelefonoValido,
  formatearRut,
  formatearTelefono,
  validarCredenciales,
  validarPostulacion,
} from './validaciones.js';

test('valida el RUT chileno con dígito verificador', () => {
  expect(esRutValido('12.345.678-5')).toBe(true);
  expect(esRutValido('12.345.678-9')).toBe(false);
  expect(formatearRut('123456785')).toBe('12.345.678-5');
  expect(formatearRut('1234')).toBe('1.234');
  expect(formatearRut('12345678')).toBe('1.234.567-8');
});

test('valida teléfonos móviles', () => {
  expect(esTelefonoValido('9 1234 5678')).toBe(true);
  expect(esTelefonoValido('+56 9 1234 5678')).toBe(true);
  expect(esTelefonoValido('2 345 6789')).toBe(false);
  expect(formatearTelefono('912345678')).toBe('9 1234 5678');
  expect(formatearTelefono('+56 9 1234 5678')).toBe('9 1234 5678');
});

test('valida el CV adjunto por extensión y tamaño', () => {
  const valido = { name: 'cv-maria.pdf', size: 1024 };
  const pesado = { name: 'cv-maria.pdf', size: 6 * 1024 * 1024 };
  const imagen = { name: 'foto.png', size: 1024 };
  expect(archivoCvValido(valido)).toBe(true);
  expect(archivoCvValido(pesado)).toBe(false);
  expect(archivoCvValido(imagen)).toBe(false);
  expect(archivoCvValido(undefined)).toBe(false);
});

test('la postulación exige todos los campos del formulario', () => {
  const incompleto = validarPostulacion({}, {});
  expect(incompleto.valido).toBe(false);
  expect(Object.keys(incompleto.errores)).toContain('cv');

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
  expect(completo.errores).toEqual({});
  expect(completo.valido).toBe(true);

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
  expect(sinConsentimiento.valido).toBe(false);
  expect(sinConsentimiento.errores.aceptaPrivacidad).toBeTruthy();
});

test('valida las credenciales de acceso', () => {
  expect(validarCredenciales({ email: 'no-es-correo', password: '123' }).valido).toBe(false);
  expect(
    validarCredenciales({ email: 'evaluador@aquachile.cl', password: 'secreta123' }).valido,
  ).toBe(true);
});
