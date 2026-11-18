-- Actualización idempotente para PostgreSQL/Supabase.
-- Ejecutar una sola vez en el SQL Editor del proyecto. No elimina datos existentes.

ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS consentimiento BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS fechaConsentimiento TEXT;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS resumenIA TEXT;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS afinidadIA REAL;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS borradorIA TEXT;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS fechaAsistencia TEXT;

ALTER TABLE archivos ADD COLUMN IF NOT EXISTS storageKey TEXT;
ALTER TABLE archivos ADD COLUMN IF NOT EXISTS proveedor TEXT;
ALTER TABLE archivos ADD COLUMN IF NOT EXISTS bucket TEXT;
ALTER TABLE archivos ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE archivos ADD COLUMN IF NOT EXISTS deletedAt TEXT;

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
  UNIQUE (candidatoId, textoHash, cargo, promptVersion, modelo)
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
