import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "انضم كأستاذ | Devenir Professeur Darsy",
  description:
    "هل أنت أستاذ تريد الوصول إلى تلاميذ جدد؟ قدّم طلب التحقق من هويتك كأستاذ على منصة درسي. Êtes-vous professeur ? Soumettez votre demande de vérification sur Darsy.",
  openGraph: {
    title: "انضم كأستاذ | Darsy",
    description: "قدّم طلب التحقق من هويتك كأستاذ على منصة درسي.",
    type: "website",
    url: "/apply-teacher",
  },
  twitter: {
    card: "summary",
    title: "انضم كأستاذ | Darsy",
    description: "قدّم طلبك كأستاذ معتمد على منصة درسي.",
  },
  alternates: { canonical: "/apply-teacher" },
};

export default function ApplyTeacherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
