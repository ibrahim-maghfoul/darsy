import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GooFilter } from "@/components/ui/BlobButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DarsySchool",
  description: "Modern E-learning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('dark');`,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="darsyschool-theme-dark-only-final"
        >
          <AuthProvider>
            <NotificationProvider>
              <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <main>
                  {children}
                </main>
                <Footer />
                <GooFilter />
              </div>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
