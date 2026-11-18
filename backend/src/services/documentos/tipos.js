import path from 'node:path';

export const EXTENSIONES_DOCUMENTO = Object.freeze(['.pdf', '.doc', '.docx', '.xlsx']);
export const EXTENSIONES_EXTRAIBLES = Object.freeze(['.pdf', '.docx']);

export const MIME_POR_EXTENSION = Object.freeze({
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

export const MIME_DOCUMENTO = Object.freeze(Object.values(MIME_POR_EXTENSION));

export const extensionDe = (archivo) =>
  path.extname(archivo?.originalname || archivo?.filename || archivo?.path || '').toLowerCase();

export const esExtensionExtraible = (nombre) =>
  EXTENSIONES_EXTRAIBLES.includes(path.extname(String(nombre ?? '')).toLowerCase());
