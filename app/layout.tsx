import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FREE + ADS | FREE EDITOR",
  description: "Free browser-based PDF editor. Merge, split, rotate, compress, watermark and protect PDF files locally.",
  keywords: ["PDF editor", "merge PDF", "split PDF", "compress PDF", "PDF tools"]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}