import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "استكشف المواد الدراسية | Explorer les Matières",
  description:
    "تصفح المناهج الدراسية المغربية — اختر مدرستك، مستواك، مسارك والمادة التي تريد تعلمها. Parcourez le programme scolaire marocain par école, niveau, filière et matière.",
  openGraph: {
    title: "استكشف المواد الدراسية | Darsy",
    description:
      "تصفح المناهج الدراسية المغربية — اختر مدرستك، مستواك ومادتك.",
    type: "website",
    url: "/explore",
  },
  twitter: {
    card: "summary_large_image",
    title: "استكشف المواد الدراسية | Darsy",
    description: "تصفح المناهج الدراسية المغربية.",
  },
  alternates: { canonical: "/explore" },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
