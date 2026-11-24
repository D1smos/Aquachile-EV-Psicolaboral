CREATE TABLE IF NOT EXISTS ofertas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  ubicacion TEXT NOT NULL,
  familiaCargo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT '',
  modalidad TEXT NOT NULL DEFAULT 'Presencial',
  fechaPublicacion TEXT NOT NULL,
  cupos INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'borrador',
  funciones TEXT NOT NULL DEFAULT '',
  requisitos TEXT NOT NULL DEFAULT '',
  beneficios TEXT NOT NULL DEFAULT '',
  sueldo TEXT NOT NULL DEFAULT '',
  creadoEn TEXT NOT NULL,
  actualizadoEn TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ofertas_modalidad ON ofertas(modalidad);
CREATE INDEX IF NOT EXISTS idx_ofertas_estado ON ofertas(estado);
CREATE INDEX IF NOT EXISTS idx_ofertas_familia ON ofertas(familiaCargo);
