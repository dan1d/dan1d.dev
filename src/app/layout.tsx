import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

import Instructions from "@/components/ui/Instructions";
import GlobalMatrixRain from "@/components/ui/GlobalMatrixRain";
import { OnboardingProvider } from "@/context/OnboardingContext";
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
  metadataBase: new URL("https://dan1d.dev"),
  title: "dan1d.dev | Full-Stack Engineer",
  description: siteConfig.description,
  openGraph: {
    title: "dan1d.dev | Full-Stack Engineer",
    description: siteConfig.description,
    url: "https://dan1d.dev",
    siteName: "dan1d.dev",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "dan1d.dev — Senior Full-Stack Engineer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "dan1d.dev | Full-Stack Engineer",
    description: siteConfig.description,
    images: ["/og.png"],
  },
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
        <OnboardingProvider>
          <Navbar />
          <GlobalMatrixRain />
          <Instructions />
          {children}
        </OnboardingProvider>
      </body>
    </html>
  );
}
