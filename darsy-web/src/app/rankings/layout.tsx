import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة الشرف — أفضل التلاميذ | Tableau d'Honneur",
  description:
    "اكتشف أفضل المساهمين والمتعلمين على منصة درسي. تصنيفات أسبوعية وشهرية لأكثر التلاميذ نشاطاً في المغرب. Découvrez les meilleurs contributeurs et apprenants sur Darsy.",
  openGraph: {
    title: "لوحة الشرف | Darsy",
    description:
      "أفضل المساهمين والمتعلمين على منصة درسي — تصنيفات أسبوعية وشهرية.",
    type: "website",
    url: "/rankings",
  },
  twitter: {
    card: "summary_large_image",
    title: "لوحة الشرف | Darsy",
    description: "أفضل المساهمين والمتعلمين على منصة درسي.",
  },
  alternates: { canonical: "/rankings" },
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
