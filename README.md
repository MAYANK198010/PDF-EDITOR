# PDF EDITOR

A privacy-minded PDF utility workspace built with Next.js, TypeScript, Tailwind CSS and PDF-lib.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Browser-side tools

- **Merge PDF** — combines multiple PDFs in a user-controlled order. Use the up/down controls to reorder files before merging.
- **Split PDF** — split by pages per file or custom page groups.
- **Extract pages** — creates a new PDF from page selections such as `1, 3-5, 8`.
- **Reorder pages** — rebuilds the PDF in a custom sequence; list every page once, such as `3, 1, 2`.
- **Duplicate pages** — appends copies of selected pages to the end of the document.
- **PDF to images** — renders each PDF page locally as a PNG or JPEG image at 1.5× scale.
- **Add blank pages** — inserts 1–20 blank pages at the start or end, using the first page dimensions.
- **Delete pages** — removes selected pages while requiring at least one page to remain.
- **Rotate PDF** — rotate the whole document or selected pages by 90°, 180° or 270°.
- **Page numbers** — adds sequential page numbers at the bottom center.
- **Watermark PDF** — stamp custom text on all pages or selected page ranges.
- **Edit metadata** — updates title, author, subject and keywords.
- **Compress PDF** — choose low, medium or high compression, or set a best-effort target size. This rasterizes pages, so searchable text and vectors are not preserved.
- **Images to PDF** — combines JPG and PNG images in a user-controlled order.
- **PDF details** — reads page count, file size and title metadata.
- **Visual page manager** — preview page thumbnails, drag or move pages, mark pages for removal and export the result.

- **Protect PDF** — adds AES-256 password encryption locally in the browser. Keep the password safe; it cannot be recovered if lost.
- **Reorder pages** — preview page thumbnails and drag or move them into the required order.

## Privacy

PDF inputs are read through the browser File API and processed in the page. This app does not define an upload endpoint or send documents to a processing server. External font styles are loaded from Google Fonts; use system fonts if you need a fully offline visual experience.

## Current limitations

- A full visual text editor, OCR, Word/Excel/PowerPoint conversions, password encryption, and real image recompression are not included yet. The visual page manager handles page order and removal, not text or image content editing.
- Browser memory limits depend on the user's device and the size of input documents.
- Some encrypted, malformed, or unusual PDFs may not be supported by PDF-lib.

## Stack

- Next.js 14 / React 18 / TypeScript
- Tailwind CSS
- pdf-lib for document structure and drawing operations
- Lucide React icons
