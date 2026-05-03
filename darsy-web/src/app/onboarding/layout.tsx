import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إعداد الحساب | Configuration du Compte",
  description: "أكمل إعداد حسابك على منصة درسي.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
