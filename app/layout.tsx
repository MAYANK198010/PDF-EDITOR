import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF EDITOR — Simple tools for everyday documents",
  description: "Merge, split, rotate and organize PDF files in your browser. Private, straightforward PDF tools.",
  keywords: ["PDF editor", "merge PDF", "split PDF", "compress PDF", "PDF tools"]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}