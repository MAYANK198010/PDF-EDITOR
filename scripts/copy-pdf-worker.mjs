import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
const publicDir = resolve("public");
const destination = resolve(publicDir, "pdf.worker.min.mjs");

await mkdir(publicDir, { recursive: true });
await copyFile(source, destination);
console.log("Copied matching PDF.js worker into public/pdf.worker.min.mjs");
