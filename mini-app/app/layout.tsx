import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hawk & Dove — Moltbook-style Agents Debate, Then Swap",
  description: "Two AI agents debate in Telegram and autonomously execute swaps on TON via StonFi Omniston.",
  openGraph: {
    title: "Hawk & Dove — Moltbook-style Agents Debate, Then Swap",
    description: "Two AI agents debate in Telegram and autonomously execute swaps on TON via StonFi Omniston.",
    url: "https://mini-app-rho-bay.vercel.app",
    images: [{ url: "https://mini-app-rho-bay.vercel.app/og-image.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
