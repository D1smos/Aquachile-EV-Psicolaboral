import test from 'node:test';
import assert from 'node:assert/strict';
import { RONDAS_DEMO } from '../src/services/seed.service.js';
import { esRutValido } from '../src/utils/validadores.js';

test('los RUT del lote demo son válidos y no se repiten', () => {
  const ruts = RONDAS_DEMO.map((demo) => demo.rut);

  assert.equal(new Set(ruts.map((rut) => rut.replace(/[.\-]/g, ''))).size, ruts.length);
  for (const rut of ruts) {
    assert.equal(esRutValido(rut), true, `RUT demo inválido: ${rut}`);
  }
});

test('los correos del lote demo son únicos', () => {
  const correos = RONDAS_DEMO.map((demo) => demo.correo);
  assert.equal(new Set(correos).size, correos.length);
});
