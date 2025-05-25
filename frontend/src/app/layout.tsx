// src/app/layout.tsx (מעודכן עם AuthProvider)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar"; 
import Footer from "@/components/Footer"; 
import { AuthProvider } from "@/contexts/AuthContext"; // <-- ייבוא חדש

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"], 
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"], 
});

export const metadata: Metadata = {
  title: "בשרומטר 1.0 - השוואת מחירי בשר", 
  description: "מצא את המחירים הטובים ביותר לבשר טרי וקפוא באזורך.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-slate-50`}
      >
        <AuthProvider> {/* <--- עוטפים כאן */}
          <Navbar /> 
          <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <Footer /> 
        </AuthProvider> {/* <--- סוגרים כאן */}
      </body>
    </html>
  );
}