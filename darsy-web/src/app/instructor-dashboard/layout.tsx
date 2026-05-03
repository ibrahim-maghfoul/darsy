import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة تحكم المدرّس | Tableau de Bord Instructeur",
  description: "أدر دوراتك وتحليلاتك كمدرّس على منصة درسي.",
  robots: { index: false, follow: false },
};

export default function InstructorDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
