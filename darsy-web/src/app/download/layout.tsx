import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تحميل الموارد الدراسية | Télécharger les Ressources",
  description:
    "حمّل الدروس والتمارين والامتحانات بصيغة PDF للدراسة بدون إنترنت. Téléchargez cours, exercices et examens en PDF pour étudier hors ligne.",
  openGraph: {
    title: "تحميل الموارد الدراسية | Darsy",
    description:
      "حمّل الدروس والتمارين والامتحانات بصيغة PDF للدراسة بدون إنترنت.",
    type: "website",
    url: "/download",
  },
  twitter: {
    card: "summary_large_image",
    title: "تحميل الموارد الدراسية | Darsy",
    description: "حمّل الدروس والتمارين والامتحانات بصيغة PDF.",
  },
  alternates: { canonical: "/download" },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
