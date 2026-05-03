import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "خدمات مدرسية | Services Scolaires Maroc",
  description:
    "اطلع على التقويمات المدرسية، فترات التسجيل والتوجيه في المدارس المغربية. Consultez les calendriers scolaires, périodes d'inscription et orientation des écoles marocaines.",
  openGraph: {
    title: "خدمات مدرسية | Darsy",
    description:
      "التقويمات المدرسية، فترات التسجيل والتوجيه في المدارس المغربية.",
    type: "website",
    url: "/services",
  },
  twitter: {
    card: "summary_large_image",
    title: "خدمات مدرسية | Darsy",
    description: "التقويمات المدرسية والتوجيه في المدارس المغربية.",
  },
  alternates: { canonical: "/services" },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
