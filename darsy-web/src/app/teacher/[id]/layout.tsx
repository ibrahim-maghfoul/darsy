import type { Metadata } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/teacher/profiles/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    const teacher = data.teacher || data;
    const name = teacher.displayName || teacher.fullName || "الأستاذ";
    const specialization = teacher.specialization || "";
    return {
      title: `${name} — أستاذ درسي`,
      description: `${name}${specialization ? ` — ${specialization}` : ""} على منصة درسي. درسي أستاذ معتمد للباكالوريا والبريفي في المغرب.`,
      openGraph: {
        title: `${name} | Darsy`,
        description: `${name}${specialization ? ` — ${specialization}` : ""} — أستاذ معتمد على منصة درسي.`,
        type: "profile",
        url: `/teacher/${id}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} | Darsy`,
        description: `${name} — أستاذ معتمد على منصة درسي.`,
      },
      alternates: { canonical: `/teacher/${id}` },
    };
  } catch {
    return {
      title: "أستاذ درسي",
      description: "اكتشف أساتذة درسي المعتمدين للباكالوريا والبريفي.",
    };
  }
}

export default function TeacherProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
