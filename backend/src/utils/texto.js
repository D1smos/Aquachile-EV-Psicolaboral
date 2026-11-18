export const normalizarComparacion = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalizarEspacios = (valor) =>
  String(valor ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const parsearPalabrasClave = (valor, defecto = []) => {
  if (Array.isArray(valor)) {
    return valor.map((palabra) => String(palabra).trim()).filter(Boolean);
  }
  if (valor === null || valor === undefined || valor === '') {
    return defecto;
  }
  if (typeof valor === 'string') {
    try {
      const parseado = JSON.parse(valor);
      if (Array.isArray(parseado)) {
        return parseado.map((palabra) => String(palabra).trim()).filter(Boolean);
      }
    } catch {
      return valor
        .split(',')
        .map((palabra) => palabra.trim())
        .filter(Boolean);
    }
  }
  return defecto;
};
