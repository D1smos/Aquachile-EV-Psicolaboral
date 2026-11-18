import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET ||= 'secreto-analisis-validator';
const { validarRevision, validarSolicitudAnalisis } = await import(
  '../src/validators/analisis.validator.js'
);
const { limpiarJson, validarEsquemaAnalisis } = await import('../src/services/ia/esquema.js');

const analisisValido = () => ({
  version: '1.0',
  resumen: 'Perfil con experiencia suficiente para el cargo y brechas acotadas.',
  anosExperienciaEstimados: 6,
  palabrasClaveDetectadas: [' Python ', 'python', 'SQL'],
  afinidad: { score: 78, nivel: 'alto', justificacion: 'Coincide con los requisitos principales.' },
  fortalezas: [{ titulo: 'Experiencia', evidencia: 'Seis años en planta', documento: 'cv.pdf' }],
  brechas: [{ titulo: 'Idioma', evidencia: 'No declara inglés', documento: 'cv.pdf' }],
  competencias: [
    {
      id: 'trabajo-equipo',
      nombre: 'Trabajo en equipo',
      nivel: 4,
      evidencia: ['Coordinación de turnos'],
      confianza: 0.8,
    },
  ],
  preguntasEntrevista: [
    { pregunta: '¿Cómo coordinó turnos?', objetivo: 'Validar experiencia', competenciaId: 'trabajo-equipo' },
  ],
  recomendacion: { codigo: 'avanzar', texto: 'Continuar con entrevista.' },
  confianza: 0.82,
  advertencias: ['Validar experiencia declarada.'],
});

test('acepta una solicitud de análisis vacía y valida sus tipos', () => {
  assert.deepEqual(validarSolicitudAnalisis({}), []);
  assert.equal(validarSolicitudAnalisis({ forzar: 'si' }).length, 1);
  assert.equal(validarSolicitudAnalisis({ cargo: 'x'.repeat(121) }).length, 1);
});

test('valida el estado y comentario de una revisión', () => {
  assert.deepEqual(validarRevision({ estado: 'revisado' }), []);
  assert.deepEqual(validarRevision({ estado: 'descartado', comentario: 'Sin evidencia' }), []);
  assert.equal(validarRevision({ estado: 'aprobado' }).length, 1);
  assert.equal(validarRevision({ estado: 'revisado', comentario: 'x'.repeat(1001) }).length, 1);
});

test('limpia markdown y normaliza el contrato de la IA', () => {
  const texto = `Aquí está el resultado:\n\`\`\`json\n${JSON.stringify(analisisValido())}\n\`\`\``;
  assert.match(limpiarJson(texto), /^\{"version":"1.0"/);
  const analisis = validarEsquemaAnalisis(texto);
  assert.deepEqual(analisis.palabrasClaveDetectadas, ['python', 'sql']);
  assert.equal(analisis.afinidad.score, 78);
});

test('rechaza JSON inválido con un error de gateway', () => {
  assert.throws(
    () => validarEsquemaAnalisis('```json\n{ roto\n```'),
    (error) => error.codigo === 502 && error.codigoIA === 'BAD_GATEWAY_IA',
  );
  const invalido = analisisValido();
  invalido.afinidad.score = 101;
  assert.throws(
    () => validarEsquemaAnalisis(invalido),
    (error) => error.codigo === 502 && error.codigoIA === 'BAD_GATEWAY_IA',
  );
  const sinResumen = analisisValido();
  sinResumen.resumen = 'corto';
  assert.throws(() => validarEsquemaAnalisis(sinResumen), /resumen/);
});
