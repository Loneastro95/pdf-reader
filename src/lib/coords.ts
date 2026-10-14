export type Placement = { x: number; y: number; w: number; h: number };

export function toPdfRect(p: Placement, pageW: number, pageH: number) {
  const width = p.w * pageW;
  const height = p.h * pageH;
  return {
    x: p.x * pageW,
    y: pageH - p.y * pageH - height, // flip the y-axis
    width,
    height,
  };
}

// Derives a text box's font size from the PDF-point height of the box the
// user dragged/pinched on screen, so the stamped text roughly fills the box
// they previewed instead of always using one fixed size.
export function fontSizeForHeight(height: number) {
  return Math.max(8, Math.round(height * 0.65));
}