import test from 'node:test';
import assert from 'node:assert/strict';
import { indicesExcluding, sortedIndices } from './pages.ts';

test('indicesExcluding keeps every index except the excluded ones, in order', () => {
  assert.deepEqual(indicesExcluding(5, new Set([1, 3])), [0, 2, 4]);
});

test('indicesExcluding with nothing excluded keeps every page', () => {
  assert.deepEqual(indicesExcluding(3, new Set()), [0, 1, 2]);
});

test('indicesExcluding excluding every page keeps none', () => {
  assert.deepEqual(indicesExcluding(3, new Set([0, 1, 2])), []);
});

test('sortedIndices returns selected indices in ascending order regardless of selection order', () => {
  assert.deepEqual(sortedIndices(new Set([3, 1, 2])), [1, 2, 3]);
});

test('sortedIndices of an empty selection is empty', () => {
  assert.deepEqual(sortedIndices(new Set()), []);
});
