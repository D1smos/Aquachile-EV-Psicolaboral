import crypto from 'node:crypto';
import { entorno } from '../../config/entorno.js';
import { ErrorHttp } from '../../utils/ErrorHttp.js';

const derivarClave = () =>
  crypto
    .createHash('sha256')
    .update(entorno.google.tokenEncryptionKey || entorno.jwt.secreto)
    .digest();

export const cifrarToken = (texto) => {
  if (!texto) {
    throw new ErrorHttp('No hay token de Google para cifrar', 500);
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivarClave(), iv);
  const cifrado = Buffer.concat([cipher.update(String(texto), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), tag.toString('base64url'), cifrado.toString('base64url')].join('.');
};

export const descifrarToken = (paquete) => {
  try {
    const [iv, tag, contenido] = String(paquete ?? '').split('.');
    if (!iv || !tag || !contenido) {
      throw new Error('Formato inválido');
    }
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      derivarClave(),
      Buffer.from(iv, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(contenido, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new ErrorHttp('No se pudo descifrar el token de Google', 500);
  }
};
