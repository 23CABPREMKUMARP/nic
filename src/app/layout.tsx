import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Nilgiri E-Pass Smart Experience",
  description: "Advanced Crowd & Parking Management System for Nilgiris",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen relative overflow-x-hidden`}
        >
          {/* Parallax Background Layers */}
          <div className="nilgiri-bg" />
          <div className="mist-overlay" />

          {/* Main Content */}
          <main className="relative z-10 w-full min-h-screen flex flex-col">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
