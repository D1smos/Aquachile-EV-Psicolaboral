export const construirConsultaCandidatos = (filtros = {}) => {
  const parametros = new URLSearchParams();
  const minExperiencia = String(filtros.minExperiencia ?? '').trim();
  const palabrasClave = String(filtros.palabrasClave ?? '').trim();

  if (minExperiencia !== '') {
    parametros.set('minExperiencia', minExperiencia);
  }
  if (palabrasClave !== '') {
    parametros.set('palabrasClave', palabrasClave);
  }

  const consulta = parametros.toString();
  return consulta ? `/candidatos?${consulta}` : '/candidatos';
};

export const palabrasClaveDeCandidato = (candidato) => {
  const valor = candidato?.palabrasClaveDetectadas ?? candidato?.palabrasClave ?? [];
  const lista = Array.isArray(valor) ? valor : String(valor ?? '').split(',');
  return [...new Set(lista.map((palabra) => String(palabra).trim()).filter(Boolean))].slice(0, 6);
};
