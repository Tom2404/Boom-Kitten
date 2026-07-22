import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGlitterTrailBlueprints,
  createTrailSeed,
  sampleGlitterTrailPoint,
} from '../src/vfx/config/glitterTrailConfig.js';

test('glitter trail splits its budget across dust, flecks, and rare hero sparkles', () => {
  const blueprints = createGlitterTrailBlueprints({
    color: 0xf6c453,
    accent: 0xfff7d6,
    count: 40,
    size: 10,
    spread: 32,
    particleBudget: 40,
  });

  assert.deepEqual(blueprints.map((layer) => layer.id), ['dust', 'flecks', 'sparkles']);
  assert.equal(blueprints.reduce((total, layer) => total + layer.maxParticles, 0), 40);
  assert.ok(blueprints[0].maxParticles > blueprints[1].maxParticles);
  assert.ok(blueprints[1].maxParticles > blueprints[2].maxParticles);
  assert.ok(blueprints[2].maxParticles >= 1);
});

test('glitter trail blueprints use soft fade, additive light, drag, and non-square texture families', () => {
  const blueprints = createGlitterTrailBlueprints({
    color: 0x38bdf8,
    accent: 0xffffff,
    count: 26,
    size: 12,
    spread: 44,
    particleBudget: 26,
  });

  for (const blueprint of blueprints) {
    assert.equal(blueprint.blendMode, 'add');
    assert.ok(blueprint.lifetime.min < blueprint.lifetime.max);
    assert.ok(blueprint.speed.start > blueprint.speed.end);
    assert.ok(blueprint.scale.start < 0.6);
    assert.ok(blueprint.alpha.some((keyframe) => keyframe.time > 0 && keyframe.value > 0));
    assert.equal(blueprint.alpha.at(-1).value, 0);
    assert.ok(blueprint.textureFamily.length >= 1);
  }

  assert.deepEqual(blueprints[0].textureFamily, ['soft', 'grain']);
  assert.deepEqual(blueprints[1].textureFamily, ['fleck', 'grain']);
  assert.deepEqual(blueprints[2].textureFamily, ['sparkle', 'soft']);
});

test('reduced particle budget remains layered without exceeding eight particles', () => {
  const blueprints = createGlitterTrailBlueprints({ count: 30, particleBudget: 8 });

  assert.equal(blueprints.reduce((total, layer) => total + layer.maxParticles, 0), 8);
  assert.ok(blueprints.every((layer) => layer.maxParticles >= 1));
});

test('trail sampling is deterministic, preserves endpoints, and changes with the seed', () => {
  const start = { x: 20, y: 40 };
  const end = { x: 420, y: 220 };
  const seedA = createTrailSeed(start, end, 26);
  const seedB = createTrailSeed(start, end, 27);

  assert.deepEqual(sampleGlitterTrailPoint(start, end, 0, { spread: 44, seed: seedA }), start);
  assert.deepEqual(sampleGlitterTrailPoint(start, end, 1, { spread: 44, seed: seedA }), end);

  const first = sampleGlitterTrailPoint(start, end, 0.43, { spread: 44, seed: seedA });
  const repeated = sampleGlitterTrailPoint(start, end, 0.43, { spread: 44, seed: seedA });
  const differentSeed = sampleGlitterTrailPoint(start, end, 0.43, { spread: 44, seed: seedB });

  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first, differentSeed);
});
