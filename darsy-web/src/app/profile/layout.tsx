import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ملفي الشخصي | Mon Profil",
  description: "اعرض إحصائياتك الدراسية، دروسك المفضلة وإعداداتك على منصة درسي.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
