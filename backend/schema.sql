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
