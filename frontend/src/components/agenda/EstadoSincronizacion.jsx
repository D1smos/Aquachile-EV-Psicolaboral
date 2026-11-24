import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import {
  desconectarGoogle,
  obtenerUrlConexionGoogle,
} from '../../services/calendario.js';

export default function EstadoSincronizacion({ estado, puedeGestionar, onActualizar }) {
  const { mostrarToast } = useToast();
  const [procesando, setProcesando] = useState(false);

  const conectar = async () => {
    setProcesando(true);
    try {
      const datos = await obtenerUrlConexionGoogle();
      if (datos?.url) {
        window.location.assign(datos.url);
        return;
      }
      mostrarToast('No se pudo iniciar la conexión con Google', 'error');
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const desconectar = async () => {
    setProcesando(true);
    try {
      await desconectarGoogle();
      mostrarToast('Google Calendar desconectado', 'exito');
      await onActualizar?.();
    } catch (capturado) {
      mostrarToast(capturado.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const conectado = Boolean(estado?.conectado);
  const configurado = Boolean(estado?.configurado);
  const habilitado = Boolean(estado?.habilitado);

  return (
    <section className="agenda-sync" aria-label="Sincronización con Google Calendar">
      <div className="agenda-sync-icono" aria-hidden="true">
        <i className={`bi ${conectado ? 'bi-calendar2-check-fill' : 'bi-google'}`} />
      </div>
      <div className="agenda-sync-texto">
        <h2>Google Calendar</h2>
        {!habilitado && (
          <p>
            La sincronización está deshabilitada. Las entrevistas se guardan localmente y quedan
            pendientes.
          </p>
        )}
        {habilitado && !configurado && (
          <p>Faltan las credenciales OAuth de Google en el servidor.</p>
        )}
        {habilitado && configurado && conectado && (
          <p>
            Cuenta conectada. Los eventos y enlaces de Meet se crean automáticamente al agendar.
          </p>
        )}
        {habilitado && configurado && !conectado && (
          <p>Conecta la cuenta para crear eventos y enlaces de Meet.</p>
        )}
      </div>
      {puedeGestionar && habilitado && configurado && (
        <div className="agenda-sync-acciones">
          {conectado ? (
            <button
              type="button"
              className="boton boton-secundario boton-sm"
              onClick={desconectar}
              disabled={procesando}
            >
              <i className="bi bi-plug" aria-hidden="true" /> Desconectar
            </button>
          ) : (
            <button
              type="button"
              className="boton boton-primario boton-sm"
              onClick={conectar}
              disabled={procesando}
            >
              <i className="bi bi-google" aria-hidden="true" /> Conectar Google
            </button>
          )}
        </div>
      )}
    </section>
  );
}
