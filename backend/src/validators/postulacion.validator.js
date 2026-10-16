import { DISPONIBILIDADES, FORMACIONES, cargoEsValido } from '../domain/catalogoCargos.js';
import {
  enteroEnRango,
  esCorreoValido,
  esRutValido,
  esTelefonoValido,
  textoNoVacio,
} from '../utils/validadores.js';

export const validarPostulacion = (cuerpo = {}) => {
  const errores = [];
  const agregar = (campo, mensaje) => errores.push({ campo, mensaje });

  const nombre = String(cuerpo.nombre ?? '').trim();
  if (!textoNoVacio(nombre, 4)) {
    agregar('nombre', 'Ingresa tu nombre y apellido');
  } else if (nombre.length > 80) {
    agregar('nombre', 'El nombre no puede superar 80 caracteres');
  }

  if (!esRutValido(cuerpo.rut)) {
    agregar('rut', 'Ingresa un RUT válido, por ejemplo 12.345.678-5');
  }

  if (!esCorreoValido(cuerpo.correo)) {
    agregar('correo', 'Ingresa un correo electrónico válido');
  }

  if (!esTelefonoValido(cuerpo.telefono)) {
    agregar('telefono', 'Ingresa un teléfono móvil de 9 dígitos que comience por 9');
  }

  if (!cargoEsValido(cuerpo.familiaCargo, cuerpo.cargo)) {
    agregar('cargo', 'Selecciona una familia de cargo y un cargo válidos');
  }

  if (!enteroEnRango(cuerpo.aniosExperiencia, 0, 45)) {
    agregar('aniosExperiencia', 'Indica entre 0 y 45 años de experiencia');
  }

  if (!FORMACIONES.includes(cuerpo.formacion)) {
    agregar('formacion', 'Selecciona tu formación académica');
  }

  if (!DISPONIBILIDADES.includes(cuerpo.disponibilidad)) {
    agregar('disponibilidad', 'Selecciona tu disponibilidad de incorporación');
  }

  const motivacion = String(cuerpo.motivacion ?? '').trim();
  if (motivacion.length > 500) {
    agregar('motivacion', 'La motivación no puede superar los 500 caracteres');
  }

  return errores;
};
