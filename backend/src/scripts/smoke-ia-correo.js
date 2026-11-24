import { entorno } from '../config/entorno.js';
import { consultarOpenRouter } from '../services/ia/proveedor.js';
import { enviarCorreoResend } from '../services/resend.service.js';
import { logger } from '../utils/logger.js';

const argumento = process.argv.find((valor) => valor.startsWith('--correo='));
const destino = (argumento?.split('=')[1] || process.env.SMOKE_CORREO || entorno.resend.encargadoEmail || '').trim();
const soloIa = process.argv.includes('--solo-ia');
const soloCorreo = process.argv.includes('--solo-correo');
const ejecutarIa = !soloCorreo;
const ejecutarCorreo = !soloIa;

const resumen = {
  ia: { estado: 'omitido', modelo: null, latenciaMs: null, error: null },
  correo: { estado: 'omitido', destinatario: destino || null, id: null, error: null },
};

const probarIa = async () => {
  if (!entorno.ia.habilitada || !entorno.ia.apiKey) {
    resumen.ia.estado = 'error';
    resumen.ia.error = !entorno.ia.habilitada
      ? 'Falta IA_HABILITADA=true en backend/.env'
      : 'Falta LLM_API_KEY en backend/.env';
    return;
  }
  const inicio = Date.now();
  try {
    const respuesta = await consultarOpenRouter({
      modelo: entorno.ia.modelo,
      prompt: {
        sistema:
          'Responde solo JSON válido, sin markdown. Eres un verificador de conectividad.',
        usuario:
          'Devuelve exactamente {"ok":true,"mensaje":"conectividad verificada"} y nada más.',
      },
    });
    const json = respuesta?.json ?? {};
    if (json.ok !== true) {
      throw new Error('La IA respondió sin el campo ok=true');
    }
    resumen.ia.estado = 'ok';
    resumen.ia.modelo = respuesta.modelo ?? entorno.ia.modelo;
    resumen.ia.latenciaMs = Date.now() - inicio;
  } catch (error) {
    resumen.ia.estado = 'error';
    resumen.ia.latenciaMs = Date.now() - inicio;
    resumen.ia.error = error.message;
  }
};

const probarCorreo = async () => {
  if (!entorno.resend.apiKey) {
    resumen.correo.estado = 'error';
    resumen.correo.error = 'Falta RESEND_API_KEY en backend/.env';
    return;
  }
  if (!destino) {
    resumen.correo.estado = 'error';
    resumen.correo.error = 'Indica --correo=destino@dominio.cl o configura SMOKE_CORREO';
    return;
  }
  try {
    const resultado = await enviarCorreoResend({
      to: destino,
      subject: 'Smoke test AquaChile · IA y correo',
      html: '<p>Prueba de conectividad de AquaChile.</p><p>Si recibes este correo, Resend está operativo.</p>',
    });
    if (resultado.enviado) {
      resumen.correo.estado = 'ok';
      resumen.correo.id = resultado.id;
    } else {
      resumen.correo.estado = 'error';
      resumen.correo.error = resultado.motivo;
    }
  } catch (error) {
    resumen.correo.estado = 'error';
    resumen.correo.error = error.message;
  }
};

const pruebas = [];
if (ejecutarIa) pruebas.push(probarIa());
if (ejecutarCorreo) pruebas.push(probarCorreo());
await Promise.all(pruebas);

console.log(JSON.stringify(resumen, null, 2));

if (ejecutarIa && resumen.ia.estado === 'error') {
  logger.error('Smoke IA falló', { error: resumen.ia.error });
}
if (ejecutarCorreo && resumen.correo.estado === 'error') {
  logger.error('Smoke correo falló', { error: resumen.correo.error });
}
const fallo = (ejecutarIa && resumen.ia.estado === 'error') || (ejecutarCorreo && resumen.correo.estado === 'error');
process.exit(fallo ? 1 : 0);
