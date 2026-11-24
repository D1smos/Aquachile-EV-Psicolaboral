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

export const normalizarRut = (valor) =>
  String(valor ?? '')
    .replace(/[^0-9k]/gi, '')
    .toUpperCase();

export const esRutValido = (valor) => {
  const limpio = normalizarRut(valor).replace(/[.\-\s]/g, '');
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

export const textoNoVacio = (valor, longitudMinima = 1) =>
  String(valor ?? '').trim().length >= longitudMinima;

export const enteroEnRango = (valor, minimo, maximo) => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo;
};
