import { Inter } from "next/font/google";
import "./globals.css";
import dotenv from "dotenv";

dotenv.config();

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Reduce",
  description: "A simple URL shortening service.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://r.webark.in",
    title: "Reduce - Simple URL Shortener",
    description: "A simple URL shortening service to make your links concise.",
    siteName: "Reduce",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reduce - URL Shortening Service",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Basic SEO Meta Tags */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={metadata.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://r.arkorty.xyz" />

        {/* Open Graph Meta Tags */}
        <meta property="og:type" content={metadata.openGraph.type} />
        <meta property="og:locale" content={metadata.openGraph.locale} />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:site_name" content={metadata.openGraph.siteName} />
        <meta property="og:image" content={metadata.openGraph.images[0].url} />
        <meta property="og:image:width" content={metadata.openGraph.images[0].width} />
        <meta property="og:image:height" content={metadata.openGraph.images[0].height} />
        <meta property="og:image:alt" content={metadata.openGraph.images[0].alt} />

        {/* Favicon */}
        <link rel="icon" href={metadata.icons.icon} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
