import { describe, expect, it } from 'vitest';
import {
  esCorreoValido,
  esRutValido,
  esTelefonoValido,
  formatearRut,
  formatearTelefono,
  validarPostulacion,
} from './validaciones.js';

describe('validaciones de postulación', () => {
  it('acepta RUT válidos y rechaza inválidos', () => {
    expect(esRutValido('12.345.678-5')).toBe(true);
    expect(esRutValido('11.111.111-1')).toBe(true);
    expect(esRutValido('12.345.678-9')).toBe(false);
    expect(esRutValido('')).toBe(false);
  });

  it('valida correos electrónicos', () => {
    expect(esCorreoValido('ana@correo.cl')).toBe(true);
    expect(esCorreoValido('sin-arroba')).toBe(false);
  });

  it('valida y formatea móviles chilenos de 9 dígitos', () => {
    expect(esTelefonoValido('912345678')).toBe(true);
    expect(esTelefonoValido('812345678')).toBe(false);
    expect(esTelefonoValido('123')).toBe(false);
    expect(formatearTelefono('912345678')).toBe('9 1234 5678');
    expect(formatearTelefono('+56 9 1234 5678')).toBe('9 1234 5678');
  });

  it('formatea el RUT con puntos y guion', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5');
    expect(formatearRut('1234')).toBe('1.234');
    expect(formatearRut('12345678')).toBe('1.234.567-8');
  });

  it('valida el formulario de postulación completo', () => {
    const formulario = {
      nombre: 'Ana Prueba',
      rut: '12.345.678-5',
      correo: 'ana@correo.cl',
      telefono: '912345678',
      familiaCargo: 'Técnico B/C',
      cargo: 'Monitor Producción',
      aniosExperiencia: 3,
      formacion: 'Técnico',
      disponibilidad: 'Inmediata',
      motivacion: '',
      aceptaPrivacidad: true,
    };
    expect(validarPostulacion(formulario, { cv: { name: 'cv.pdf', size: 1000 } }).valido).toBe(true);
    expect(
      validarPostulacion(
        { ...formulario, aceptaPrivacidad: false },
        { cv: { name: 'cv.pdf', size: 1000 } },
      ).valido,
    ).toBe(false);
    expect(validarPostulacion({}, {}).valido).toBe(false);
  });
});
