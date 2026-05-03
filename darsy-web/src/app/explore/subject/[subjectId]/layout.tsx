import type { Metadata } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}): Promise<Metadata> {
  const { subjectId } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/data/lessons/${subjectId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const lessons: { title: string }[] = await res.json();
    const count = lessons.length;
    return {
      title: `${count} درس — استكشف المادة`,
      description: `اكتشف ${count} درساً بالفيديوهات والتمارين والامتحانات على منصة درسي. Découvrez ${count} leçons avec vidéos, exercices et examens sur Darsy.`,
      openGraph: {
        title: `استكشف المادة (${count} درس) | Darsy`,
        description: `${count} درساً بالفيديوهات والتمارين والامتحانات على منصة درسي.`,
        type: "website",
        url: `/explore/subject/${subjectId}`,
      },
      alternates: { canonical: `/explore/subject/${subjectId}` },
    };
  } catch {
    return {
      title: "المادة الدراسية",
      description: "اكتشف دروس وتمارين المادة على منصة درسي.",
    };
  }
}

export default function SubjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
