# PDF EDITOR

A privacy-minded PDF utility workspace built with Next.js, TypeScript, Tailwind CSS and PDF-lib.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Implemented browser-side tools

- **Merge PDF** — combines multiple PDFs in selected order.
- **Split PDF** — downloads the first page and remaining pages separately.
- **Rotate PDF** — rotates all pages by 90°, 180° or 270°.
- **Optimize PDF** — rewrites the document using PDF object streams. This is structural optimization, not guaranteed image compression.
- **Images to PDF** — combines JPG and PNG images into a PDF.
- **Watermark PDF** — stamps custom text on each page.
- **PDF details** — reads page count, file size and title metadata.

Password protection is intentionally marked unsupported in the interface because PDF-lib does not provide PDF encryption. It does not falsely claim a file is protected.

## Privacy

PDF inputs are read through the browser File API and processed in the page. This app does not define an upload endpoint or send documents to a processing server. External font styles are loaded from Google Fonts; use system fonts if you need a fully offline visual experience.

## Current limitations

- A full visual text editor, OCR, Word/Excel/PowerPoint conversions, and real image recompression are not included yet.
- Browser memory limits depend on the user's device and the size of the input documents.
- Some encrypted, malformed, or unusual PDFs may not be supported by PDF-lib.

## Stack

- Next.js 14 / React 18 / TypeScript
- Tailwind CSS
- pdf-lib for document structure and drawing operations
- Lucide React icons
