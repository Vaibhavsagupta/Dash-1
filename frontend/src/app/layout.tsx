import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Importing stylish fonts
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Dashboard System",
  description: "Advanced Role-Based Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`} style={{ fontFamily: 'var(--font-outfit), sans-serif' }} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
