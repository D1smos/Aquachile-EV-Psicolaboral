import { useCallback, useEffect, useState } from 'react';
import {
  generarAnalisisIA,
  obtenerAnalisisIA,
  revisarAnalisisIA,
} from '../services/analisisIA.js';

const mensajeDeError = (error) =>
  error?.message ?? 'No se pudo procesar el análisis con IA.';

export default function useAnalisisIA(candidatoId, { cargarAlIniciar = true } = {}) {
  const [analisis, setAnalisis] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(Boolean(candidatoId && cargarAlIniciar));
  const [error, setError] = useState(null);
  const [cacheHit, setCacheHit] = useState(false);

  const cargar = useCallback(async () => {
    if (!candidatoId) {
      setAnalisis(null);
      setHistorial([]);
      return null;
    }
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerAnalisisIA(candidatoId);
      setAnalisis(datos?.ultimo ?? null);
      setHistorial(datos?.historial ?? []);
      setCacheHit(false);
      return datos;
    } catch (capturado) {
      setError(mensajeDeError(capturado));
      return null;
    } finally {
      setCargando(false);
    }
  }, [candidatoId]);

  useEffect(() => {
    if (cargarAlIniciar) {
      cargar();
    }
  }, [cargar, cargarAlIniciar]);

  const generar = useCallback(
    async (payload = {}) => {
      if (!candidatoId) {
        setError('Selecciona un candidato para generar el análisis.');
        return null;
      }
      setCargando(true);
      setError(null);
      try {
        const datos = await generarAnalisisIA(candidatoId, payload);
        const nuevo = datos?.analisis ?? null;
        setAnalisis(nuevo);
        setCacheHit(Boolean(datos?.cacheHit));
        if (nuevo) {
          setHistorial((previos) => [
            nuevo,
            ...previos.filter((elemento) => elemento.id !== nuevo.id),
          ]);
        }
        return datos;
      } catch (capturado) {
        setError(mensajeDeError(capturado));
        return null;
      } finally {
        setCargando(false);
      }
    },
    [candidatoId],
  );

  const forzar = useCallback(
    (payload = {}) => generar({ ...payload, forzar: true }),
    [generar],
  );

  const revisar = useCallback(
    async (payload = {}) => {
      if (!analisis?.id) {
        setError('No hay un análisis disponible para revisar.');
        return null;
      }
      setCargando(true);
      setError(null);
      try {
        const datos = await revisarAnalisisIA(analisis.id, payload);
        const actualizado = datos?.analisis ?? null;
        if (actualizado) {
          setAnalisis(actualizado);
          setHistorial((previos) =>
            previos.map((elemento) =>
              elemento.id === actualizado.id ? actualizado : elemento,
            ),
          );
        }
        return datos;
      } catch (capturado) {
        setError(mensajeDeError(capturado));
        return null;
      } finally {
        setCargando(false);
      }
    },
    [analisis],
  );

  return {
    analisis,
    historial,
    cargando,
    error,
    cacheHit,
    cargar,
    generar,
    forzar,
    revisar,
  };
}
