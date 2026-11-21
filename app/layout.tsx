import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = "https://mayank198010.github.io/PDF-EDITOR";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173f2d",
  colorScheme: "light"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Free PDF Editor Online | Merge, Split, Compress & Convert PDFs",
    template: "%s | FREE EDITOR"
  },
  applicationName: "FREE EDITOR",
  description: "Use FREE EDITOR to merge, split, reorder, rotate, compress and convert PDF files online. Add or remove supported watermarks, protect PDFs with a password, and manage pages. Files are processed locally in your browser.",
  keywords: [
    "free PDF editor", "PDF editor online", "free online PDF tools",
    "merge PDF online", "split PDF online", "compress PDF",
    "PDF compressor", "rotate PDF", "reorder PDF pages",
    "extract PDF pages", "delete PDF pages", "images to PDF",
    "PDF to JPG", "PDF to PNG", "add watermark to PDF",
    "remove PDF watermark annotations", "password protect PDF",
    "PDF page organizer", "browser based PDF editor", "private PDF tools"
  ],
  category: "Productivity",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "FREE EDITOR",
    title: "FREE EDITOR — Free Online PDF Tools",
    description: "Merge, split, compress, rotate and organize PDFs with simple browser-based tools. Your PDF files stay on your device.",
    locale: "en_IN",
    images: [{ url: "/opengraph.svg", width: 1200, height: 630, alt: "FREE EDITOR — Free online PDF tools" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "FREE EDITOR — Free Online PDF Tools",
    description: "Free browser-based tools to merge, split, compress, rotate and organize PDF files.",
    images: ["/opengraph.svg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  },
  manifest: "/manifest.webmanifest"
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FREE EDITOR",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  url: siteUrl,
  description: "A browser-based PDF editor with tools for merging, splitting, compressing, rotating, converting and organizing PDF files.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR"
  },
  featureList: [
    "Merge PDF files",
    "Split PDF by page ranges",
    "Compress PDF files",
    "Rotate and reorder PDF pages",
    "Convert images to PDF and PDF pages to images",
    "Add page watermarks",
    "Remove supported PDF watermark annotations",
    "Password protect PDF files"
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        {children}
        <Script id="software-application-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(softwareApplicationSchema)}
        </Script>
      </body>
    </html>
  );
}
