import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "白蛇神：墨影之境 | Orochi Zen",
  description: "世界级和风水墨贪吃蛇游戏。水墨写意、枯山水沙纹、落樱飘零、纯 Web Audio 和筝音阶实时合成。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full w-full overflow-hidden bg-neutral-950 text-stone-100 font-sans">{children}</body>
    </html>
  );
}
