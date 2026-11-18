import { entorno } from '../config/entorno.js';

const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const enviarCorreoResend = async ({ to, subject, html }) => {
  if (!entorno.resend.apiKey || !to) {
    return { enviado: false, motivo: 'RESEND_API_KEY o destinatario no configurado' };
  }
  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${entorno.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: entorno.resend.fromEmail, to, subject, html }),
    });
    const datos = await respuesta.json().catch(() => null);
    return respuesta.ok
      ? { enviado: true, id: datos?.id ?? null }
      : { enviado: false, motivo: datos?.message ?? `Resend HTTP ${respuesta.status}` };
  } catch (error) {
    return { enviado: false, motivo: error.message };
  }
};

export const notificarNuevaPostulacion = async ({ nombre, email, cargo, folio }) => {
  const nombreSeguro = esc(nombre);
  const cargoSeguro = esc(cargo);
  const folioSeguro = esc(folio);
  const postulante = await enviarCorreoResend({
    to: email,
    subject: `Recibimos tu postulación${cargo ? ` a ${cargo}` : ''} · AquaChile`,
    html: `<p>Hola ${nombreSeguro}:</p><p>Tu postulación${cargo ? ` al cargo <strong>${cargoSeguro}</strong>` : ''} en AquaChile se envió con éxito.</p><p>Folio: <strong>${folioSeguro}</strong></p>`,
  });
  const encargado = await enviarCorreoResend({
    to: entorno.resend.encargadoEmail,
    subject: `Nueva postulación: ${cargo || 'sin cargo'} · ${folio || 'sin folio'}`,
    html: `<p>Nueva postulación de <strong>${nombreSeguro}</strong>${email ? ` (${esc(email)})` : ''}.</p><p>Cargo: ${cargoSeguro || 'no indicado'}</p><p>Folio: ${folioSeguro || 'no indicado'}</p>`,
  });
  return { postulante, encargado };
};
