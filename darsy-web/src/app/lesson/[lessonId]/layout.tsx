import type { Metadata } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/data/lesson/${lessonId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const lesson = await res.json();
    const title = lesson.title || "درس";
    return {
      title,
      description: `تعلم درس "${title}" — دروس، تمارين وامتحانات على منصة درسي. Apprenez "${title}" avec cours, exercices et examens sur Darsy.`,
      openGraph: {
        title: `${title} | Darsy`,
        description: `دروس وتمارين لـ "${title}" على منصة درسي.`,
        type: "article",
        url: `/lesson/${lessonId}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Darsy`,
        description: `دروس وتمارين لـ "${title}" على منصة درسي.`,
      },
      alternates: { canonical: `/lesson/${lessonId}` },
    };
  } catch {
    return {
      title: "الدرس",
      description: "اكتشف دروس وتمارين منصة درسي التعليمية المغربية.",
    };
  }
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
