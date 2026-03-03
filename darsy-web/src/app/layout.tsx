import type { Metadata } from "next";
import { Roboto, Cairo } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { SnackbarProvider } from "@/contexts/SnackbarContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "900"],
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
      <body
        className={`${cairo.variable} font-cairo antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <SnackbarProvider>
              <Navbar />
              <main>{children}</main>
              <LanguageSwitcher />
              <Footer />
            </SnackbarProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
