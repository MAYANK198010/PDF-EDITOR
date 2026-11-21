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
- **Split PDF** — downloads the first page and remaining pages separately.
- **Extract pages** — creates a new PDF from page selections such as `1, 3-5, 8`.
- **Delete pages** — removes selected pages while requiring at least one page to remain.
- **Rotate PDF** — rotates all pages by 90°, 180° or 270°.
- **Page numbers** — adds sequential page numbers at the bottom center.
- **Watermark PDF** — stamps custom text on each page.
- **Edit metadata** — updates title, author, subject and keywords.
- **Optimize PDF** — rewrites the document using PDF object streams. This is structural optimization, not guaranteed image compression.
- **Images to PDF** — combines JPG and PNG images into a PDF.
- **PDF details** — reads page count, file size and title metadata.

Password protection is intentionally marked unsupported because PDF-lib does not provide PDF encryption. The app does not falsely claim a file is protected.

## Privacy

PDF inputs are read through the browser File API and processed in the page. This app does not define an upload endpoint or send documents to a processing server. External font styles are loaded from Google Fonts; use system fonts if you need a fully offline visual experience.

## Current limitations

- A full visual text editor, OCR, Word/Excel/PowerPoint conversions, password encryption, and real image recompression are not included yet.
- Browser memory limits depend on the user's device and the size of input documents.
- Some encrypted, malformed, or unusual PDFs may not be supported by PDF-lib.

## Stack

- Next.js 14 / React 18 / TypeScript
- Tailwind CSS
- pdf-lib for document structure and drawing operations
- Lucide React icons
