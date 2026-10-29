import { mkdirSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { entorno } from './entorno.js';

const NOMBRE_BD = 'aquachile.db';

const COLUMNAS_CANDIDATO = [
  'id',
  'folio',
  'nombre',
  'rut',
  'correo',
  'telefono',
  'familiaCargo',
  'cargo',
  'formacion',
  'aniosExperiencia',
  'disponibilidad',
  'motivacion',
  'consentimiento',
  'fechaConsentimiento',
  'estado',
  'respuestas',
  'puntaje',
  'dimensiones',
  'idoneidad',
  'observaciones',
  'evaluadoPor',
  'fechaEvaluacion',
  'resumenIA',
  'afinidadIA',
  'borradorIA',
  'fechaAsistencia',
  'fechaPostulacion',
  'fechaActualizacion',
];

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    rol TEXT NOT NULL,
    creadoEn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS candidatos (
    id TEXT PRIMARY KEY,
    folio TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    rut TEXT NOT NULL,
    correo TEXT NOT NULL,
    telefono TEXT NOT NULL,
    familiaCargo TEXT NOT NULL,
    cargo TEXT NOT NULL,
    formacion TEXT NOT NULL,
    aniosExperiencia INTEGER NOT NULL,
    disponibilidad TEXT NOT NULL,
    motivacion TEXT NOT NULL DEFAULT '',
    consentimiento INTEGER NOT NULL DEFAULT 0,
    fechaConsentimiento TEXT,
    estado TEXT NOT NULL,
    respuestas TEXT,
    puntaje REAL,
    dimensiones TEXT NOT NULL DEFAULT '[]',
    idoneidad TEXT,
    observaciones TEXT,
    evaluadoPor TEXT,
    fechaEvaluacion TEXT,
    resumenIA TEXT,
    afinidadIA REAL,
    borradorIA TEXT,
    fechaAsistencia TEXT,
    fechaPostulacion TEXT NOT NULL,
    fechaActualizacion TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS archivos (
    id TEXT PRIMARY KEY,
    candidatoId TEXT NOT NULL REFERENCES candidatos(id),
    tipo TEXT NOT NULL,
    nombreOriginal TEXT NOT NULL,
    nombreAlmacenado TEXT NOT NULL,
    ruta TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    tamano INTEGER NOT NULL,
    creadoEn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS historial_etapas (
    id TEXT PRIMARY KEY,
    candidatoId TEXT NOT NULL REFERENCES candidatos(id),
    etapaAnterior TEXT,
    etapaNueva TEXT NOT NULL,
    responsable TEXT,
    motivo TEXT,
    creadoEn TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_archivos_candidato ON archivos(candidatoId);
  CREATE INDEX IF NOT EXISTS idx_historial_candidato ON historial_etapas(candidatoId, creadoEn);
`;

const rutaBd = () => path.join(entorno.directorios.datos, NOMBRE_BD);

let instancia = null;

const obtenerBd = () => {
  if (!instancia) {
    mkdirSync(entorno.directorios.datos, { recursive: true });
    instancia = new DatabaseSync(rutaBd());
    instancia.exec('PRAGMA foreign_keys = ON;');
    instancia.exec(ESQUEMA);
    const columnas = instancia.prepare('PRAGMA table_info(candidatos)').all().map((fila) => fila.name);
    if (!columnas.includes('consentimiento')) {
      instancia.exec('ALTER TABLE candidatos ADD COLUMN consentimiento INTEGER NOT NULL DEFAULT 0');
    }
    if (!columnas.includes('fechaConsentimiento')) {
      instancia.exec('ALTER TABLE candidatos ADD COLUMN fechaConsentimiento TEXT');
    }
  }
  return instancia;
};

const leerJson = (texto, defecto) => {
  if (texto === null || texto === undefined) {
    return defecto;
  }
  try {
    return JSON.parse(texto);
  } catch {
    return defecto;
  }
};

const aCandidato = (fila, archivos = []) => ({
  ...fila,
  respuestas: leerJson(fila.respuestas, null),
  dimensiones: leerJson(fila.dimensiones, []),
  consentimiento: Boolean(fila.consentimiento),
  archivos: archivos.map((archivo) => ({ ...archivo })),
});

const filaCandidato = (datos) => {
  const fila = {};
  for (const columna of COLUMNAS_CANDIDATO) {
    if (datos[columna] === undefined) {
      continue;
    }
    if (columna === 'respuestas' || columna === 'dimensiones') {
      fila[columna] = datos[columna] === null ? null : JSON.stringify(datos[columna]);
    } else {
      fila[columna] = datos[columna];
    }
  }
  return fila;
};

export const dbUsuarios = {
  contar: async () =>
    Number(obtenerBd().prepare('SELECT COUNT(*) AS total FROM usuarios').get()?.total ?? 0),
  buscarPorEmail: async (email) => {
    const fila = obtenerBd()
      .prepare('SELECT * FROM usuarios WHERE email = ?')
      .get(String(email ?? '').trim().toLowerCase());
    return fila ? { ...fila } : null;
  },
  obtenerPorId: async (id) => {
    const fila = obtenerBd().prepare('SELECT * FROM usuarios WHERE id = ?').get(String(id));
    return fila ? { ...fila } : null;
  },
  insertar: async (usuario) => {
    obtenerBd()
      .prepare('INSERT INTO usuarios (id, nombre, email, passwordHash, rol, creadoEn) VALUES (?, ?, ?, ?, ?, ?)')
      .run(usuario.id, usuario.nombre, usuario.email, usuario.passwordHash, usuario.rol, usuario.creadoEn);
    return { ...usuario };
  },
};

export const dbArchivos = {
  listarPorCandidato: async (candidatoId) =>
    obtenerBd()
      .prepare('SELECT * FROM archivos WHERE candidatoId = ? ORDER BY creadoEn ASC')
      .all(String(candidatoId))
      .map((archivo) => ({ ...archivo })),
  insertar: async (candidatoId, archivo) => {
    obtenerBd()
      .prepare(
        'INSERT INTO archivos (id, candidatoId, tipo, nombreOriginal, nombreAlmacenado, ruta, mimetype, tamano, creadoEn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        archivo.id,
        String(candidatoId),
        archivo.tipo,
        archivo.nombreOriginal,
        archivo.nombreAlmacenado,
        archivo.ruta,
        archivo.mimetype,
        archivo.tamano,
        archivo.creadoEn,
      );
    return { ...archivo };
  },
};

export const dbCandidatos = {
  contar: async () =>
    Number(obtenerBd().prepare('SELECT COUNT(*) AS total FROM candidatos').get()?.total ?? 0),
  listarTodos: async () => {
    const filas = obtenerBd()
      .prepare('SELECT * FROM candidatos ORDER BY fechaPostulacion DESC')
      .all();
    return filas.map((fila) => aCandidato(fila));
  },
  obtenerPorId: async (id) => {
    const fila = obtenerBd().prepare('SELECT * FROM candidatos WHERE id = ?').get(String(id));
    if (!fila) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(fila.id);
    return aCandidato(fila, archivos);
  },
  buscarPorFolio: async (folio) => {
    const fila = obtenerBd()
      .prepare('SELECT * FROM candidatos WHERE folio = ?')
      .get(String(folio ?? '').trim().toUpperCase());
    if (!fila) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(fila.id);
    return aCandidato(fila, archivos);
  },
  buscarPorRut: async (rut) => {
    const fila = obtenerBd()
      .prepare('SELECT * FROM candidatos WHERE rut = ?')
      .get(String(rut ?? '').trim());
    if (!fila) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(fila.id);
    return aCandidato(fila, archivos);
  },
  buscarPorEmail: async (email) => {
    const fila = obtenerBd()
      .prepare('SELECT * FROM candidatos WHERE correo = ?')
      .get(String(email ?? '').trim().toLowerCase());
    if (!fila) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(fila.id);
    return aCandidato(fila, archivos);
  },
  eliminar: async (id) => {
    const bd = obtenerBd();
    const clave = String(id);
    bd.prepare('DELETE FROM archivos WHERE candidatoId = ?').run(clave);
    bd.prepare('DELETE FROM historial_etapas WHERE candidatoId = ?').run(clave);
    return bd.prepare('DELETE FROM candidatos WHERE id = ?').run(clave).changes > 0;
  },
  insertar: async (candidato) => {
    const fila = filaCandidato(candidato);
    const columnas = Object.keys(fila);
    obtenerBd()
      .prepare(`INSERT INTO candidatos (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`)
      .run(...columnas.map((columna) => fila[columna]));
    return aCandidato({ ...fila, respuestas: fila.respuestas ?? null, dimensiones: fila.dimensiones ?? '[]' }, []);
  },
  actualizar: async (id, cambios) => {
    const fila = filaCandidato(cambios);
    delete fila.id;
    const columnas = Object.keys(fila);
    if (columnas.length === 0) {
      return dbCandidatos.obtenerPorId(id);
    }
    const resultado = obtenerBd()
      .prepare(`UPDATE candidatos SET ${columnas.map((columna) => `${columna} = ?`).join(', ')} WHERE id = ?`)
      .run(...columnas.map((columna) => fila[columna]), String(id));
    if (resultado.changes === 0) {
      return null;
    }
    return dbCandidatos.obtenerPorId(id);
  },
};

export const dbHistorial = {
  registrar: async ({ candidatoId, etapaAnterior, etapaNueva, responsable, motivo }) => {
    const evento = {
      id: crypto.randomUUID(),
      candidatoId: String(candidatoId),
      etapaAnterior: etapaAnterior ?? null,
      etapaNueva: String(etapaNueva),
      responsable: responsable ?? null,
      motivo: motivo ?? null,
      creadoEn: new Date().toISOString(),
    };
    obtenerBd()
      .prepare(
        'INSERT INTO historial_etapas (id, candidatoId, etapaAnterior, etapaNueva, responsable, motivo, creadoEn) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        evento.id,
        evento.candidatoId,
        evento.etapaAnterior,
        evento.etapaNueva,
        evento.responsable,
        evento.motivo,
        evento.creadoEn,
      );
    return evento;
  },
  listarPorCandidato: async (candidatoId) =>
    obtenerBd()
      .prepare('SELECT * FROM historial_etapas WHERE candidatoId = ? ORDER BY creadoEn ASC')
      .all(String(candidatoId))
      .map((evento) => ({ ...evento })),
};

const existeTabla = (nombre) =>
  obtenerBd()
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(nombre) !== undefined;

export const migrarLegado = async () => {
  if (!existeTabla('registros')) {
    return 0;
  }
  const bd = obtenerBd();
  const documentos = bd.prepare("SELECT datos FROM registros WHERE coleccion = 'candidatos'").all();
  const usuarios = bd.prepare("SELECT datos FROM registros WHERE coleccion = 'usuarios'").all();
  let importados = 0;
  for (const { datos } of usuarios) {
    const usuario = JSON.parse(datos);
    try {
      await dbUsuarios.insertar(usuario);
      importados += 1;
    } catch {
      continue;
    }
  }
  for (const { datos } of documentos) {
    const documento = JSON.parse(datos);
    const { archivos = [], ...candidato } = documento;
    try {
      await dbCandidatos.insertar({ ...candidato, dimensiones: candidato.dimensiones ?? [] });
      for (const archivo of archivos) {
        try {
          await dbArchivos.insertar(documento.id, archivo);
        } catch {
          continue;
        }
      }
      importados += 1;
    } catch {
      continue;
    }
  }
  bd.exec('DROP TABLE registros;');
  return importados;
};

export const migrarJsonSiExiste = async () => {
  if ((await dbCandidatos.contar()) > 0) {
    return 0;
  }
  let entradas = [];
  try {
    entradas = readdirSync(entorno.directorios.datos);
  } catch {
    return 0;
  }
  let importados = 0;
  for (const entrada of entradas) {
    if (!entrada.endsWith('.json') || entrada.endsWith('.tmp')) {
      continue;
    }
    let registros = null;
    try {
      registros = JSON.parse(readFileSync(path.join(entorno.directorios.datos, entrada), 'utf8'));
    } catch {
      continue;
    }
    if (!Array.isArray(registros) || registros.length === 0) {
      continue;
    }
    const coleccion = entrada.slice(0, -'.json'.length);
    for (const registro of registros) {
      if (!registro?.id) {
        continue;
      }
      try {
        if (coleccion === 'usuarios') {
          await dbUsuarios.insertar(registro);
        } else if (coleccion === 'candidatos') {
          const { archivos = [], ...candidato } = registro;
          await dbCandidatos.insertar({ ...candidato, dimensiones: candidato.dimensiones ?? [] });
          for (const archivo of archivos) {
            try {
              await dbArchivos.insertar(registro.id, archivo);
            } catch {
              continue;
            }
          }
        }
        importados += 1;
      } catch {
        continue;
      }
    }
    try {
      renameSync(
        path.join(entorno.directorios.datos, entrada),
        `${path.join(entorno.directorios.datos, entrada)}.migrado`,
      );
    } catch {
      continue;
    }
  }
  return importados;
};
