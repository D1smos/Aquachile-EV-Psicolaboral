export const LIMITE_ARCHIVO_MB = 5;
export const EXTENSIONES_CV = Object.freeze(['pdf', 'doc', 'docx']);

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const TELEFONO_REGEX = /^9\d{8}$/;

export const soloDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

export const esCorreoValido = (valor) => CORREO_REGEX.test(String(valor ?? '').trim());

export const esTelefonoValido = (valor) => {
  let digitos = soloDigitos(valor);
  if (digitos.startsWith('56') && digitos.length === 11) {
    digitos = digitos.slice(2);
  }
  return TELEFONO_REGEX.test(digitos);
};

export const esRutValido = (valor) => {
  const limpio = String(valor ?? '')
    .replace(/[.\-\s]/g, '')
    .toUpperCase();
  if (!/^\d{7,8}[\dK]$/.test(limpio)) {
    return false;
  }
  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.slice(-1);
  let suma = 0;
  let multiplicador = 2;
  for (let indice = cuerpo.length - 1; indice >= 0; indice -= 1) {
    suma += Number(cuerpo[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return esperado === verificador;
};

export const formatearRut = (valor) => {
  const limpio = String(valor ?? '')
    .replace(/[^0-9k]/gi, '')
    .toUpperCase();
  if (limpio.length < 2) {
    return limpio;
  }
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${limpio.slice(-1)}`;
};

export const formatearTelefono = (valor) => {
  const digitos = soloDigitos(valor).slice(0, 9);
  if (digitos.length <= 4) {
    return digitos;
  }
  if (digitos.length <= 7) {
    return `${digitos.slice(0, 4)} ${digitos.slice(4)}`;
  }
  return `${digitos.slice(0, 4)} ${digitos.slice(4, 7)} ${digitos.slice(7)}`;
};

const extensionDe = (archivo) => String(archivo?.name ?? '').split('.').pop()?.toLowerCase() ?? '';

export const archivoCvValido = (archivo) => {
  if (!archivo) {
    return false;
  }
  return (
    EXTENSIONES_CV.includes(extensionDe(archivo)) &&
    archivo.size <= LIMITE_ARCHIVO_MB * 1024 * 1024
  );
};

const textoValido = (valor, longitudMinima) =>
  String(valor ?? '').trim().length >= longitudMinima;

export const validarPostulacion = (formulario = {}, archivos = {}) => {
  const errores = {};
  const agregar = (campo, mensaje) => {
    errores[campo] = mensaje;
  };

  const nombre = String(formulario.nombre ?? '').trim();
  if (!textoValido(nombre, 4)) {
    agregar('nombre', 'Ingresa tu nombre y apellido');
  } else if (nombre.length > 80) {
    agregar('nombre', 'El nombre no puede superar 80 caracteres');
  }

  if (!esRutValido(formulario.rut)) {
    agregar('rut', 'Ingresa un RUT válido, por ejemplo 12.345.678-5');
  }

  if (!esCorreoValido(formulario.correo)) {
    agregar('correo', 'Ingresa un correo electrónico válido');
  }

  if (!esTelefonoValido(formulario.telefono)) {
    agregar('telefono', 'Ingresa un teléfono móvil de 9 dígitos que comience por 9');
  }

  if (!textoValido(formulario.familiaCargo, 1)) {
    agregar('familiaCargo', 'Selecciona la familia del cargo');
  }

  if (!textoValido(formulario.cargo, 1)) {
    agregar('cargo', 'Selecciona el cargo al que postulas');
  }

  const anios = Number(formulario.aniosExperiencia);
  if (!Number.isInteger(anios) || anios < 0 || anios > 45) {
    agregar('aniosExperiencia', 'Indica entre 0 y 45 años de experiencia');
  }

  if (!textoValido(formulario.formacion, 1)) {
    agregar('formacion', 'Selecciona tu formación académica');
  }

  if (!textoValido(formulario.disponibilidad, 1)) {
    agregar('disponibilidad', 'Selecciona tu disponibilidad');
  }

  if (String(formulario.motivacion ?? '').length > 500) {
    agregar('motivacion', 'La motivación no puede superar los 500 caracteres');
  }

  if (!archivos.cv) {
    agregar('cv', 'Adjunta tu CV en formato PDF, DOC o DOCX');
  } else if (!archivoCvValido(archivos.cv)) {
    agregar(
      'cv',
      `Formato no permitido o supera los ${LIMITE_ARCHIVO_MB} MB. Usa PDF, DOC o DOCX.`,
    );
  }

  return { valido: Object.keys(errores).length === 0, errores };
};

export const validarCredenciales = (credenciales = {}) => {
  const errores = {};
  if (!esCorreoValido(credenciales.email)) {
    errores.email = 'Ingresa un correo electrónico válido';
  }
  if (!textoValido(credenciales.password, 6)) {
    errores.password = 'La contraseña debe tener al menos 6 caracteres';
  }
  return { valido: Object.keys(errores).length === 0, errores };
};
