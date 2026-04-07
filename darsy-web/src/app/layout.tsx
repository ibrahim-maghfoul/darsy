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
  title: "Darsy — Learn Together",
  description: "Learn the skills that actually matter with Darsy mentors.",
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
      <body className={`${cairo.variable} font-cairo antialiased`}>
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
