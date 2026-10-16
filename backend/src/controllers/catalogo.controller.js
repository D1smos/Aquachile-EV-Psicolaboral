import { FAMILIAS_CARGO, DISPONIBILIDADES, FORMACIONES } from '../domain/catalogoCargos.js';
import { CUESTIONARIO, OPCIONES_RESPUESTA } from '../domain/cuestionario.js';
import { LISTA_ESTADOS, IDONEIDADES } from '../domain/constantes.js';

export const obtenerCatalogos = (req, res) => {
  res.json({
    ok: true,
    familiasCargos: FAMILIAS_CARGO,
    disponibilidades: DISPONIBILIDADES,
    formaciones: FORMACIONES,
    estados: LISTA_ESTADOS,
    idoneidades: Object.values(IDONEIDADES),
  });
};

export const obtenerCuestionario = (req, res) => {
  res.json({
    ok: true,
    dimensiones: CUESTIONARIO.dimensiones,
    preguntas: CUESTIONARIO.preguntas,
    opciones: OPCIONES_RESPUESTA,
  });
};
