import { reiniciarDemo } from '../services/seed.service.js';
import { logger } from '../utils/logger.js';

reiniciarDemo()
  .then((candidatos) => {
    logger.info(`Demo reiniciada correctamente con ${candidatos.length} candidatos validos.`);
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Error al reiniciar los datos de demostracion', { mensaje: error.message });
    process.exit(1);
  });
