import { unlink } from 'node:fs/promises';

export const descartarArchivos = async (archivos = {}) => {
  const lista = Object.values(archivos ?? {}).flat().filter(Boolean);
  await Promise.all(
    lista.map((archivo) =>
      archivo?.path ? unlink(archivo.path).catch(() => undefined) : Promise.resolve(),
    ),
  );
};
