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
  title: "Aura | 潮流穿搭衣橱预览工具",
  description: "面向潮流穿搭博主的 AI 衣橱搭配工具：上传本人和衣服，按配色与风格选衣并生成上身预览。",
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
