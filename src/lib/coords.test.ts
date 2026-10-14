import test from 'node:test';
import assert from 'node:assert/strict';
import { toPdfRect, fontSizeForHeight } from './coords.ts';

test('toPdfRect scales width and height by page size', () => {
  const r = toPdfRect({ x: 0, y: 0, w: 0.5, h: 0.25 }, 200, 400);
  assert.equal(r.width, 100);
  assert.equal(r.height, 100);
});

test('toPdfRect flips the y-axis (screen top-left -> PDF bottom-left origin)', () => {
  // A box pinned to the very top of the screen (y=0) must land at the
  // very top of the PDF page, i.e. at pageHeight - boxHeight from the bottom.
  const r = toPdfRect({ x: 0, y: 0, w: 0.1, h: 0.1 }, 100, 200);
  assert.equal(r.y, 200 - 0 - 20); // pageH - p.y*pageH - height
});

test('toPdfRect pins a box at the bottom of the screen to y=0 in PDF space', () => {
  // y=1 (bottom of screen) with the box height already subtracted means
  // the box's own bottom edge sits flush with the PDF page's bottom edge.
  const r = toPdfRect({ x: 0, y: 1, w: 0.1, h: 0.1 }, 100, 200);
  assert.equal(r.y, 200 - 200 - 20);
});

test('toPdfRect scales x by page width, independent of y', () => {
  const r = toPdfRect({ x: 0.25, y: 0.5, w: 0.1, h: 0.1 }, 400, 300);
  assert.equal(r.x, 100);
});

test('fontSizeForHeight scales proportionally with box height', () => {
  assert.equal(fontSizeForHeight(100), 65);
  assert.equal(fontSizeForHeight(200), 130);
});

test('fontSizeForHeight never returns a size smaller than 8pt', () => {
  assert.equal(fontSizeForHeight(1), 8);
  assert.equal(fontSizeForHeight(0), 8);
});
