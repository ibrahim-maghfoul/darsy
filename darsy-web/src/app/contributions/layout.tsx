import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ساهم في المحتوى التعليمي | Contribuez au Contenu",
  description:
    "شارك دروسك وملخصاتك مع آلاف التلاميذ المغاربة. شارك في بناء مجتمع تعليمي قوي على منصة درسي. Partagez vos cours et résumés avec des milliers d'élèves marocains.",
  openGraph: {
    title: "ساهم في المحتوى التعليمي | Darsy",
    description:
      "شارك دروسك وملخصاتك مع آلاف التلاميذ المغاربة على منصة درسي.",
    type: "website",
    url: "/contributions",
  },
  twitter: {
    card: "summary_large_image",
    title: "ساهم في المحتوى التعليمي | Darsy",
    description: "شارك دروسك وملخصاتك مع التلاميذ المغاربة.",
  },
  alternates: { canonical: "/contributions" },
};

export default function ContributionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
