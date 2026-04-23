import type { Metadata } from "next";
import { Inter, Playfair_Display, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { Toaster } from "sonner";


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ['normal', 'italic']
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"]
});

export const metadata: Metadata = {
  title: "Evalis | Academic Intelligence Platform",
  description: "Multi-tenant academic performance analytics and management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${instrument.variable} antialiased selection:bg-brand-green selection:text-white`}>
        <div className="noise-overlay" />
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}