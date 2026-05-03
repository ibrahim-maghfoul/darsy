import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import "../styles/pickers.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { SnackbarProvider } from "@/contexts/SnackbarContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import CookieBanner from "@/components/CookieBanner";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { PageTransition } from "@/components/PageTransition";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap", // Prevent FOIT — show fallback font immediately
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://darsy.ma"),
  title: {
    default: "Darsy — منصة التعلم المغربية",
    template: "%s | Darsy",
  },
  description:
    "درسي — منصة تعليمية مغربية للتلاميذ. دروس، تمارين وامتحانات للباكالوريا والبريفي. Plateforme éducative marocaine pour le BAC, le Brevet et le lycée.",
  keywords: [
    "darsy", "درسي", "تعلم", "المغرب", "باكالوريا", "بريفي",
    "bac maroc", "cours maroc", "éducation maroc", "brevet maroc",
    "lycée maroc", "darija school", "تعليم مغربي", "دروس مغربية",
  ],
  authors: [{ name: "Darsy" }],
  creator: "Darsy",
  openGraph: {
    type: "website",
    locale: "ar_MA",
    alternateLocale: ["fr_MA", "en_US"],
    url: "/",
    siteName: "Darsy",
    title: "Darsy — منصة التعلم المغربية",
    description:
      "درسي — منصة تعليمية مغربية للتلاميذ. دروس، تمارين وامتحانات للباكالوريا والبريفي.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Darsy — منصة التعلم المغربية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Darsy — منصة التعلم المغربية",
    description:
      "درسي — منصة تعليمية مغربية للتلاميذ. دروس، تمارين وامتحانات للباكالوريا والبريفي.",
    images: ["/og-image.png"],
    creator: "@DarsyMa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        {/* Preconnect + preload Material Icons to reduce render-blocking */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=android" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=ios" />
      </head>
      <body className={`${cairo.variable} font-cairo antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-client-id'}>
            <AuthProvider>
              <SnackbarProvider>
                <Navbar />
                <main><PageTransition>{children}</PageTransition></main>
                <LanguageSwitcher />
                <Footer />
                <CookieBanner />
              </SnackbarProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
