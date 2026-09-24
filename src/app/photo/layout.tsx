import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import "@/styles/darkroom.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dan1d.dev"),
  title: {
    template: "%s · Daniel Dominguez Photography",
    default: "Daniel Dominguez Photography",
  },
  description: "Photography by Daniel Dominguez, shot on a Nikon D850.",
  openGraph: {
    title: "Daniel Dominguez Photography",
    description: "Photography by Daniel Dominguez, shot on a Nikon D850.",
    url: "https://dan1d.dev/photo",
    siteName: "Daniel Dominguez Photography",
    locale: "en_US",
    type: "website",
  },
};

export default function PhotoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${fraunces.variable} darkroom min-h-screen`}>
      {children}
    </div>
  );
}
