import type { Metadata } from "next";
import { Geist_Mono, Hind_Siliguri } from "next/font/google";

import { Navbar } from "@/components/shared/navbar/Navbar";
import { Footer } from "@/components/shared/footer/Footer";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { LeadAttributionCapture } from "@/components/shared/LeadAttributionCapture";

import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAGE Academy",
  description: "Academic and admission care in Banasree.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hindSiliguri.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LeadAttributionCapture />
        <ToastContainer position="top-right" autoClose={3000} />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
