import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ContextoToast = createContext(null);

const DURACION_MS = 4500;
let contadorAvisos = 0;

const ICONOS = {
  exito: 'bi-check-circle-fill',
  error: 'bi-x-circle-fill',
  advertencia: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

const TITULOS = {
  exito: 'Listo',
  error: 'Error',
  advertencia: 'Atención',
  info: 'Información',
};

function Aviso({ aviso, onCerrar }) {
  return (
    <div className={`notificacion notificacion-${aviso.tipo}`} role="status" aria-live="polite">
      <i className={`bi ${ICONOS[aviso.tipo] ?? ICONOS.info} notificacion-icono`} aria-hidden="true" />
      <div className="notificacion-cuerpo">
        <strong className="notificacion-titulo">{aviso.titulo ?? TITULOS[aviso.tipo] ?? TITULOS.info}</strong>
        <span className="notificacion-mensaje">{aviso.mensaje}</span>
      </div>
      <button
        type="button"
        className="notificacion-cerrar"
        aria-label="Cerrar notificación"
        onClick={() => onCerrar(aviso.id)}
      >
        <i className="bi bi-x-lg" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const temporizadores = useRef(new Map());

  const cerrarToast = useCallback((id) => {
    setAvisos((previos) => previos.filter((aviso) => aviso.id !== id));
    const temporizador = temporizadores.current.get(id);
    if (temporizador) {
      clearTimeout(temporizador);
      temporizadores.current.delete(id);
    }
  }, []);

  const mostrarToast = useCallback(
    (mensaje, tipo = 'info', titulo) => {
      contadorAvisos += 1;
      const id = contadorAvisos;
      setAvisos((previos) => [...previos, { id, mensaje, tipo, titulo }]);
      temporizadores.current.set(id, setTimeout(() => cerrarToast(id), DURACION_MS));
      return id;
    },
    [cerrarToast],
  );

  useEffect(() => {
    const mapa = temporizadores.current;
    return () => {
      mapa.forEach((temporizador) => clearTimeout(temporizador));
    };
  }, []);

  const valor = useMemo(
    () => ({ avisos, mostrarToast, cerrarToast }),
    [avisos, mostrarToast, cerrarToast],
  );

  return (
    <ContextoToast.Provider value={valor}>
      {children}
      <div className="contenedor-notificaciones" aria-label="Notificaciones">
        {avisos.map((aviso) => (
          <Aviso key={aviso.id} aviso={aviso} onCerrar={cerrarToast} />
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

export const useToast = () => {
  const contexto = useContext(ContextoToast);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return contexto;
};
