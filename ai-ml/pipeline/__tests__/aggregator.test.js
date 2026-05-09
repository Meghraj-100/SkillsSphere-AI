import { test } from 'node:test';
import assert from 'node:assert';
import { jdWeights, noJdWeights } from '../../config/weights.config.js';

test('aggregator config weights', async (t) => {
  await t.test('JD weights sum to 1.0', () => {
    const sum = Object.values(jdWeights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected 1.0 but got ${sum}`);
  });

  await t.test('No JD weights sum to 1.0', () => {
    const sum = Object.values(noJdWeights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected 1.0 but got ${sum}`);
  });
});
