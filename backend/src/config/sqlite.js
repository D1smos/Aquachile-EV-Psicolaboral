import { mkdirSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { entorno } from './entorno.js';
import { normalizarComparacion, parsearPalabrasClave } from '../utils/texto.js';

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
  CREATE TABLE IF NOT EXISTS documento_textos (
    archivoId TEXT PRIMARY KEY REFERENCES archivos(id) ON DELETE CASCADE,
    texto TEXT,
    textoHash TEXT,
    paginas INTEGER,
    caracteres INTEGER NOT NULL DEFAULT 0,
    anosExperiencia INTEGER NOT NULL DEFAULT 0,
    palabrasClave TEXT NOT NULL DEFAULT '[]',
    estado TEXT NOT NULL,
    modeloExtraccion TEXT,
    error TEXT,
    extraidoEn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS analisis_ia (
    id TEXT PRIMARY KEY,
    candidatoId TEXT NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    archivoId TEXT REFERENCES archivos(id) ON DELETE SET NULL,
    textoHash TEXT NOT NULL,
    cargo TEXT NOT NULL,
    promptVersion TEXT NOT NULL,
    modelo TEXT NOT NULL,
    resultado TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'borrador',
    generadoPor TEXT,
    revisadoPor TEXT,
    tokensEntrada INTEGER NOT NULL DEFAULT 0,
    tokensSalida INTEGER NOT NULL DEFAULT 0,
    creadoEn TEXT NOT NULL,
    actualizadoEn TEXT NOT NULL,
    UNIQUE(candidatoId, textoHash, cargo, promptVersion, modelo)
  );

  CREATE TABLE IF NOT EXISTS entrevistas (
    id TEXT PRIMARY KEY,
    candidatoId TEXT NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    evaluadorEmail TEXT NOT NULL,
    titulo TEXT NOT NULL,
    fechaInicio TEXT NOT NULL,
    fechaFin TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/Santiago',
    lugar TEXT,
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'programada',
    estadoSync TEXT NOT NULL DEFAULT 'pendiente',
    googleEventId TEXT,
    meetUrl TEXT,
    errorSync TEXT,
    creadoEn TEXT NOT NULL,
    actualizadoEn TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS google_credenciales (
    id TEXT PRIMARY KEY,
    usuarioEmail TEXT NOT NULL UNIQUE,
    refreshTokenCifrado TEXT NOT NULL,
    scope TEXT,
    tokenType TEXT,
    creadoEn TEXT NOT NULL,
    actualizadoEn TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_archivos_candidato ON archivos(candidatoId);
  CREATE INDEX IF NOT EXISTS idx_historial_candidato ON historial_etapas(candidatoId, creadoEn);
  CREATE INDEX IF NOT EXISTS idx_documento_textos_hash ON documento_textos(textoHash);
  CREATE INDEX IF NOT EXISTS idx_analisis_ia_candidato ON analisis_ia(candidatoId, creadoEn);
  CREATE INDEX IF NOT EXISTS idx_entrevistas_fecha ON entrevistas(fechaInicio, fechaFin);
  CREATE INDEX IF NOT EXISTS idx_entrevistas_candidato ON entrevistas(candidatoId, fechaInicio);
  CREATE INDEX IF NOT EXISTS idx_google_credenciales_usuario ON google_credenciales(usuarioEmail);
`;

const rutaBd = () => path.join(entorno.directorios.datos, NOMBRE_BD);

let instancia = null;

const obtenerBd = () => {
  if (!instancia) {
    mkdirSync(entorno.directorios.datos, { recursive: true });
    instancia = new DatabaseSync(rutaBd());
    instancia.exec('PRAGMA foreign_keys = ON;');
    instancia.exec(ESQUEMA);
    instancia.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
    const columnasOferta = new Set(instancia.prepare('PRAGMA table_info(ofertas)').all().map((fila) => fila.name));
    for (const [columna, tipo, defecto] of [
      ['categoria', 'TEXT', "''"],
      ['modalidad', 'TEXT', "'Presencial'"],
      ['fechaPublicacion', 'TEXT', "''"],
      ['cupos', 'INTEGER', '1'],
      ['funciones', 'TEXT', "''"],
      ['beneficios', 'TEXT', "''"],
      ['sueldo', 'TEXT', "''"],
    ]) {
      if (!columnasOferta.has(columna)) {
        instancia.exec(`ALTER TABLE ofertas ADD COLUMN ${columna} ${tipo} NOT NULL DEFAULT ${defecto}`);
      }
    }
    const columnas = instancia.prepare('PRAGMA table_info(candidatos)').all().map((fila) => fila.name);
    if (!columnas.includes('consentimiento')) {
      instancia.exec('ALTER TABLE candidatos ADD COLUMN consentimiento INTEGER NOT NULL DEFAULT 0');
    }
    if (!columnas.includes('fechaConsentimiento')) {
      instancia.exec('ALTER TABLE candidatos ADD COLUMN fechaConsentimiento TEXT');
    }
    const columnasArchivos = instancia.prepare('PRAGMA table_info(archivos)').all().map((fila) => fila.name);
    for (const columna of ['storageKey', 'proveedor', 'bucket', 'hash', 'deletedAt']) {
      if (!columnasArchivos.includes(columna)) {
        instancia.exec(`ALTER TABLE archivos ADD COLUMN ${columna} TEXT`);
      }
    }
    const columnasDocumentos = instancia.prepare('PRAGMA table_info(documento_textos)').all().map((fila) => fila.name);
    if (!columnasDocumentos.includes('anosExperiencia')) {
      instancia.exec('ALTER TABLE documento_textos ADD COLUMN anosExperiencia INTEGER NOT NULL DEFAULT 0');
    }
    if (!columnasDocumentos.includes('palabrasClave')) {
      instancia.exec("ALTER TABLE documento_textos ADD COLUMN palabrasClave TEXT NOT NULL DEFAULT '[]'");
    }
  }
  return instancia;
};

export const dbOfertas = {
  listar: async (filtros = {}) => {
    const condiciones = [];
    const valores = [];
    if (filtros.q) {
      condiciones.push('(LOWER(titulo) LIKE LOWER(?) OR LOWER(descripcion) LIKE LOWER(?) OR LOWER(funciones) LIKE LOWER(?) OR LOWER(requisitos) LIKE LOWER(?))');
      valores.push(...Array(4).fill(`%${String(filtros.q).trim()}%`));
    }
    for (const campo of ['titulo', 'ubicacion', 'categoria', 'modalidad']) {
      if (filtros[campo]) {
        condiciones.push(`LOWER(${campo}) LIKE LOWER(?)`);
        valores.push(`%${String(filtros[campo]).trim()}%`);
      }
    }
    if (filtros.estado) {
      condiciones.push('estado = ?');
      valores.push(String(filtros.estado));
    }
    const sql = `SELECT * FROM ofertas ${condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''} ORDER BY creadoEn DESC`;
    return obtenerBd().prepare(sql).all(...valores);
  },
  obtener: async (id) => obtenerBd().prepare('SELECT * FROM ofertas WHERE id = ?').get(String(id)) ?? null,
  insertar: async (oferta) => {
    const campos = ['id', 'titulo', 'descripcion', 'ubicacion', 'familiaCargo', 'categoria', 'modalidad', 'fechaPublicacion', 'cupos', 'estado', 'funciones', 'requisitos', 'beneficios', 'sueldo', 'creadoEn', 'actualizadoEn'];
    obtenerBd().prepare(`INSERT INTO ofertas (${campos.join(',')}) VALUES (${campos.map(() => '?').join(',')})`).run(...campos.map((campo) => oferta[campo]));
    return dbOfertas.obtener(oferta.id);
  },
  actualizar: async (id, cambios) => {
    const campos = ['titulo', 'descripcion', 'ubicacion', 'familiaCargo', 'categoria', 'modalidad', 'fechaPublicacion', 'cupos', 'estado', 'funciones', 'requisitos', 'beneficios', 'sueldo', 'actualizadoEn'].filter((campo) => cambios[campo] !== undefined);
    if (!campos.length) return dbOfertas.obtener(id);
    const valores = campos.map((campo) => cambios[campo]);
    const resultado = obtenerBd().prepare(`UPDATE ofertas SET ${campos.map((campo) => `${campo} = ?`).join(', ')} WHERE id = ?`).run(...valores, String(id));
    return resultado.changes ? dbOfertas.obtener(id) : null;
  },
  eliminar: async (id) => obtenerBd().prepare('DELETE FROM ofertas WHERE id = ?').run(String(id)).changes > 0,
  contar: async () => Number(obtenerBd().prepare('SELECT COUNT(*) AS total FROM ofertas').get()?.total ?? 0),
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

export const cerrarBaseDatos = () => {
  if (instancia) {
    try {
      instancia.close();
    } catch {
      // No hace nada si ya está cerrada.
    }
    instancia = null;
  }
};

const COLUMNAS_ARCHIVO = [
  'id',
  'candidatoId',
  'tipo',
  'nombreOriginal',
  'nombreAlmacenado',
  'ruta',
  'mimetype',
  'tamano',
  'storageKey',
  'proveedor',
  'bucket',
  'hash',
  'deletedAt',
  'creadoEn',
];

const filaArchivo = (datos) => {
  const fila = {};
  for (const columna of COLUMNAS_ARCHIVO) {
    if (datos[columna] !== undefined) {
      fila[columna] = datos[columna];
    }
  }
  return fila;
};

export const dbArchivos = {
  listarPorCandidato: async (candidatoId, { incluirEliminados = false } = {}) =>
    obtenerBd()
      .prepare(
        `SELECT * FROM archivos WHERE candidatoId = ?${incluirEliminados ? '' : ' AND deletedAt IS NULL'} ORDER BY creadoEn ASC`,
      )
      .all(String(candidatoId))
      .map((archivo) => ({ ...archivo })),
  buscarPorHash: async (hash) => {
    if (!hash) {
      return null;
    }
    const fila = obtenerBd()
      .prepare('SELECT * FROM archivos WHERE hash = ? AND deletedAt IS NULL ORDER BY creadoEn ASC LIMIT 1')
      .get(String(hash));
    return fila ? { ...fila } : null;
  },
  contarPorStorageKey: async (storageKey) => {
    if (!storageKey) {
      return 0;
    }
    return Number(
      obtenerBd()
        .prepare('SELECT COUNT(*) AS total FROM archivos WHERE storageKey = ? AND deletedAt IS NULL')
        .get(String(storageKey))?.total ?? 0,
    );
  },
  insertar: async (candidatoId, archivo) => {
    const fila = filaArchivo(archivo);
    fila.candidatoId = String(candidatoId);
    const columnas = Object.keys(fila);
    obtenerBd()
      .prepare(
        `INSERT INTO archivos (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
      )
      .run(...columnas.map((columna) => fila[columna]));
    return { ...fila };
  },
  actualizar: async (id, cambios) => {
    const fila = filaArchivo(cambios);
    delete fila.id;
    const columnas = Object.keys(fila);
    if (columnas.length === 0) {
      return null;
    }
    obtenerBd()
      .prepare(`UPDATE archivos SET ${columnas.map((columna) => `${columna} = ?`).join(', ')} WHERE id = ?`)
      .run(...columnas.map((columna) => fila[columna]), String(id));
    const actualizado = obtenerBd().prepare('SELECT * FROM archivos WHERE id = ?').get(String(id));
    return actualizado ? { ...actualizado } : null;
  },
  obtenerPorId: async (id) => {
    const fila = obtenerBd().prepare('SELECT * FROM archivos WHERE id = ?').get(String(id));
    return fila ? { ...fila } : null;
  },
  eliminar: async (id) =>
    obtenerBd().prepare('DELETE FROM archivos WHERE id = ?').run(String(id)).changes > 0,
  marcarEliminado: async (id) =>
    dbArchivos.actualizar(id, { deletedAt: new Date().toISOString() }),
};

const normalizarDocumentoTexto = (fila) => ({
  ...fila,
  paginas: fila.paginas === null ? null : Number(fila.paginas),
  caracteres: Number(fila.caracteres ?? 0),
  anosExperiencia: Number(fila.anosExperiencia ?? 0),
  palabrasClave: parsearPalabrasClave(fila.palabrasClave),
});

export const dbDocumentosTexto = {
  obtenerPorArchivo: async (archivoId) => {
    const fila = obtenerBd()
      .prepare('SELECT * FROM documento_textos WHERE archivoId = ?')
      .get(String(archivoId));
    return fila ? normalizarDocumentoTexto(fila) : null;
  },
  listarPorCandidato: async (candidatoId) =>
    obtenerBd()
      .prepare(
        `SELECT dt.* FROM documento_textos dt
         JOIN archivos a ON a.id = dt.archivoId
         WHERE a.candidatoId = ? AND a.deletedAt IS NULL
         ORDER BY a.creadoEn ASC`,
      )
      .all(String(candidatoId))
      .map(normalizarDocumentoTexto),
  coincide: async (candidatoId, { minExperiencia = 0, palabrasClave = [] } = {}) => {
    const minimo = Number(minExperiencia) || 0;
    const claves = parsearPalabrasClave(palabrasClave)
      .map((palabra) => normalizarComparacion(palabra))
      .filter(Boolean);
    const filas = obtenerBd()
      .prepare(
        `SELECT dt.anosExperiencia, dt.palabrasClave, dt.texto
         FROM documento_textos dt
         JOIN archivos a ON a.id = dt.archivoId
         WHERE a.candidatoId = ? AND a.deletedAt IS NULL AND a.tipo = 'cv'`,
      )
      .all(String(candidatoId));
    return filas.some((fila) => {
      if (minimo > 0 && Number(fila.anosExperiencia ?? 0) < minimo) {
        return false;
      }
      if (claves.length === 0) {
        return true;
      }
      const contenido = normalizarComparacion(`${fila.palabrasClave ?? ''} ${fila.texto ?? ''}`);
      return claves.every((clave) => contenido.includes(clave));
    });
  },
  guardar: async (documento) => {
    const fila = {
      archivoId: String(documento.archivoId),
      texto: documento.texto ?? null,
      textoHash: documento.textoHash ? String(documento.textoHash) : null,
      paginas: documento.paginas ?? null,
      caracteres: Number(documento.caracteres ?? 0),
      anosExperiencia: Number(documento.anosExperiencia ?? 0),
      palabrasClave: JSON.stringify(parsearPalabrasClave(documento.palabrasClave)),
      estado: String(documento.estado),
      modeloExtraccion: documento.modeloExtraccion ?? null,
      error: documento.error ?? null,
      extraidoEn: documento.extraidoEn ?? new Date().toISOString(),
    };
    obtenerBd()
      .prepare(
        `INSERT INTO documento_textos
          (archivoId, texto, textoHash, paginas, caracteres, anosExperiencia, palabrasClave, estado, modeloExtraccion, error, extraidoEn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(archivoId) DO UPDATE SET
           texto = excluded.texto,
           textoHash = excluded.textoHash,
           paginas = excluded.paginas,
           caracteres = excluded.caracteres,
           anosExperiencia = excluded.anosExperiencia,
           palabrasClave = excluded.palabrasClave,
           estado = excluded.estado,
           modeloExtraccion = excluded.modeloExtraccion,
           error = excluded.error,
           extraidoEn = excluded.extraidoEn`,
      )
      .run(
        fila.archivoId,
        fila.texto,
        fila.textoHash,
        fila.paginas,
        fila.caracteres,
        fila.anosExperiencia,
        fila.palabrasClave,
        fila.estado,
        fila.modeloExtraccion,
        fila.error,
        fila.extraidoEn,
      );
    return normalizarDocumentoTexto(fila);
  },
  eliminarPorArchivo: async (archivoId) =>
    obtenerBd().prepare('DELETE FROM documento_textos WHERE archivoId = ?').run(String(archivoId))
      .changes > 0,
};

const normalizarAnalisisIA = (fila) => ({
  ...fila,
  resultado: leerJson(fila.resultado, null),
  tokensEntrada: Number(fila.tokensEntrada ?? 0),
  tokensSalida: Number(fila.tokensSalida ?? 0),
});

const CAMPOS_ANALISIS_ACTUALIZABLES = new Set([
  'resultado',
  'estado',
  'revisadoPor',
  'tokensEntrada',
  'tokensSalida',
  'actualizadoEn',
]);

export const dbAnalisisIA = {
  buscarCache: async ({ candidatoId, textoHash, cargo, promptVersion, modelo }) => {
    const fila = obtenerBd()
      .prepare(
        `SELECT * FROM analisis_ia
         WHERE candidatoId = ? AND textoHash = ? AND cargo = ?
           AND promptVersion = ? AND modelo = ? AND estado <> 'descartado'
         ORDER BY creadoEn DESC LIMIT 1`,
      )
      .get(String(candidatoId), String(textoHash), String(cargo), String(promptVersion), String(modelo));
    return fila ? normalizarAnalisisIA(fila) : null;
  },
  insertar: async (analisis) => {
    const ahora = new Date().toISOString();
    const fila = {
      id: analisis.id ?? crypto.randomUUID(),
      candidatoId: String(analisis.candidatoId),
      archivoId: analisis.archivoId ? String(analisis.archivoId) : null,
      textoHash: String(analisis.textoHash),
      cargo: String(analisis.cargo),
      promptVersion: String(analisis.promptVersion),
      modelo: String(analisis.modelo),
      resultado:
        typeof analisis.resultado === 'string'
          ? analisis.resultado
          : JSON.stringify(analisis.resultado ?? null),
      estado: analisis.estado ?? 'borrador',
      generadoPor: analisis.generadoPor ?? null,
      revisadoPor: analisis.revisadoPor ?? null,
      tokensEntrada: Number(analisis.tokensEntrada ?? 0),
      tokensSalida: Number(analisis.tokensSalida ?? 0),
      creadoEn: analisis.creadoEn ?? ahora,
      actualizadoEn: analisis.actualizadoEn ?? ahora,
    };
    obtenerBd()
      .prepare(
        `INSERT INTO analisis_ia
          (id, candidatoId, archivoId, textoHash, cargo, promptVersion, modelo, resultado, estado,
           generadoPor, revisadoPor, tokensEntrada, tokensSalida, creadoEn, actualizadoEn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(candidatoId, textoHash, cargo, promptVersion, modelo) DO UPDATE SET
           archivoId = excluded.archivoId,
           resultado = excluded.resultado,
           estado = excluded.estado,
           generadoPor = excluded.generadoPor,
           revisadoPor = excluded.revisadoPor,
           tokensEntrada = excluded.tokensEntrada,
           tokensSalida = excluded.tokensSalida,
           actualizadoEn = excluded.actualizadoEn`,
      )
      .run(
        fila.id,
        fila.candidatoId,
        fila.archivoId,
        fila.textoHash,
        fila.cargo,
        fila.promptVersion,
        fila.modelo,
        fila.resultado,
        fila.estado,
        fila.generadoPor,
        fila.revisadoPor,
        fila.tokensEntrada,
        fila.tokensSalida,
        fila.creadoEn,
        fila.actualizadoEn,
      );
    return dbAnalisisIA.buscarCache({
      candidatoId: fila.candidatoId,
      textoHash: fila.textoHash,
      cargo: fila.cargo,
      promptVersion: fila.promptVersion,
      modelo: fila.modelo,
    });
  },
  obtenerPorId: async (id) => {
    const fila = obtenerBd().prepare('SELECT * FROM analisis_ia WHERE id = ?').get(String(id));
    return fila ? normalizarAnalisisIA(fila) : null;
  },
  ultimoPorCandidato: async (candidatoId) => {
    const fila = obtenerBd()
      .prepare('SELECT * FROM analisis_ia WHERE candidatoId = ? ORDER BY creadoEn DESC LIMIT 1')
      .get(String(candidatoId));
    return fila ? normalizarAnalisisIA(fila) : null;
  },
  listarPorCandidato: async (candidatoId) =>
    obtenerBd()
      .prepare('SELECT * FROM analisis_ia WHERE candidatoId = ? ORDER BY creadoEn DESC')
      .all(String(candidatoId))
      .map(normalizarAnalisisIA),
  actualizar: async (id, cambios) => {
    const fila = {};
    for (const [columna, valor] of Object.entries(cambios)) {
      if (!CAMPOS_ANALISIS_ACTUALIZABLES.has(columna)) {
        continue;
      }
      fila[columna] =
        columna === 'resultado' && typeof valor !== 'string' ? JSON.stringify(valor ?? null) : valor;
    }
    const columnas = Object.keys(fila);
    if (columnas.length === 0) {
      return dbAnalisisIA.obtenerPorId(id);
    }
    obtenerBd()
      .prepare(`UPDATE analisis_ia SET ${columnas.map((columna) => `${columna} = ?`).join(', ')} WHERE id = ?`)
      .run(...columnas.map((columna) => fila[columna]), String(id));
    return dbAnalisisIA.obtenerPorId(id);
  },
  actualizarRevision: async (id, { estado, revisadoPor }) =>
    dbAnalisisIA.actualizar(id, {
      estado,
      revisadoPor: revisadoPor ?? null,
      actualizadoEn: new Date().toISOString(),
    }),
  eliminarPorCandidato: async (candidatoId) =>
    obtenerBd().prepare('DELETE FROM analisis_ia WHERE candidatoId = ?').run(String(candidatoId)).changes,
};

const CAMPOS_ENTREVISTA_ACTUALIZABLES = new Set([
  'evaluadorEmail',
  'titulo',
  'fechaInicio',
  'fechaFin',
  'timezone',
  'lugar',
  'notas',
  'estado',
  'estadoSync',
  'googleEventId',
  'meetUrl',
  'errorSync',
]);

const filaEntrevista = (datos) => {
  const fila = {};
  for (const [columna, valor] of Object.entries(datos)) {
    if (CAMPOS_ENTREVISTA_ACTUALIZABLES.has(columna)) {
      fila[columna] = valor ?? null;
    }
  }
  return fila;
};

const normalizarEntrevista = (fila) => ({ ...fila });

export const dbEntrevistas = {
  listar: async ({ desde = null, hasta = null, candidatoId = null } = {}) => {
    const condiciones = [];
    const valores = [];
    if (candidatoId) {
      condiciones.push('candidatoId = ?');
      valores.push(String(candidatoId));
    }
    if (desde) {
      condiciones.push('fechaInicio >= ?');
      valores.push(String(desde));
    }
    if (hasta) {
      condiciones.push('fechaInicio <= ?');
      valores.push(String(hasta));
    }
    const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
    return obtenerBd()
      .prepare(`SELECT * FROM entrevistas${where} ORDER BY fechaInicio ASC`)
      .all(...valores)
      .map(normalizarEntrevista);
  },
  obtenerPorId: async (id) => {
    const fila = obtenerBd().prepare('SELECT * FROM entrevistas WHERE id = ?').get(String(id));
    return fila ? normalizarEntrevista(fila) : null;
  },
  insertar: async (entrevista) => {
    const ahora = new Date().toISOString();
    const fila = {
      id: entrevista.id ?? crypto.randomUUID(),
      candidatoId: String(entrevista.candidatoId),
      evaluadorEmail: String(entrevista.evaluadorEmail),
      titulo: String(entrevista.titulo ?? ''),
      fechaInicio: String(entrevista.fechaInicio),
      fechaFin: String(entrevista.fechaFin),
      timezone: String(entrevista.timezone ?? 'America/Santiago'),
      lugar: entrevista.lugar ?? null,
      notas: entrevista.notas ?? null,
      estado: entrevista.estado ?? 'programada',
      estadoSync: entrevista.estadoSync ?? 'pendiente',
      googleEventId: entrevista.googleEventId ?? null,
      meetUrl: entrevista.meetUrl ?? null,
      errorSync: entrevista.errorSync ?? null,
      creadoEn: entrevista.creadoEn ?? ahora,
      actualizadoEn: entrevista.actualizadoEn ?? ahora,
    };
    const columnas = Object.keys(fila);
    obtenerBd()
      .prepare(
        `INSERT INTO entrevistas (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
      )
      .run(...columnas.map((columna) => fila[columna]));
    return dbEntrevistas.obtenerPorId(fila.id);
  },
  actualizar: async (id, cambios) => {
    const fila = filaEntrevista(cambios);
    fila.actualizadoEn = new Date().toISOString();
    const columnas = Object.keys(fila);
    const resultado = obtenerBd()
      .prepare(
        `UPDATE entrevistas SET ${columnas.map((columna) => `${columna} = ?`).join(', ')} WHERE id = ?`,
      )
      .run(...columnas.map((columna) => fila[columna]), String(id));
    if (resultado.changes === 0) {
      return null;
    }
    return dbEntrevistas.obtenerPorId(id);
  },
  eliminar: async (id) =>
    obtenerBd().prepare('DELETE FROM entrevistas WHERE id = ?').run(String(id)).changes > 0,
};

const normalizarCredencialGoogle = (fila) => (fila ? { ...fila } : null);

export const dbGoogleCredenciales = {
  obtenerPorUsuario: async (usuarioEmail) => {
    const fila = obtenerBd()
      .prepare('SELECT * FROM google_credenciales WHERE usuarioEmail = ?')
      .get(String(usuarioEmail ?? '').trim().toLowerCase());
    return normalizarCredencialGoogle(fila);
  },
  guardar: async ({ usuarioEmail, refreshTokenCifrado, scope = null, tokenType = null }) => {
    const ahora = new Date().toISOString();
    const email = String(usuarioEmail ?? '').trim().toLowerCase();
    obtenerBd()
      .prepare(
        `INSERT INTO google_credenciales
          (id, usuarioEmail, refreshTokenCifrado, scope, tokenType, creadoEn, actualizadoEn)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(usuarioEmail) DO UPDATE SET
           refreshTokenCifrado = excluded.refreshTokenCifrado,
           scope = excluded.scope,
           tokenType = excluded.tokenType,
           actualizadoEn = excluded.actualizadoEn`,
      )
      .run(
        crypto.randomUUID(),
        email,
        String(refreshTokenCifrado),
        scope,
        tokenType,
        ahora,
        ahora,
      );
    return dbGoogleCredenciales.obtenerPorUsuario(email);
  },
  eliminar: async (usuarioEmail) =>
    obtenerBd()
      .prepare('DELETE FROM google_credenciales WHERE usuarioEmail = ?')
      .run(String(usuarioEmail ?? '').trim().toLowerCase()).changes > 0,
};

export const dbCandidatos = {
  contar: async () =>
    Number(obtenerBd().prepare('SELECT COUNT(*) AS total FROM candidatos').get()?.total ?? 0),
  listarTodos: async (filtros = {}) => {
    const filas = obtenerBd()
      .prepare('SELECT * FROM candidatos ORDER BY fechaPostulacion DESC')
      .all();
    const candidatos = await Promise.all(
      filas.map(async (fila) =>
        aCandidato(fila, await dbArchivos.listarPorCandidato(fila.id)),
      ),
    );
    const minExperiencia = Number(filtros.minExperiencia) || 0;
    const palabrasClave = parsearPalabrasClave(filtros.palabrasClave);
    if (minExperiencia <= 0 && palabrasClave.length === 0) {
      return candidatos;
    }
    const filtrados = [];
    for (const candidato of candidatos) {
      if (await dbDocumentosTexto.coincide(candidato.id, { minExperiencia, palabrasClave })) {
        filtrados.push(candidato);
      }
    }
    return filtrados;
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
