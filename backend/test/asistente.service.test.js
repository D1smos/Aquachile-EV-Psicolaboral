import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET ||= 'secreto-de-prueba';
const { construirAsistencia, semaforoDe } = await import('../src/services/asistente.service.js');

const candidatoBase = {
  nombre: 'Ana Prueba',
  cargo: 'Monitor Producción',
  familiaCargo: 'Técnico B/C',
  aniosExperiencia: 6,
  formacion: 'Técnico',
  disponibilidad: 'Inmediata',
  motivacion: 'Me interesa el cargo',
};

test('el resumen menciona cargo, experiencia, formación y disponibilidad', () => {
  const { resumen } = construirAsistencia(candidatoBase, null);
  assert.match(resumen, /Monitor Producción/);
  assert.match(resumen, /6 años de experiencia/);
  assert.match(resumen, /Técnico/);
  assert.match(resumen, /Inmediata/);
});

test('sin CV legible la afinidad es nula y lo indica', () => {
  const asistencia = construirAsistencia(candidatoBase, null);
  assert.equal(asistencia.afinidad, null);
  assert.equal(asistencia.sinCv, true);
  assert.match(asistencia.resumen, /CV legible/);
  assert.match(asistencia.borrador, /revisar antes de usar/i);
});

test('la afinidad mide coincidencias entre CV y cargo', () => {
  const texto = 'Experiencia como monitor en planta de producción y bodega.';
  const asistencia = construirAsistencia(candidatoBase, texto);
  assert.deepEqual(asistencia.coincidencias, ['monitor', 'produccion']);
  assert.equal(asistencia.afinidad, 67);
  assert.equal(asistencia.sinCv, false);
  assert.match(asistencia.resumen, /67%/);
});

test('un CV sin relación da afinidad cero pero no nula', () => {
  const asistencia = construirAsistencia(candidatoBase, 'Me gustan los viajes y la música.');
  assert.equal(asistencia.afinidad, 0);
  assert.equal(asistencia.sinCv, false);
});

test('el borrador destaca experiencia sólida desde 5 años', () => {
  const { borrador } = construirAsistencia(candidatoBase, null);
  assert.match(borrador, /experiencia sólida de 6 años/);
  const junior = construirAsistencia({ ...candidatoBase, aniosExperiencia: 1 }, null);
  assert.match(junior.borrador, /motivación declarada/);
});

test('reporta las brechas del CV frente al cargo', () => {
  const texto = 'Experiencia como monitor en planta de producción y bodega.';
  const asistencia = construirAsistencia(candidatoBase, texto);
  assert.deepEqual(asistencia.faltantes, ['tecnico']);
});

test('el semáforo clasifica la afinidad en tramos', () => {
  assert.equal(semaforoDe(null), 'sin-datos');
  assert.equal(semaforoDe(85), 'alto');
  assert.equal(semaforoDe(67), 'medio');
  assert.equal(semaforoDe(20), 'bajo');
});
