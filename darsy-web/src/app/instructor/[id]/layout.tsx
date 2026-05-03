import type { Metadata } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/instructor/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    const instructor = data.instructor || data;
    const name = instructor.displayName || instructor.name || "المدرّس";
    return {
      title: `${name} — مدرّس درسي`,
      description: `دورات ${name} على منصة درسي — فيديوهات ودروس PDF للباكالوريا والبريفي. Cours de ${name} sur Darsy.`,
      openGraph: {
        title: `${name} | Darsy`,
        description: `دورات ${name} — فيديوهات ودروس PDF على منصة درسي.`,
        type: "profile",
        url: `/instructor/${id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} | Darsy`,
        description: `دورات ${name} على منصة درسي.`,
      },
      alternates: { canonical: `/instructor/${id}` },
    };
  } catch {
    return {
      title: "مدرّس درسي",
      description: "اكتشف دورات مدرّسي درسي للباكالوريا والبريفي.",
    };
  }
}

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
