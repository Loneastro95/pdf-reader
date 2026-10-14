import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { toPdfRect, fontSizeForHeight, Placement } from './coords';

export async function addSignature(
  pdfBase64: string,
  pageIndex: number,          // 0-based
  signaturePng: string,       // data URL or base64
  placement: Placement,
) {
  const doc = await PDFDocument.load(pdfBase64);
  const page = doc.getPage(pageIndex);
  const { width, height } = page.getSize();

  const img = await doc.embedPng(signaturePng);
  const r = toPdfRect(placement, width, height);
  page.drawImage(img, { x: r.x, y: r.y, width: r.width, height: r.height });

  return doc.saveAsBase64(); // returns base64 string
}

export async function addText(
  pdfBase64: string,
  pageIndex: number,
  text: string,
  placement: Placement, // same box the user dragged/pinched, 0..1 of the page
) {
  const doc = await PDFDocument.load(pdfBase64);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.getPage(pageIndex);
  const { width, height } = page.getSize();

  const r = toPdfRect(placement, width, height);
  const size = fontSizeForHeight(r.height);
  page.drawText(text, {
    x: r.x,
    y: r.y,
    size,
    font,
    color: rgb(0, 0, 0),
  });
  return doc.saveAsBase64();
}

export async function deletePage(b64: string, index: number) {
  const doc = await PDFDocument.load(b64);
  doc.removePage(index);
  return doc.saveAsBase64();
}

export async function rotatePage(b64: string, index: number, delta = 90) {
  const doc = await PDFDocument.load(b64);
  const page = doc.getPage(index);
  page.setRotation(degrees((page.getRotation().angle + delta) % 360));
  return doc.saveAsBase64();
}

export async function mergePdfs(a: string, b: string) {
  const out = await PDFDocument.create();
  for (const src of [a, b]) {
    const d = await PDFDocument.load(src);
    const pages = await out.copyPages(d, d.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.saveAsBase64();
}

export async function extractPages(b64: string, indices: number[]) {
  const src = await PDFDocument.load(b64);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out.saveAsBase64();
}