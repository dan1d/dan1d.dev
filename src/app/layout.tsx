import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

import Instructions from "@/components/ui/Instructions";
import GlobalMatrixRain from "@/components/ui/GlobalMatrixRain";
import { siteConfig } from "@/data/projects";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "dan1d.dev | Full-Stack Engineer",
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased matrix-scanlines`}
      >
        <Navbar />
        <GlobalMatrixRain />
        <Instructions />
        {children}
      </body>
    </html>
  );
}
