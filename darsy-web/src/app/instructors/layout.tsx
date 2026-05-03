import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "المدرّسون | Instructeurs Darsy",
  description:
    "اكتشف مدرّسي درسي — دورات تعليمية بالفيديو والـPDF في مختلف المواد للباكالوريا والبريفي. Découvrez les instructeurs Darsy — cours vidéo et PDF pour le BAC et le Brevet.",
  openGraph: {
    title: "المدرّسون | Darsy",
    description:
      "دورات تعليمية بالفيديو والـPDF في مختلف المواد للباكالوريا والبريفي.",
    type: "website",
    url: "/instructors",
  },
  twitter: {
    card: "summary_large_image",
    title: "المدرّسون | Darsy",
    description: "دورات تعليمية بالفيديو والـPDF للباكالوريا والبريفي.",
  },
  alternates: { canonical: "/instructors" },
};

export default function InstructorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
