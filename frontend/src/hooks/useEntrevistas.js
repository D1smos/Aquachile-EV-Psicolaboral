import { useCallback, useEffect, useState } from 'react';
import {
  actualizarEntrevista,
  crearEntrevista,
  eliminarEntrevista,
  listarEntrevistas,
  sincronizarEntrevista,
} from '../services/calendario.js';

const mensajeDeError = (error) => error?.message ?? 'No se pudo cargar la agenda.';

export default function useEntrevistas({ cargarAlIniciar = true } = {}) {
  const [entrevistas, setEntrevistas] = useState([]);
  const [cargando, setCargando] = useState(Boolean(cargarAlIniciar));
  const [error, setError] = useState(null);

  const cargar = useCallback(async (filtros = {}) => {
    setCargando(true);
    setError(null);
    try {
      const datos = await listarEntrevistas(filtros);
      setEntrevistas(datos?.entrevistas ?? []);
      return datos;
    } catch (capturado) {
      setError(mensajeDeError(capturado));
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (cargarAlIniciar) {
      cargar();
    }
  }, [cargar, cargarAlIniciar]);

  const crear = useCallback(async (payload) => {
    setError(null);
    try {
      const datos = await crearEntrevista(payload);
      if (datos?.entrevista) {
        setEntrevistas((previas) =>
          [...previas, datos.entrevista].sort((a, b) =>
            String(a.fechaInicio).localeCompare(String(b.fechaInicio)),
          ),
        );
      }
      return datos;
    } catch (capturado) {
      setError(mensajeDeError(capturado));
      throw capturado;
    }
  }, []);

  const actualizar = useCallback(async (id, payload) => {
    setError(null);
    try {
      const datos = await actualizarEntrevista(id, payload);
      if (datos?.entrevista) {
        setEntrevistas((previas) =>
          previas
            .map((entrevista) => (entrevista.id === id ? datos.entrevista : entrevista))
            .sort((a, b) => String(a.fechaInicio).localeCompare(String(b.fechaInicio))),
        );
      }
      return datos;
    } catch (capturado) {
      setError(mensajeDeError(capturado));
      throw capturado;
    }
  }, []);

  const sincronizar = useCallback(async (id) => {
    const datos = await sincronizarEntrevista(id);
    if (datos?.entrevista) {
      setEntrevistas((previas) =>
        previas.map((entrevista) => (entrevista.id === id ? datos.entrevista : entrevista)),
      );
    }
    return datos;
  }, []);

  const eliminar = useCallback(async (id) => {
    const datos = await eliminarEntrevista(id);
    setEntrevistas((previas) => previas.filter((entrevista) => entrevista.id !== id));
    return datos;
  }, []);

  return {
    entrevistas,
    cargando,
    error,
    cargar,
    crear,
    actualizar,
    sincronizar,
    eliminar,
  };
}
