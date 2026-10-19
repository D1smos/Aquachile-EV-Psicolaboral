const URL_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');
const CLAVE_TOKEN = 'aquachile_token';

export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token);
export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN);
export const limpiarToken = () => localStorage.removeItem(CLAVE_TOKEN);

const construirUrl = (ruta) => `${URL_BASE}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;

const encabezados = (cuerpo) => {
  const cabeceras = {};
  const token = obtenerToken();
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }
  if (cuerpo !== undefined && !(cuerpo instanceof FormData)) {
    cabeceras['Content-Type'] = 'application/json';
  }
  return cabeceras;
};

const cuerpoNormalizado = (cuerpo) =>
  cuerpo !== undefined && !(cuerpo instanceof FormData) ? JSON.stringify(cuerpo) : cuerpo;

const interpretar = async (respuesta) => {
  const tipo = respuesta.headers.get('content-type') ?? '';
  if (respuesta.status === 204 || !tipo.includes('application/json')) {
    return null;
  }
  return respuesta.json();
};

const lanzarError = (respuesta, datos) => {
  const error = new Error(datos?.mensaje ?? 'La solicitud no se pudo procesar');
  error.codigo = respuesta.status;
  error.detalle = datos?.detalle;
  return error;
};

const ejecutar = async (metodo, ruta, opciones = {}) => {
  const { cuerpo, ...resto } = opciones;
  let respuesta;
  try {
    respuesta = await fetch(construirUrl(ruta), {
      method: metodo,
      headers: encabezados(cuerpo),
      body: cuerpoNormalizado(cuerpo),
      ...resto,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.');
  }

  const datos = await interpretar(respuesta);
  if (!respuesta.ok) {
    throw lanzarError(respuesta, datos);
  }
  return datos;
};

export const api = {
  get: (ruta) => ejecutar('GET', ruta),
  post: (ruta, cuerpo, opciones = {}) => ejecutar('POST', ruta, { ...opciones, cuerpo }),
  patch: (ruta, cuerpo) => ejecutar('PATCH', ruta, { cuerpo }),
  put: (ruta, cuerpo) => ejecutar('PUT', ruta, { cuerpo }),
  eliminar: (ruta) => ejecutar('DELETE', ruta),
  descargar: async (ruta, nombreArchivo) => {
    let respuesta;
    try {
      respuesta = await fetch(construirUrl(ruta), { headers: encabezados() });
    } catch {
      throw new Error('No se pudo conectar con el servidor para descargar el archivo.');
    }

    if (!respuesta.ok) {
      const datos = await interpretar(respuesta);
      throw lanzarError(respuesta, datos);
    }

    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  },
};
