const escribir = (nivel, mensaje, contexto) => {
  const registro = { nivel, mensaje, momento: new Date().toISOString() };
  if (contexto && Object.keys(contexto).length > 0) {
    registro.contexto = contexto;
  }
  const salida = `${JSON.stringify(registro)}\n`;
  if (nivel === 'error' || nivel === 'warn') {
    process.stderr.write(salida);
    return;
  }
  process.stdout.write(salida);
};

export const logger = {
  info: (mensaje, contexto) => escribir('info', mensaje, contexto),
  warn: (mensaje, contexto) => escribir('warn', mensaje, contexto),
  error: (mensaje, contexto) => escribir('error', mensaje, contexto),
};
