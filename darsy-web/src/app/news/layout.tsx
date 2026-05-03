import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أخبار التعليم المغربي | Actualités Scolaires Maroc",
  description:
    "آخر أخبار التعليم والتوجيه في المغرب — باكالوريا، بريفي، مستجدات وزارة التربية الوطنية. Dernières actualités de l'éducation marocaine — BAC, Brevet, orientation.",
  openGraph: {
    title: "أخبار التعليم المغربي | Darsy",
    description:
      "آخر أخبار التعليم والتوجيه في المغرب — باكالوريا، بريفي، مستجدات وزارة التربية الوطنية.",
    type: "website",
    url: "/news",
  },
  twitter: {
    card: "summary_large_image",
    title: "أخبار التعليم المغربي | Darsy",
    description: "آخر أخبار التعليم والتوجيه في المغرب.",
  },
  alternates: { canonical: "/news" },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
