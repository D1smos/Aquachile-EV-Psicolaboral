import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { entorno } from './config/entorno.js';
import { manejarError, manejarNoEncontrado } from './middlewares/errores.js';
import { rutasApi } from './routes/index.js';

const configurarRespuestaFrontend = (app) => {
  const indice = path.join(entorno.directorios.frontend, 'index.html');
  if (!entorno.servirFrontend || !existsSync(indice)) {
    return;
  }
  app.use(express.static(entorno.directorios.frontend));
  app.get('*', (req, res, siguiente) => {
    if (req.path.startsWith('/api')) {
      siguiente();
      return;
    }
    res.sendFile(indice);
  });
};

export const crearApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  if (entorno.corsOrigenes.length > 0) {
    app.use(cors({ origin: entorno.corsOrigenes }));
  }

  app.use(express.json({ limit: '20kb' }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));

  app.use('/api', rutasApi);

  configurarRespuestaFrontend(app);

  app.use(manejarNoEncontrado);
  app.use(manejarError);

  return app;
};
