import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mayhemgg.local"),
  title: {
    default: "MayhemGG | ARAM Mayhem and Arena Builds",
    template: "%s | MayhemGG"
  },
  description: "The ultimate ARAM Mayhem and Arena build database for champion rankings, broken builds, augments, item synergies, and quick guides.",
  openGraph: {
    title: "MayhemGG",
    description: "ARAM Mayhem and Arena builds, tier lists, augments, and champion guides.",
    siteName: "MayhemGG",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="noise fixed inset-0 -z-10 opacity-[0.35]" />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
