import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://darsy.ma";
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function fetchIds<T>(
  url: string,
  extract: (items: T[]) => string[]
): Promise<string[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data: T[] = await res.json();
    return extract(data);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/explore`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/rankings`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/contributions`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/teacher`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/instructors`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/grades-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/download`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/apply-instructor`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/apply-teacher`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/calendar`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  const [newsIds, lessonIds] = await Promise.all([
    fetchIds<{ _id: string }>(
      `${BACKEND}/api/news?limit=200`,
      (items) => {
        const arr = (items as unknown as { news?: { _id: string }[]; _id?: string }) as any;
        const list: { _id: string }[] = arr.news || items;
        return list.map((n) => String(n._id));
      }
    ),
    fetchIds<{ _id: string }>(
      `${BACKEND}/api/data/lessons/all`,
      (items) => items.map((l) => String(l._id))
    ),
  ]);

  const newsRoutes: MetadataRoute.Sitemap = newsIds.map((id) => ({
    url: `${SITE_URL}/news/${id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const lessonRoutes: MetadataRoute.Sitemap = lessonIds.map((id) => ({
    url: `${SITE_URL}/lesson/${id}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...newsRoutes, ...lessonRoutes];
}
