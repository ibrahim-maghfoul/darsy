import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "من نحن | À Propos de Darsy",
  description:
    "تعرف على منصة درسي — مهمتنا هي تسهيل التعلم للتلاميذ المغاربة في كل مكان. Découvrez Darsy — notre mission est de rendre l'éducation accessible à tous les élèves marocains.",
  openGraph: {
    title: "من نحن | Darsy",
    description:
      "تعرف على منصة درسي — مهمتنا تسهيل التعلم للتلاميذ المغاربة.",
    type: "website",
    url: "/about",
  },
  twitter: {
    card: "summary",
    title: "من نحن | Darsy",
    description: "تعرف على منصة درسي ومهمتنا التعليمية.",
  },
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
