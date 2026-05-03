import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإعدادات | Paramètres",
  description: "إدارة إعدادات حسابك على منصة درسي.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
