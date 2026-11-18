import crypto from 'node:crypto';
import { Pool } from 'pg';
import { entorno } from './entorno.js';
import { normalizarComparacion, parsearPalabrasClave } from '../utils/texto.js';

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
    resultado JSONB NOT NULL,
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
    'archivoId',
    'textoHash',
    'modeloExtraccion',
    'extraidoEn',
    'promptVersion',
    'generadoPor',
    'revisadoPor',
    'tokensEntrada',
    'tokensSalida',
    'actualizadoEn',
    'anosExperiencia',
    'palabrasClave',
    'evaluadorEmail',
    'fechaInicio',
    'fechaFin',
    'estadoSync',
    'googleEventId',
    'meetUrl',
    'errorSync',
    'usuarioEmail',
    'refreshTokenCifrado',
    'tokenType',
    'scope',
    'titulo',
    'lugar',
    'notas',
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
    await obtenerPool().query(
      'ALTER TABLE documento_textos ADD COLUMN IF NOT EXISTS anosExperiencia INTEGER NOT NULL DEFAULT 0',
    );
    await obtenerPool().query(
      "ALTER TABLE documento_textos ADD COLUMN IF NOT EXISTS palabrasClave TEXT NOT NULL DEFAULT '[]'",
    );
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
  obtenerPorId: async (id) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM archivos WHERE id = $1', [String(id)]);
    return resultado.rows[0] ? normalizarArchivo(resultado.rows[0]) : null;
  },
  eliminar: async (id) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('DELETE FROM archivos WHERE id = $1', [String(id)]);
    return resultado.rowCount > 0;
  },
  marcarEliminado: async (id) =>
    dbArchivos.actualizar(id, { deletedAt: new Date().toISOString() }),
};

const normalizarDocumentoTexto = (fila) => {
  const normalizado = normalizarFila(fila);
  return {
    ...normalizado,
    paginas: normalizado.paginas === null ? null : Number(normalizado.paginas),
    caracteres: Number(normalizado.caracteres ?? 0),
    anosExperiencia: Number(normalizado.anosExperiencia ?? 0),
    palabrasClave: parsearPalabrasClave(normalizado.palabrasClave),
  };
};

export const dbDocumentosTexto = {
  obtenerPorArchivo: async (archivoId) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'SELECT * FROM documento_textos WHERE archivoId = $1',
      [String(archivoId)],
    );
    return resultado.rows[0] ? normalizarDocumentoTexto(resultado.rows[0]) : null;
  },
  listarPorCandidato: async (candidatoId) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      `SELECT dt.* FROM documento_textos dt
       JOIN archivos a ON a.id = dt.archivoId
       WHERE a.candidatoId = $1 AND a.deletedAt IS NULL
       ORDER BY a.creadoEn ASC`,
      [String(candidatoId)],
    );
    return resultado.rows.map(normalizarDocumentoTexto);
  },
  coincide: async (candidatoId, { minExperiencia = 0, palabrasClave = [] } = {}) => {
    await asegurarEsquema();
    const minimo = Number(minExperiencia) || 0;
    const claves = parsearPalabrasClave(palabrasClave)
      .map((palabra) => normalizarComparacion(palabra))
      .filter(Boolean);
    const resultado = await obtenerPool().query(
      `SELECT dt.anosExperiencia, dt.palabrasClave, dt.texto
       FROM documento_textos dt
       JOIN archivos a ON a.id = dt.archivoId
       WHERE a.candidatoId = $1 AND a.deletedAt IS NULL AND a.tipo = 'cv'`,
      [String(candidatoId)],
    );
    return resultado.rows.some((fila) => {
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
    await asegurarEsquema();
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
    await obtenerPool().query(
      `INSERT INTO documento_textos
        (archivoId, texto, textoHash, paginas, caracteres, anosExperiencia, palabrasClave, estado, modeloExtraccion, error, extraidoEn)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (archivoId) DO UPDATE SET
         texto = EXCLUDED.texto,
         textoHash = EXCLUDED.textoHash,
         paginas = EXCLUDED.paginas,
         caracteres = EXCLUDED.caracteres,
         anosExperiencia = EXCLUDED.anosExperiencia,
         palabrasClave = EXCLUDED.palabrasClave,
         estado = EXCLUDED.estado,
         modeloExtraccion = EXCLUDED.modeloExtraccion,
         error = EXCLUDED.error,
         extraidoEn = EXCLUDED.extraidoEn`,
      [
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
      ],
    );
    return normalizarDocumentoTexto(fila);
  },
  eliminarPorArchivo: async (archivoId) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('DELETE FROM documento_textos WHERE archivoId = $1', [
      String(archivoId),
    ]);
    return resultado.rowCount > 0;
  },
};

const normalizarAnalisisIA = (fila) => {
  const normalizado = normalizarFila(fila);
  return {
    ...normalizado,
    resultado: aJson(normalizado.resultado, null),
    tokensEntrada: Number(normalizado.tokensEntrada ?? 0),
    tokensSalida: Number(normalizado.tokensSalida ?? 0),
  };
};

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
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      `SELECT * FROM analisis_ia
       WHERE candidatoId = $1 AND textoHash = $2 AND cargo = $3
         AND promptVersion = $4 AND modelo = $5 AND estado <> 'descartado'
       ORDER BY creadoEn DESC LIMIT 1`,
      [String(candidatoId), String(textoHash), String(cargo), String(promptVersion), String(modelo)],
    );
    return resultado.rows[0] ? normalizarAnalisisIA(resultado.rows[0]) : null;
  },
  insertar: async (analisis) => {
    await asegurarEsquema();
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
    const resultado = await obtenerPool().query(
      `INSERT INTO analisis_ia
        (id, candidatoId, archivoId, textoHash, cargo, promptVersion, modelo, resultado, estado,
         generadoPor, revisadoPor, tokensEntrada, tokensSalida, creadoEn, actualizadoEn)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (candidatoId, textoHash, cargo, promptVersion, modelo) DO UPDATE SET
         archivoId = EXCLUDED.archivoId,
         resultado = EXCLUDED.resultado,
         estado = EXCLUDED.estado,
         generadoPor = EXCLUDED.generadoPor,
         revisadoPor = EXCLUDED.revisadoPor,
         tokensEntrada = EXCLUDED.tokensEntrada,
         tokensSalida = EXCLUDED.tokensSalida,
         actualizadoEn = EXCLUDED.actualizadoEn
       RETURNING *`,
      [
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
      ],
    );
    return normalizarAnalisisIA(resultado.rows[0]);
  },
  obtenerPorId: async (id) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM analisis_ia WHERE id = $1', [String(id)]);
    return resultado.rows[0] ? normalizarAnalisisIA(resultado.rows[0]) : null;
  },
  ultimoPorCandidato: async (candidatoId) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'SELECT * FROM analisis_ia WHERE candidatoId = $1 ORDER BY creadoEn DESC LIMIT 1',
      [String(candidatoId)],
    );
    return resultado.rows[0] ? normalizarAnalisisIA(resultado.rows[0]) : null;
  },
  listarPorCandidato: async (candidatoId) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'SELECT * FROM analisis_ia WHERE candidatoId = $1 ORDER BY creadoEn DESC',
      [String(candidatoId)],
    );
    return resultado.rows.map(normalizarAnalisisIA);
  },
  actualizar: async (id, cambios) => {
    await asegurarEsquema();
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
    await obtenerPool().query(
      `UPDATE analisis_ia SET ${columnas.map((columna, indice) => `${columna} = $${indice + 1}`).join(', ')} WHERE id = $${columnas.length + 1}`,
      [...columnas.map((columna) => fila[columna]), String(id)],
    );
    return dbAnalisisIA.obtenerPorId(id);
  },
  actualizarRevision: async (id, { estado, revisadoPor }) =>
    dbAnalisisIA.actualizar(id, {
      estado,
      revisadoPor: revisadoPor ?? null,
      actualizadoEn: new Date().toISOString(),
    }),
  eliminarPorCandidato: async (candidatoId) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('DELETE FROM analisis_ia WHERE candidatoId = $1', [
      String(candidatoId),
    ]);
    return resultado.rowCount;
  },
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

const normalizarEntrevista = (fila) => normalizarFila(fila);

export const dbEntrevistas = {
  listar: async ({ desde = null, hasta = null, candidatoId = null } = {}) => {
    await asegurarEsquema();
    const condiciones = [];
    const valores = [];
    if (candidatoId) {
      valores.push(String(candidatoId));
      condiciones.push(`candidatoId = $${valores.length}`);
    }
    if (desde) {
      valores.push(String(desde));
      condiciones.push(`fechaInicio >= $${valores.length}`);
    }
    if (hasta) {
      valores.push(String(hasta));
      condiciones.push(`fechaInicio <= $${valores.length}`);
    }
    const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
    const resultado = await obtenerPool().query(
      `SELECT * FROM entrevistas${where} ORDER BY fechaInicio ASC`,
      valores,
    );
    return resultado.rows.map(normalizarEntrevista);
  },
  obtenerPorId: async (id) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM entrevistas WHERE id = $1', [String(id)]);
    return resultado.rows[0] ? normalizarEntrevista(resultado.rows[0]) : null;
  },
  insertar: async (entrevista) => {
    await asegurarEsquema();
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
    const resultado = await obtenerPool().query(
      `INSERT INTO entrevistas (${columnas.join(', ')})
       VALUES (${columnas.map((_, indice) => `$${indice + 1}`).join(', ')})
       RETURNING *`,
      columnas.map((columna) => fila[columna]),
    );
    return normalizarEntrevista(resultado.rows[0]);
  },
  actualizar: async (id, cambios) => {
    await asegurarEsquema();
    const fila = filaEntrevista(cambios);
    fila.actualizadoEn = new Date().toISOString();
    const columnas = Object.keys(fila);
    const resultado = await obtenerPool().query(
      `UPDATE entrevistas SET ${columnas.map((columna, indice) => `${columna} = $${indice + 1}`).join(', ')}
       WHERE id = $${columnas.length + 1} RETURNING *`,
      [...columnas.map((columna) => fila[columna]), String(id)],
    );
    return resultado.rows[0] ? normalizarEntrevista(resultado.rows[0]) : null;
  },
  eliminar: async (id) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('DELETE FROM entrevistas WHERE id = $1', [String(id)]);
    return resultado.rowCount > 0;
  },
};

const normalizarCredencialGoogle = (fila) => (fila ? normalizarFila(fila) : null);

export const dbGoogleCredenciales = {
  obtenerPorUsuario: async (usuarioEmail) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'SELECT * FROM google_credenciales WHERE usuarioEmail = $1',
      [String(usuarioEmail ?? '').trim().toLowerCase()],
    );
    return normalizarCredencialGoogle(resultado.rows[0]);
  },
  guardar: async ({ usuarioEmail, refreshTokenCifrado, scope = null, tokenType = null }) => {
    await asegurarEsquema();
    const ahora = new Date().toISOString();
    const email = String(usuarioEmail ?? '').trim().toLowerCase();
    const resultado = await obtenerPool().query(
      `INSERT INTO google_credenciales
        (id, usuarioEmail, refreshTokenCifrado, scope, tokenType, creadoEn, actualizadoEn)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (usuarioEmail) DO UPDATE SET
         refreshTokenCifrado = EXCLUDED.refreshTokenCifrado,
         scope = EXCLUDED.scope,
         tokenType = EXCLUDED.tokenType,
         actualizadoEn = EXCLUDED.actualizadoEn
       RETURNING *`,
      [crypto.randomUUID(), email, String(refreshTokenCifrado), scope, tokenType, ahora, ahora],
    );
    return normalizarCredencialGoogle(resultado.rows[0]);
  },
  eliminar: async (usuarioEmail) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query(
      'DELETE FROM google_credenciales WHERE usuarioEmail = $1',
      [String(usuarioEmail ?? '').trim().toLowerCase()],
    );
    return resultado.rowCount > 0;
  },
};

export const dbCandidatos = {
  contar: async () => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT COUNT(*) AS total FROM candidatos');
    return Number(resultado.rows[0]?.total ?? 0);
  },
  listarTodos: async (filtros = {}) => {
    await asegurarEsquema();
    const resultado = await obtenerPool().query('SELECT * FROM candidatos ORDER BY fechaPostulacion DESC');
    const candidatos = await Promise.all(
      resultado.rows.map(async (fila) => {
        const normalizado = normalizarFila(fila);
        return aCandidato(
          normalizado,
          await dbArchivos.listarPorCandidato(normalizado.id),
        );
      }),
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
