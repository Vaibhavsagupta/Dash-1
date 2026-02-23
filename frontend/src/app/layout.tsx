import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Importing stylish fonts
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "DASH2 | AI-Powered Student Performance Dashboard for Coaching Institutes",
  description: "A smart analytics dashboard that helps coaching centers track student performance, predict risks with AI, and improve results by 30%.",
  keywords: ["Student dashboard software India", "Coaching center analytics tool", "AI performance tracking system", "Education ERP", "Student performance prediction"],
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
