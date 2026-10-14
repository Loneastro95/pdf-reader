import test from 'node:test';
import assert from 'node:assert/strict';
import { movedBox, resizedBox, boxToPlacement } from './overlayMath.ts';

test('movedBox shifts x/y by the drag delta, leaving size untouched', () => {
  const next = movedBox({ x: 10, y: 20, w: 100, h: 40 }, 5, -3);
  assert.deepEqual(next, { x: 15, y: 17, w: 100, h: 40 });
});

test('resizedBox grows width/height by the drag delta, leaving position untouched', () => {
  const next = resizedBox({ x: 10, y: 20, w: 100, h: 40 }, 20, 10);
  assert.deepEqual(next, { x: 10, y: 20, w: 120, h: 50 });
});

test('resizedBox never shrinks below the minimum size', () => {
  const next = resizedBox({ x: 0, y: 0, w: 30, h: 20 }, -1000, -1000);
  assert.equal(next.w, 24);
  assert.equal(next.h, 16);
});

test('boxToPlacement converts a pixel box into 0..1 fractions of the container', () => {
  const p = boxToPlacement({ x: 50, y: 100, w: 200, h: 40 }, 400, 800);
  assert.deepEqual(p, { x: 0.125, y: 0.125, w: 0.5, h: 0.05 });
});
