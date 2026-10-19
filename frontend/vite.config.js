import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), '');
  const destinoApi = entorno.VITE_API_PROXY_TARGET;
  const puerto = Number(entorno.VITE_PORT) || 5173;

  return {
    plugins: [react()],
    server: {
      port: puerto,
      strictPort: false,
      proxy: destinoApi
        ? {
            '/api': {
              target: destinoApi,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    preview: {
      port: puerto,
    },
  };
});
