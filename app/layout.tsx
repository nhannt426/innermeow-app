import type { Metadata } from "next";
import { Fredoka } from "next/font/google"; // Font tròn mập
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "Inner Meow",
  description: "Your Soul Sanctuary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fredoka.className}>{children}</body>
    </html>
  );
}