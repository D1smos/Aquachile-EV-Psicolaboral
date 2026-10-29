import {
  esCorreoValido,
  esRutValido,
  esTelefonoValido,
  formatearRut,
  validarPostulacion,
} from './validaciones.js';

describe('validaciones de postulación', () => {
  it('acepta RUT válidos y rechaza inválidos', () => {
    expect(esRutValido('12.345.678-5')).toBeTrue();
    expect(esRutValido('11.111.111-1')).toBeTrue();
    expect(esRutValido('12.345.678-9')).toBeFalse();
    expect(esRutValido('')).toBeFalse();
  });

  it('valida correos electrónicos', () => {
    expect(esCorreoValido('ana@correo.cl')).toBeTrue();
    expect(esCorreoValido('sin-arroba')).toBeFalse();
  });

  it('valida móviles chilenos de 9 dígitos', () => {
    expect(esTelefonoValido('912345678')).toBeTrue();
    expect(esTelefonoValido('812345678')).toBeFalse();
    expect(esTelefonoValido('123')).toBeFalse();
  });

  it('formatea el RUT con puntos y guion', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5');
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
    expect(validarPostulacion(formulario, { cv: { name: 'cv.pdf', size: 1000 } }).valido).toBeTrue();
    expect(
      validarPostulacion(
        { ...formulario, aceptaPrivacidad: false },
        { cv: { name: 'cv.pdf', size: 1000 } },
      ).valido,
    ).toBeFalse();
    expect(validarPostulacion({}, {}).valido).toBeFalse();
  });
});
