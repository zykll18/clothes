import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistLatin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoLatin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

const cormorant = localFont({
  src: [
    {
      path: "./fonts/CormorantGaramondItalicLatin.woff2",
      style: "italic",
      weight: "400 600",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aura | AI 试衣叙事体验",
  description: "以高级时装视觉语言重构的 AI 试衣与穿搭预览体验首页。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} bg-[#050505] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
