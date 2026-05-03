import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://darsy.ma";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/profile",
          "/profile/",
          "/settings",
          "/onboarding",
          "/report",
          "/teacher/dashboard",
          "/instructor-dashboard",
          "/favorites/",
          "/design-test",
          "/design-lab",
          "/teacher/join/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
