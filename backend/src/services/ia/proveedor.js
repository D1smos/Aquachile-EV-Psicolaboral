import { entorno } from '../../config/entorno.js';
import { ErrorHttp } from '../../utils/ErrorHttp.js';
import { parsearRespuestaJson } from './esquema.js';

class ErrorRecuperable extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.recuperable = true;
  }
}

const errorConfiguracion = () => {
  const error = new ErrorHttp(
    'La IA no está disponible. Configura IA_HABILITADA=true y LLM_API_KEY en backend/.env.',
    503,
    [{ codigo: 'IA_NO_DISPONIBLE', mensaje: 'Servicio de IA no configurado' }],
  );
  error.codigoIA = 'IA_NO_DISPONIBLE';
  return error;
};

const errorGateway = (mensaje) => {
  const error = new ErrorHttp(mensaje, 502, [{ codigo: 'BAD_GATEWAY_IA', mensaje }]);
  error.codigoIA = 'BAD_GATEWAY_IA';
  return error;
};

const modelosDisponibles = (modelo) =>
  [...new Set([modelo || entorno.ia.modelo, ...entorno.ia.fallbackModels].filter(Boolean))];

const contenidoDelMensaje = (mensaje) => {
  if (typeof mensaje?.content === 'string') {
    return mensaje.content;
  }
  if (Array.isArray(mensaje?.content)) {
    return mensaje.content.map((parte) => parte?.text ?? '').join('');
  }
  return '';
};

const solicitarModelo = async ({ modelo, prompt, fetchImpl, usarFormato = true }) => {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), entorno.ia.timeoutMs);
  const cuerpo = {
    model: modelo,
    messages: [
      { role: 'system', content: prompt.sistema },
      { role: 'user', content: prompt.usuario },
    ],
    temperature: 0.2,
    max_tokens: entorno.ia.maxTokens,
  };
  if (usarFormato) {
    cuerpo.response_format = { type: 'json_object' };
  }
  if (!modelo.endsWith(':free')) {
    cuerpo.provider = { data_collection: 'deny' };
  }

  let respuesta;
  try {
    respuesta = await fetchImpl(`${entorno.ia.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${entorno.ia.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': entorno.ia.appUrl,
        'X-Title': entorno.ia.appName,
      },
      body: JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
  } catch (error) {
    throw new ErrorRecuperable(
      error.name === 'AbortError' ? 'Tiempo de espera agotado al consultar la IA' : error.message,
    );
  } finally {
    clearTimeout(temporizador);
  }

  if (respuesta.status === 400 && usarFormato) {
    return solicitarModelo({ modelo, prompt, fetchImpl, usarFormato: false });
  }
  if (respuesta.status === 429 || respuesta.status >= 500) {
    throw new ErrorRecuperable(`OpenRouter respondió HTTP ${respuesta.status}`);
  }
  if (!respuesta.ok) {
    throw errorGateway(`OpenRouter respondió HTTP ${respuesta.status}`);
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw errorGateway('OpenRouter devolvió una respuesta no JSON');
  }
  const contenido = contenidoDelMensaje(datos?.choices?.[0]?.message);
  if (!contenido) {
    throw errorGateway('OpenRouter no devolvió contenido');
  }
  return {
    json: parsearRespuestaJson(contenido),
    contenido,
    modelo,
    tokensEntrada: Number(datos?.usage?.prompt_tokens ?? 0),
    tokensSalida: Number(datos?.usage?.completion_tokens ?? 0),
  };
};

const intentarModelo = async (argumentos) => {
  let ultimoError;
  for (let intento = 0; intento < 2; intento += 1) {
    try {
      return await solicitarModelo(argumentos);
    } catch (error) {
      ultimoError = error;
      if (!error.recuperable || intento === 1) {
        throw error;
      }
    }
  }
  throw ultimoError;
};

export const consultarOpenRouter = async ({ prompt, modelo, fetchImpl = globalThis.fetch }) => {
  if (!entorno.ia.habilitada || !entorno.ia.apiKey) {
    throw errorConfiguracion();
  }
  if (!prompt?.sistema || !prompt?.usuario) {
    throw new ErrorHttp('El prompt de análisis está incompleto', 500);
  }

  let ultimoError;
  for (const modeloActual of modelosDisponibles(modelo)) {
    try {
      return await intentarModelo({ modelo: modeloActual, prompt, fetchImpl });
    } catch (error) {
      ultimoError = error;
      if (!error.recuperable) {
        throw error;
      }
    }
  }
  throw errorGateway(
    `No se pudo obtener respuesta de OpenRouter: ${ultimoError?.message ?? 'sin detalle'}`,
  );
};
