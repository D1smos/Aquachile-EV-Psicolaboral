import crypto from 'node:crypto';
import { Pool } from 'pg';
import { entorno } from './entorno.js';

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
    consentimiento BOOLEAN NOT NULL DEFAULT false,
    fechaConsentimiento TEXT,
    estado TEXT NOT NULL,
    respuestas JSONB,
    puntaje REAL,
    dimensiones JSONB NOT NULL DEFAULT '[]',
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
    storageKey TEXT,
    proveedor TEXT,
    bucket TEXT,
    hash TEXT,
    deletedAt TEXT,
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

let pool = null;
let esquemaListo = false;

const MAPA_COLUMNAS = Object.fromEntries(
  [
    ...COLUMNAS_CANDIDATO,
    'passwordHash',
    'creadoEn',
    'nombreOriginal',
    'nombreAlmacenado',
    'candidatoId',
    'etapaAnterior',
    'etapaNueva',
    'storageKey',
    'deletedAt',
  ].map((columna) => [columna.toLowerCase(), columna]),
);

const normalizarFila = (fila) => {
  const salida = {};
  for (const [clave, valor] of Object.entries(fila)) {
    salida[MAPA_COLUMNAS[clave] ?? clave] = valor;
  }
  return salida;
};

const obtenerPool = () => {
  if (!pool) {
    if (!entorno.db.url) {
      throw new Error('Define DATABASE_URL en el archivo .env para usar PostgreSQL.');
    }
    pool = new Pool({ connectionString: entorno.db.url, ssl: { rejectUnauthorized: false } });
  }
  return pool;
};

const asegurarEsquema = async () => {
  if (!esquemaListo) {
    await obtenerPool().query(ESQUEMA);
    await obtenerPool().query(
      'ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS consentimiento BOOLEAN NOT NULL DEFAULT false',
    );
    await obtenerPool().query(
      'ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS fechaConsentimiento TEXT',
    );
    for (const columna of ['storageKey', 'proveedor', 'bucket', 'hash', 'deletedAt']) {
      await obtenerPool().query(`ALTER TABLE archivos ADD COLUMN IF NOT EXISTS ${columna} TEXT`);
    }
    esquemaListo = true;
  }
};

const aJson = (valor, defecto) => {
  if (valor === null || valor === undefined) {
    return defecto;
  }
  return typeof valor === 'string' ? JSON.parse(valor) : valor;
};

const aCandidato = (fila, archivos = []) => ({
  ...fila,
  aniosExperiencia: Number(fila.aniosExperiencia),
  puntaje: fila.puntaje === null ? null : Number(fila.puntaje),
  afinidadIA: fila.afinidadIA === null ? null : Number(fila.afinidadIA),
  respuestas: aJson(fila.respuestas, null),
  dimensiones: aJson(fila.dimensiones, []),
  consentimiento: Boolean(fila.consentimiento),
  archivos: archivos.map((archivo) => ({ ...archivo, tamano: Number(archivo.tamano) })),
});

const filaCandidato = (datos) => {
  const fila = {};
  for (const columna of COLUMNAS_CANDIDATO) {
    if (datos[columna] === undefined) {
      continue;
    }
    if (columna === 'respuestas' || columna === 'dimensiones') {
      fila[columna] =
        datos[columna] === null
          ? null
          : typeof datos[columna] === 'string'
            ? datos[columna]
            : JSON.stringify(datos[columna]);
    } else {
      fila[columna] = datos[columna];
    }
  }
  return fila;
};

export const dbUsuarios = {
  contar: async () => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT COUNT(*) AS total FROM usuarios');
    return Number(resultado.rows[0]?.total ?? 0);
  },
  buscarPorEmail: async (email) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM usuarios WHERE email = $1', [
      String(email ?? '').trim().toLowerCase(),
    ]);
    return resultado.rows[0] ? normalizarFila(resultado.rows[0]) : null;
  },
  obtenerPorId: async (id) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM usuarios WHERE id = $1', [String(id)]);
    return resultado.rows[0] ? normalizarFila(resultado.rows[0]) : null;
  },
  insertar: async (usuario) => {
    await asegurarEsquema();
    await obtenerPool().query(
      'INSERT INTO usuarios (id, nombre, email, passwordHash, rol, creadoEn) VALUES ($1, $2, $3, $4, $5, $6)',
      [usuario.id, usuario.nombre, usuario.email, usuario.passwordHash, usuario.rol, usuario.creadoEn],
    );
    return { ...usuario };
  },
};

const normalizarArchivo = (fila) => normalizarFila({ ...fila, tamano: Number(fila.tamano) });

export const dbArchivos = {
  listarPorCandidato: async (candidatoId, { incluirEliminados = false } = {}) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      `SELECT * FROM archivos WHERE candidatoId = $1${incluirEliminados ? '' : ' AND deletedAt IS NULL'} ORDER BY creadoEn ASC`,
      [String(candidatoId)],
    );
    return resultado.rows.map(normalizarArchivo);
  },
  buscarPorHash: async (hash) => {
    if (!hash) {
      return null;
    }
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'SELECT * FROM archivos WHERE hash = $1 AND deletedAt IS NULL ORDER BY creadoEn ASC LIMIT 1',
      [String(hash)],
    );
    return resultado.rows[0] ? normalizarArchivo(resultado.rows[0]) : null;
  },
  contarPorStorageKey: async (storageKey) => {
    if (!storageKey) {
      return 0;
    }
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'SELECT COUNT(*) AS total FROM archivos WHERE storageKey = $1 AND deletedAt IS NULL',
      [String(storageKey)],
    );
    return Number(resultado.rows[0]?.total ?? 0);
  },
  insertar: async (candidatoId, archivo) => {
    await asegurarEsquema();
    const fila = { ...archivo, candidatoId: String(candidatoId) };
    const columnas = Object.keys(fila);
    await obtenerPool().query(
      `INSERT INTO archivos (${columnas.join(', ')}) VALUES (${columnas.map((_, indice) => `$${indice + 1}`).join(', ')})`,
      columnas.map((columna) => fila[columna]),
    );
    return { ...fila };
  },
  actualizar: async (id, cambios) => {
    await asegurarEsquema();
    const columnas = Object.keys(cambios);
    if (columnas.length === 0) {
      return null;
    }
    await obtenerPool().query(
      `UPDATE archivos SET ${columnas.map((columna, indice) => `${columna} = $${indice + 1}`).join(', ')} WHERE id = $${columnas.length + 1}`,
      [...columnas.map((columna) => cambios[columna]), String(id)],
    );
    const resultado = await obtenerPool().query('SELECT * FROM archivos WHERE id = $1', [String(id)]);
    return resultado.rows[0] ? normalizarArchivo(resultado.rows[0]) : null;
  },
  marcarEliminado: async (id) =>
    dbArchivos.actualizar(id, { deletedAt: new Date().toISOString() }),
};

export const dbCandidatos = {
  contar: async () => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT COUNT(*) AS total FROM candidatos');
    return Number(resultado.rows[0]?.total ?? 0);
  },
  listarTodos: async () => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM candidatos ORDER BY fechaPostulacion DESC');
    return Promise.all(
      resultado.rows.map(async (fila) => {
        const normalizado = normalizarFila(fila);
        return aCandidato(
          normalizado,
          await dbArchivos.listarPorCandidato(normalizado.id),
        );
      }),
    );
  },
  obtenerPorId: async (id) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM candidatos WHERE id = $1', [String(id)]);
    if (resultado.rows.length === 0) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(resultado.rows[0].id);
    return aCandidato(normalizarFila(resultado.rows[0]), archivos);
  },
  buscarPorFolio: async (folio) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM candidatos WHERE folio = $1', [
      String(folio ?? '').trim().toUpperCase(),
    ]);
    if (resultado.rows.length === 0) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(resultado.rows[0].id);
    return aCandidato(normalizarFila(resultado.rows[0]), archivos);
  },
  buscarPorRut: async (rut) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM candidatos WHERE rut = $1', [
      String(rut ?? '').trim(),
    ]);
    if (resultado.rows.length === 0) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(resultado.rows[0].id);
    return aCandidato(normalizarFila(resultado.rows[0]), archivos);
  },
  buscarPorEmail: async (email) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM candidatos WHERE correo = $1', [
      String(email ?? '').trim().toLowerCase(),
    ]);
    if (resultado.rows.length === 0) {
      return null;
    }
    const archivos = await dbArchivos.listarPorCandidato(resultado.rows[0].id);
    return aCandidato(normalizarFila(resultado.rows[0]), archivos);
  },
  eliminar: async (id) => {
    await asegurarEsquema();
    const clave = String(id);
    await obtenerPool().query('DELETE FROM archivos WHERE candidatoId = $1', [clave]);
    await obtenerPool().query('DELETE FROM historial_etapas WHERE candidatoId = $1', [clave]);
    const resultado = await obtenerPool().query('DELETE FROM candidatos WHERE id = $1', [clave]);
    return resultado.rowCount > 0;
  },
  insertar: async (candidato) => {
    await asegurarEsquema();
    const fila = filaCandidato(candidato);
    const columnas = Object.keys(fila);
    await obtenerPool().query(
      `INSERT INTO candidatos (${columnas.join(', ')}) VALUES (${columnas.map((_, indice) => `$${indice + 1}`).join(', ')})`,
      columnas.map((columna) => fila[columna]),
    );
    return aCandidato({ ...fila }, []);
  },
  actualizar: async (id, cambios) => {
    await asegurarEsquema();
    const fila = filaCandidato(cambios);
    delete fila.id;
    const columnas = Object.keys(fila);
    if (columnas.length === 0) {
      return dbCandidatos.obtenerPorId(id);
    }
    const resultado = await obtenerPool().query(
      `UPDATE candidatos SET ${columnas.map((columna, indice) => `${columna} = $${indice + 1}`).join(', ')} WHERE id = $${columnas.length + 1}`,
      [...columnas.map((columna) => fila[columna]), String(id)],
    );
    if (resultado.rowCount === 0) {
      return null;
    }
    return dbCandidatos.obtenerPorId(id);
  },
};

export const dbHistorial = {
  registrar: async ({ candidatoId, etapaAnterior, etapaNueva, responsable, motivo }) => {
    await asegurarEsquema();
    const evento = {
      id: crypto.randomUUID(),
      candidatoId: String(candidatoId),
      etapaAnterior: etapaAnterior ?? null,
      etapaNueva: String(etapaNueva),
      responsable: responsable ?? null,
      motivo: motivo ?? null,
      creadoEn: new Date().toISOString(),
    };
    await obtenerPool().query(
      'INSERT INTO historial_etapas (id, candidatoId, etapaAnterior, etapaNueva, responsable, motivo, creadoEn) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [evento.id, evento.candidatoId, evento.etapaAnterior, evento.etapaNueva, evento.responsable, evento.motivo, evento.creadoEn],
    );
    return evento;
  },
  listarPorCandidato: async (candidatoId) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'SELECT * FROM historial_etapas WHERE candidatoId = $1 ORDER BY creadoEn ASC',
      [String(candidatoId)],
    );
    return resultado.rows.map((evento) => normalizarFila(evento));
  },
};

export const migrarJsonSiExiste = async () => 0;

export const migrarLegado = async () => 0;
