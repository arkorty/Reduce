import { Inter } from "next/font/google";
import "./globals.css";
import dotenv from "dotenv";

dotenv.config();

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "URL Shortener",
  description: "A simple URL shortener application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
