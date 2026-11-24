import nodemailer from 'nodemailer';
import { entorno } from '../config/entorno.js';
import { ESTADOS_PROCESO } from '../domain/constantes.js';
import { logger } from '../utils/logger.js';

let transporte = null;
let avisoConfiguracionMostrado = false;

const escaparHtml = (valor) =>
  String(valor ?? '').replace(/[&<>"']/g, (caracter) => {
    const entidades = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entidades[caracter];
  });

const limpiarCabecera = (valor) => String(valor ?? '').replace(/[\r\n]+/g, ' ').trim();

export const requiereAvisoAprobacion = (anterior, actual) =>
  anterior?.estado !== ESTADOS_PROCESO.APROBADO &&
  actual?.estado === ESTADOS_PROCESO.APROBADO;

export const construirCorreoAprobacion = (candidato) => {
  const nombre = String(candidato?.nombre ?? '').trim() || 'postulante';
  const cargo = String(candidato?.cargo ?? '').trim();
  const folio = String(candidato?.folio ?? '').trim();
  const nombreHtml = escaparHtml(nombre);
  const cargoHtml = escaparHtml(cargo);
  const folioHtml = escaparHtml(folio);
  const asunto = limpiarCabecera(
    `Tu postulación${cargo ? ` a ${cargo}` : ''} fue aceptada · AquaChile`,
  );

  const texto = [
    `Hola ${nombre}:`,
    '',
    `Nos alegra informarte que tu postulación${cargo ? ` al cargo ${cargo}` : ''} en AquaChile fue aceptada.`,
    '',
    ...(folio ? [`Folio de seguimiento: ${folio}`, ''] : []),
    'El equipo de Reclutamiento te contactará para coordinar la fecha y hora de tu entrevista psicolaboral. Revisa tu teléfono y correo registrados, y confirma tu disponibilidad para presentarte.',
    '',
    'Gracias por tu interés en formar parte de AquaChile.',
    '',
    'Equipo de Reclutamiento',
    'AquaChile',
    '',
    'Este es un mensaje automático; por favor no respondas a este correo.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif;color:#16202b;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <div style="background:#062b4e;border-radius:14px 14px 0 0;padding:24px 30px;color:#ffffff;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#b9def4;">AquaChile · Reclutamiento</div>
        <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:700;">Tu postulación fue aceptada</h1>
      </div>
      <div style="background:#ffffff;padding:30px;border-radius:0 0 14px 14px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hola <strong>${nombreHtml}</strong>:</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Nos alegra informarte que tu postulación${cargoHtml ? ` al cargo <strong>${cargoHtml}</strong>` : ''} en AquaChile fue aceptada.
        </p>
        ${
          folioHtml
            ? `<div style="margin:22px 0;padding:14px 18px;background:#f2f9fe;border-left:4px solid #0f7bc4;border-radius:8px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7a8d;">Folio de seguimiento</div>
          <div style="margin-top:3px;font-size:17px;font-weight:700;color:#062b4e;">${folioHtml}</div>
        </div>`
            : ''
        }
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          El equipo de Reclutamiento te contactará para coordinar la fecha y hora de tu entrevista psicolaboral. Revisa tu teléfono y correo registrados y confirma tu disponibilidad para presentarte.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.6;">Gracias por tu interés en formar parte de AquaChile.</p>
      </div>
      <p style="margin:18px 4px 0;font-size:12px;line-height:1.5;color:#6b7a8d;text-align:center;">
        Este es un mensaje automático; por favor no respondas a este correo.
      </p>
    </div>
  </body>
</html>`;

  return { asunto, texto, html };
};

export const construirCorreoConfirmacion = (candidato, enlaceConsulta = '') => {
  const nombre = String(candidato?.nombre ?? '').trim() || 'postulante';
  const cargo = String(candidato?.cargo ?? '').trim();
  const folio = String(candidato?.folio ?? '').trim();
  const enlace = String(enlaceConsulta ?? '').trim();
  const nombreHtml = escaparHtml(nombre);
  const cargoHtml = escaparHtml(cargo);
  const folioHtml = escaparHtml(folio);
  const enlaceHtml = escaparHtml(enlace);
  const asunto = limpiarCabecera(
    `Recibimos tu postulación${cargo ? ` a ${cargo}` : ''} · AquaChile`,
  );

  const texto = [
    `Hola ${nombre}:`,
    '',
    `Recibimos correctamente tu postulación${cargo ? ` al cargo ${cargo}` : ''} en AquaChile.`,
    '',
    ...(folio ? [`Folio de seguimiento: ${folio}`, ''] : []),
    'Guarda este folio. Para revisar el avance de tu proceso, ingresa a la consulta de estado con tu folio y tu RUT.',
    ...(enlace ? ['', `Consulta el estado aquí: ${enlace}`] : []),
    '',
    'La información que enviaste se usa exclusivamente para este proceso de selección y se conserva por 12 meses. Puedes revisar la política de privacidad en el portal.',
    '',
    'Gracias por tu interés en formar parte de AquaChile.',
    '',
    'Equipo de Reclutamiento',
    'AquaChile',
    '',
    'Este es un mensaje automático; por favor no respondas a este correo.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f7fa;font-family:Arial,Helvetica,sans-serif;color:#16202b;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <div style="background:#062b4e;border-radius:14px 14px 0 0;padding:24px 30px;color:#ffffff;">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#b9def4;">AquaChile · Reclutamiento</div>
        <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:700;">Recibimos tu postulación</h1>
      </div>
      <div style="background:#ffffff;padding:30px;border-radius:0 0 14px 14px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hola <strong>${nombreHtml}</strong>:</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Recibimos correctamente tu postulación${cargoHtml ? ` al cargo <strong>${cargoHtml}</strong>` : ''} en AquaChile.
        </p>
        ${
          folioHtml
            ? `<div style="margin:22px 0;padding:14px 18px;background:#f2f9fe;border-left:4px solid #0f7bc4;border-radius:8px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7a8d;">Folio de seguimiento</div>
          <div style="margin-top:3px;font-size:17px;font-weight:700;color:#062b4e;">${folioHtml}</div>
        </div>`
            : ''
        }
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Guarda este folio. Para revisar el avance de tu proceso, ingresa a la consulta de estado con tu folio y tu RUT.
        </p>
        ${
          enlaceHtml
            ? `<p style="margin:0 0 18px;"><a href="${enlaceHtml}" style="display:inline-block;padding:11px 18px;border-radius:9px;background:#0f7bc4;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Consultar estado</a></p>`
            : ''
        }
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7a8d;">
          La información que enviaste se usa exclusivamente para este proceso de selección y se conserva por 12 meses. Puedes revisar la política de privacidad en el portal.
        </p>
      </div>
      <p style="margin:18px 4px 0;font-size:12px;line-height:1.5;color:#6b7a8d;text-align:center;">
        Este es un mensaje automático; por favor no respondas a este correo.
      </p>
    </div>
  </body>
</html>`;

  return { asunto, texto, html };
};

const obtenerTransporte = () => {
  if (transporte) {
    return transporte;
  }
  transporte = nodemailer.createTransport({
    host: entorno.correo.host,
    port: entorno.correo.puerto,
    secure: entorno.correo.seguro,
    auth: entorno.correo.usuario
      ? { user: entorno.correo.usuario, pass: entorno.correo.clave }
      : undefined,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
  return transporte;
};

const remitente = () => entorno.correo.remitente || entorno.correo.usuario;

const enviarCorreo = async (candidato, construir, etiqueta) => {
  const destinatario = String(candidato?.correo ?? '').trim();
  if (!destinatario) {
    return { enviado: false, motivo: 'El candidato no tiene un correo registrado' };
  }
  if (!entorno.correo.host || !remitente()) {
    if (!avisoConfiguracionMostrado) {
      avisoConfiguracionMostrado = true;
      logger.warn('Correo automático omitido: configura SMTP_HOST y SMTP_FROM en backend/.env');
    }
    return { enviado: false, configurado: false, motivo: 'SMTP no configurado' };
  }

  const { asunto, texto, html } = construir(candidato);
  try {
    await obtenerTransporte().sendMail({
      from: remitente(),
      to: destinatario,
      replyTo: entorno.correo.responderA || undefined,
      subject: asunto,
      text: texto,
      html,
    });
    logger.info(`Correo de ${etiqueta} enviado`, { candidatoId: candidato.id });
    return { enviado: true, destinatario };
  } catch (error) {
    logger.error(`No se pudo enviar el correo de ${etiqueta}`, {
      candidatoId: candidato.id,
      error: error.message,
    });
    return {
      enviado: false,
      configurado: true,
      motivo: 'No se pudo enviar el correo; revisa la configuración SMTP',
    };
  }
};

export const enviarCorreoAprobacion = async (candidato) =>
  enviarCorreo(candidato, construirCorreoAprobacion, 'aprobación');

export const enviarCorreoConfirmacion = async (candidato) =>
  enviarCorreo(
    candidato,
    (destinatario) =>
      construirCorreoConfirmacion(
        destinatario,
        entorno.urlPublica ? `${entorno.urlPublica}/consulta` : '',
      ),
    'confirmación',
  );
