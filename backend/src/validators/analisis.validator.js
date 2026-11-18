const ESTADOS_REVISION = ['revisado', 'descartado'];

export const validarSolicitudAnalisis = (cuerpo = {}) => {
  const errores = [];
  if (cuerpo.archivoId !== undefined && cuerpo.archivoId !== null && typeof cuerpo.archivoId !== 'string') {
    errores.push({ campo: 'archivoId', mensaje: 'archivoId debe ser texto' });
  }
  if (cuerpo.cargo !== undefined && cuerpo.cargo !== null) {
    const cargo = String(cuerpo.cargo).trim();
    if (cargo.length > 120) {
      errores.push({ campo: 'cargo', mensaje: 'El cargo no supera los 120 caracteres' });
    }
  }
  if (cuerpo.forzar !== undefined && typeof cuerpo.forzar !== 'boolean') {
    errores.push({ campo: 'forzar', mensaje: 'forzar debe ser booleano' });
  }
  return errores;
};

export const validarRevision = (cuerpo = {}) => {
  const errores = [];
  if (!ESTADOS_REVISION.includes(cuerpo.estado)) {
    errores.push({ campo: 'estado', mensaje: 'estado debe ser "revisado" o "descartado"' });
  }
  if (cuerpo.comentario !== undefined && cuerpo.comentario !== null) {
    if (String(cuerpo.comentario).length > 1000) {
      errores.push({ campo: 'comentario', mensaje: 'El comentario no supera los 1000 caracteres' });
    }
  }
  return errores;
};
