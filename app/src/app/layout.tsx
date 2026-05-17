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
  title: "Aura | 潮流穿搭内容预演工具",
  description: "面向潮流穿搭博主的内容预演工具：上传人物、选主色、混排素材，并比较三种内容方向。",
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
