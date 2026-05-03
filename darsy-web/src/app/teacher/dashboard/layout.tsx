import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة تحكم الأستاذ | Tableau de Bord Professeur",
  description: "أدر قاعاتك الدراسية وملفك الشخصي كأستاذ على منصة درسي.",
  robots: { index: false, follow: false },
};

export default function TeacherDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
