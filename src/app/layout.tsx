import type { Metadata } from "next";
import { Anek_Bangla, Geist_Mono, Hind_Siliguri, Noto_Sans_Bengali, Plus_Jakarta_Sans } from "next/font/google";

import { Navbar } from "@/components/shared/navbar/Navbar";
import { Footer } from "@/components/shared/footer/Footer";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { SplashScreen } from "@/components/shared/SplashScreen";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { LeadAttributionCapture } from "@/components/shared/LeadAttributionCapture";
import { GoogleTranslateStability } from "@/components/shared/GoogleTranslateStability";

import "./globals.css";

// Bangla paragraphs.
const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Bangla headings (variable font: one file for every weight).
const anekBangla = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali"],
  // Width axis: headings use a slightly wider cut so conjuncts (প্র, শ্ন, ক্ষ) stay open.
  axes: ["wdth"],
  display: "swap",
});

// Admin panel only (its stylesheet asks for it); not preloaded, so public pages never download it.
const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

// English text and navigation.
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sageacademybd.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SAGE Academy",
    template: "%s | SAGE Academy",
  },
  description: "Academic and admission care in Banasree.",
  applicationName: "SAGE Academy",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "SAGE Academy",
    locale: "bn_BD",
    type: "website",
    url: siteUrl,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "SAGE Academy" }],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "SAGE Academy",
  url: siteUrl,
  logo: `${siteUrl}/icon-512.png`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn-BD"
      className={`${plusJakarta.variable} ${hindSiliguri.variable} ${anekBangla.variable} ${notoSansBengali.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        <script
          type="application/ld+json"
          // Tells Google which image is the academy's logo for search results.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <LeadAttributionCapture />
        <GoogleTranslateStability />
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
