import type { Placement } from './coords';

// A draggable/resizable overlay box in on-screen pixels (not fractions —
// see boxToPlacement for the conversion to the 0..1 Placement used by the
// PDF-stamping math in coords.ts).
export type Box = { x: number; y: number; w: number; h: number };

const MIN_W = 24;
const MIN_H = 16;

export function movedBox(box: Box, dx: number, dy: number): Box {
  return { ...box, x: box.x + dx, y: box.y + dy };
}

export function resizedBox(box: Box, dx: number, dy: number): Box {
  return {
    ...box,
    w: Math.max(MIN_W, box.w + dx),
    h: Math.max(MIN_H, box.h + dy),
  };
}

export function boxToPlacement(box: Box, containerW: number, containerH: number): Placement {
  return {
    x: box.x / containerW,
    y: box.y / containerH,
    w: box.w / containerW,
    h: box.h / containerH,
  };
}

export function placementToBox(p: Placement, containerW: number, containerH: number): Box {
  return {
    x: p.x * containerW,
    y: p.y * containerH,
    w: p.w * containerW,
    h: p.h * containerH,
  };
}
