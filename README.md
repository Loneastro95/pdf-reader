# PDF Studio

A mobile app for opening a PDF, paging through it, stamping a drawn
signature onto it, and dropping in short pieces of typed text — built with
Expo and Expo Router.

It places a *picture* of a signature (and plain typed text) onto the page,
like most consumer "sign a document" apps. That is not the same as a
certificate-based cryptographic signature — see [Limitations](#limitations).

## Quick start

`react-native-pdf` and `react-native-signature-canvas` use native code, so
**Expo Go will not run this app** — you need a development build.

```bash
npm install
npx expo run:android   # or: npx expo run:ios
```

Then for day-to-day development:

```bash
npx expo start --dev-client
```

Open a PDF from the home screen, page through it, tap **Sign** or
**Add text**, drag the preview where you want it, then tap **Place**. Tap
**Pages** to remove pages, split some out into a new file, or merge in
another PDF.

## How it works

**The analogy:** picture the phone screen as a photo of a page taped to a
clipboard, and the PDF file as the real page underneath. You stick a sticky
note onto the *photo*. To put a matching sticker on the *real* page, you
can't reuse the photo's pixel coordinates directly — the photo is a
different size than the real page, and worse, the two use rulers that point
opposite ways: the photo's ruler starts at the top, the real page's ruler
(in PDF, by spec) starts at the bottom. So instead of pixels, the app
records the sticker's position as a *percentage* of the photo ("30% in from
the left, 70% down"), then applies that same percentage to the real page's
actual size — flipping the vertical percentage on the way, because the two
rulers run in opposite directions.

**The pipeline**, end to end:

```
Home                Viewer                        Sign / Add text
┌──────────┐  pick   ┌──────────────────┐  tap    ┌───────────────────┐
│ Choose a │ ------> │ react-native-pdf │ ------> │ draw signature, or│
│   PDF    │  file   │ renders 1 page   │         │ type a short text │
└──────────┘         └──────────────────┘         └─────────┬─────────┘
                              ^                              │ dataURL / string
                              │ new file URI                 v
                     ┌──────────────────┐          ┌───────────────────┐
                     │   pdf-lib writes │ <------- │ drag + pinch the  │
                     │  a NEW PDF file  │  Place   │ overlay (fraction │
                     └──────────────────┘          │  of the page, 0–1)│
                                                    └───────────────────┘
```

The "fraction of the page, 0–1" part is the key idea — it's what makes the
sticker-on-the-photo trick work:

```
Screen overlay (SignatureOverlay.tsx / TextOverlay.tsx)
  x: 0.30, y: 0.70         <- top-left corner, as a % of the page you can see
  w: 0.35, h: 0.14         <- size, also as a %
          │
          │  toPdfRect()  (lib/coords.ts)
          v
PDF page (lib/pdfEdit.ts, via pdf-lib)
  x = 0.30 * pageWidth
  y = pageHeight - 0.70*pageHeight - (0.14*pageHeight)   <- the flip
  w = 0.35 * pageWidth
  h = 0.14 * pageHeight

   screen (top-left origin)        PDF page (bottom-left origin)
   0 ───────────────► x            h ───────────────► x
   │                                │
   │   [sticker]                   │
   │                                │   [sticker]
   ▼ y                              0 ─────────────────────────► (y=0 here)
```

**Walking through a real tap:**

1. You drag the signature preview to roughly the middle of the page.
   `SignatureOverlay` reports `{ x: 0.3, y: 0.7, w: 0.35, h: 0.14 }` —
   plain fractions, nothing device-specific.
2. You tap **Place signature**. `viewer.tsx` reads the *current* PDF file
   as base64 (`readAsBase64`) and hands it, the fraction box, and the
   signature PNG to `addSignature()` in `lib/pdfEdit.ts`.
3. `addSignature` asks `pdf-lib` for the *real* page size in PDF points
   (e.g. 612×792 for US Letter), runs `toPdfRect()` to convert the fraction
   box into real points — flipping the y-axis — and draws the image there.
4. The edited PDF is saved to a **brand-new, timestamped file**
   (`signed-<timestamp>.pdf`), never overwriting your original, and the
   viewer reloads that new file.

Adding text follows the same pipeline, just swapping the signature PNG for
a typed string and deriving a font size from the box's height
(`fontSizeForHeight` in `lib/coords.ts`) so the stamped text roughly fills
the box you dragged.

**The gotcha:** it's tempting to read pixel coordinates straight off the
screen and use them as PDF coordinates. That breaks two ways at once: the
PDF page is almost never the same pixel size as your phone screen, *and*
PDF's y-axis counts up from the bottom while every touch event on screen
counts down from the top. Skip the fraction step and signatures land
upside-down, mirrored, or just off to the side — which is exactly what
`react-native-pdf`'s own troubleshooting notes call out. Converting to a
0–1 fraction first, and only translating to real units at the very end (in
`toPdfRect`), is what keeps the two coordinate systems from leaking into
each other.

## Split, merge, remove pages

**The analogy:** think of the document as a deck of index cards, one per
page. "Remove" takes some cards out of the deck you're holding. "Split"
photocopies a few chosen cards into a brand-new deck, leaving your
original deck exactly as it was. "Merge" takes someone else's deck and
tapes it onto the end of yours. All three are really the same move —
*copy some pages into a (possibly new) document* — pdf-lib just calls it
`copyPages`.

```
Pages screen (app/pages.tsx) — tap pages to select them, 0-based indices

  Remove            selected = {1, 3}            keep = indicesExcluding(5, selected)
  ───────►   pages [0,1,2,3,4]   ────────────►    [0, 2, 4]  → extractPages → replaces current file

  Extract           selected = {1, 3}             indices = sortedIndices(selected)
  ───────►   pages [0,1,2,3,4]   ────────────►    [1, 3]     → extractPages → a brand-new file

  Merge      current doc  +  a second picked PDF  → mergePdfs → appends its pages onto the end
```

`indicesExcluding`/`sortedIndices` (`lib/pages.ts`) are pure — they just
turn a page selection into the 0-based index array pdf-lib expects — so
they're unit-tested without touching an actual PDF (`lib/pages.test.ts`).

**The gotcha:** "Remove" and "Extract" call the exact same `extractPages`
function with different index lists — the only real difference is which
file the result gets written to (the *current* file for Remove, a *new*
file for Extract). It would be easy to conflate them and accidentally
overwrite the original when the user only meant to split a few pages out;
that's why `extractToNewFile` in `viewer.tsx` never calls `setUri` — only
`removePages` does.

## Project structure

| File | Role |
| --- | --- |
| `src/app/index.tsx` | Home — pick a PDF, hand off to the viewer |
| `src/app/viewer.tsx` | Page navigation, toolbar, and the sign/add-text flow |
| `src/app/sign.tsx` | Full-screen signature pad (`react-native-signature-canvas`) |
| `src/app/pages.tsx` | Select pages to remove, split out, or merge another PDF into |
| `src/components/PdfViewer.tsx` | Thin wrapper around `react-native-pdf` |
| `src/components/DraggableBox.tsx` | Drag/resize a box with `PanResponder` — shared by both overlays below |
| `src/components/SignatureOverlay.tsx` | A signature image placed in a `DraggableBox` |
| `src/components/TextOverlay.tsx` | A short text box placed in a `DraggableBox` |
| `src/components/TextPromptModal.tsx` | The "type your text" dialog |
| `src/components/Toolbar.tsx` | Bottom action bar |
| `src/lib/files.ts` | Pick, read, and write PDF files on disk |
| `src/lib/coords.ts` | Pure geometry: fraction ↔ PDF-point conversion |
| `src/lib/overlayMath.ts` | Pure geometry: drag/resize math for `DraggableBox` |
| `src/lib/pages.ts` | Pure logic: page selection → the index arrays pdf-lib expects |
| `src/lib/pdfEdit.ts` | All `pdf-lib` operations (stamp image/text, page ops) |

## Limitations

- **Visual, not cryptographic.** No certificate, no tamper detection. For
  that, see `@signpdf/signpdf` (Node, server-side) or an e-signature
  provider's API.
- **Free-floating text, not AcroForm fields.** "Add text" drops a text box
  anywhere on the page — it does not detect or fill a PDF's existing
  interactive form fields. If your PDF *does* have real form fields,
  `pdfEdit.ts` has everything needed to fill them
  (`doc.getForm().getTextField(name).setText(...)`) — it just isn't wired
  to a UI yet, since discovering field names/positions per-document is a
  bigger feature than a single text box.
- **One page visible at a time**, by design (`enablePaging` on
  `react-native-pdf`) — this is what keeps the fraction-based placement
  math simple; see [How it works](#how-it-works).
- **The Pages screen lists page numbers, not thumbnails.** Rendering a
  thumbnail per page would mean instantiating one native PDF view per
  page, which gets expensive fast on a long document; a numbered list
  stays honest about what's actually there instead of faking a preview.
- **Large files** run `pdf-lib` entirely in memory on the JS thread, so
  very large PDFs — and merging two large ones — can be slow on low-end
  devices.

## Commands

```bash
npx expo lint        # lint
npx tsc --noEmit      # typecheck
npm test              # unit tests for the pure logic (lib/coords.ts, overlayMath.ts, pages.ts)
```

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)
- [pdf-lib](https://pdf-lib.js.org)
- [react-native-pdf](https://github.com/wonday/react-native-pdf)
- [react-native-signature-canvas](https://github.com/YanYuanFE/react-native-signature-canvas)
