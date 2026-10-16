import { crearApp } from './src/app.js';
import { entorno } from './src/config/entorno.js';
import { inicializarBaseDatos } from './src/services/seed.service.js';
import { logger } from './src/utils/logger.js';

const terminar = (servidor, senal) => () => {
  servidor.close(() => {
    logger.info(`Servicio detenido por ${senal}`);
    process.exit(0);
  });
};

const arrancar = async () => {
  await inicializarBaseDatos();

  const servidor = crearApp().listen(entorno.puerto, () => {
    logger.info(`API de evaluaciones psicolaborales escuchando en el puerto ${entorno.puerto}`);
  });

  process.once('SIGINT', terminar(servidor, 'SIGINT'));
  process.once('SIGTERM', terminar(servidor, 'SIGTERM'));
};

process.on('unhandledRejection', (motivo) => {
  logger.error('Promesa rechazada sin manejar', { motivo: String(motivo) });
});

arrancar().catch((error) => {
  logger.error('No fue posible iniciar el servicio', { mensaje: error.message });
  process.exit(1);
});
