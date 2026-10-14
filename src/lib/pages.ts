// Pure helpers for the Pages screen: turning a user's page selection into
// the 0-based index arrays pdf-lib's copyPages/removePage expect. Kept
// separate from pdfEdit.ts (which does the actual file I/O) so the
// selection logic can be unit-tested without touching a PDF at all.

export function indicesExcluding(total: number, excluded: ReadonlySet<number>): number[] {
  const keep: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!excluded.has(i)) keep.push(i);
  }
  return keep;
}

export function sortedIndices(selected: ReadonlySet<number>): number[] {
  return Array.from(selected).sort((a, b) => a - b);
}
