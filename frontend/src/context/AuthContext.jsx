import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, guardarToken, limpiarToken, obtenerToken } from '../services/api.js';
import { useToast } from './ToastContext.jsx';

const ContextoAuth = createContext(null);
const CLAVE_USUARIO = 'aquachile_usuario';

const leerUsuario = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    localStorage.removeItem(CLAVE_USUARIO);
    return null;
  }
};

const guardarUsuario = (usuario) => localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));

const borrarSesion = () => {
  limpiarToken();
  localStorage.removeItem(CLAVE_USUARIO);
};

export function AuthProvider({ children }) {
  const { mostrarToast } = useToast();
  const [usuario, setUsuario] = useState(leerUsuario);
  const [verificando, setVerificando] = useState(() => Boolean(obtenerToken()));

  useEffect(() => {
    if (!obtenerToken()) {
      return undefined;
    }

    let activo = true;
    api
      .get('/auth/perfil')
      .then((datos) => {
        if (activo) {
          setUsuario(datos.usuario);
          guardarUsuario(datos.usuario);
        }
      })
      .catch(() => {
        if (activo) {
          borrarSesion();
          setUsuario(null);
          mostrarToast('Tu sesión expiró, vuelve a iniciar sesión', 'advertencia');
        }
      })
      .finally(() => {
        if (activo) {
          setVerificando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [mostrarToast]);

  const iniciarSesion = useCallback(async (credenciales) => {
    const datos = await api.post('/auth/login', credenciales);
    guardarToken(datos.token);
    guardarUsuario(datos.usuario);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      verificando,
      autenticado: Boolean(usuario),
      iniciarSesion,
      cerrarSesion,
    }),
    [usuario, verificando, iniciarSesion, cerrarSesion],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export const useAuth = () => {
  const contexto = useContext(ContextoAuth);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
};
