import type { Metadata } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/news/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Not found");
    const article = await res.json();
    const title = article.title || "خبر تعليمي";
    const description = article.description
      ? article.description.slice(0, 160)
      : "اقرأ آخر أخبار التعليم المغربي على منصة درسي.";
    const image = article.image
      ? article.image.startsWith("http")
        ? article.image
        : `${BACKEND}/data/resources/${article.image}`
      : "/og-image.png";
    return {
      title,
      description,
      openGraph: {
        title: `${title} | Darsy`,
        description,
        type: "article",
        url: `/news/${id}`,
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        ...(article.createdAt && { publishedTime: article.createdAt }),
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Darsy`,
        description,
        images: [image],
      },
      alternates: { canonical: `/news/${id}` },
    };
  } catch {
    return {
      title: "أخبار التعليم",
      description: "اقرأ آخر أخبار التعليم المغربي على منصة درسي.",
    };
  }
}

export default function NewsArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
