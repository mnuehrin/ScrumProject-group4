import "./globals.css";
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Employee Feedback Platform",
  description: "Anonymous employee feedback and admin insights"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
