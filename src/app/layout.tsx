import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/layout/Navigation";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomeAI - Israel Investment Finder",
  description: "Find the best home investment opportunities in Israel using government open data",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-20 md:pb-6">
          {children}
        </main>
        <MobileBottomNav />
      </body>
    </html>
  );
}
