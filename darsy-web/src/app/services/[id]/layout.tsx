import type { Metadata } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/data/school-services`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const services: { _id: string; title: string; description: string }[] = await res.json();
    const service = services.find((s) => s._id === id);
    if (!service) throw new Error("Not found");
    return {
      title: service.title,
      description: service.description
        ? service.description.slice(0, 160)
        : `اكتشف خدمة "${service.title}" على منصة درسي.`,
      openGraph: {
        title: `${service.title} | Darsy`,
        description: service.description || `خدمة "${service.title}" على منصة درسي.`,
        type: "website",
        url: `/services/${id}`,
      },
      alternates: { canonical: `/services/${id}` },
    };
  } catch {
    return {
      title: "خدمة مدرسية",
      description: "اكتشف الخدمات المدرسية على منصة درسي.",
    };
  }
}

export default function ServiceDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
