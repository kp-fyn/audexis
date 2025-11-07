import { MetadataRoute } from "next";
import { getDocsGroups } from "@/app/docs/registry";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.audexis.app";
  const groups = await getDocsGroups();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const docPages: MetadataRoute.Sitemap = groups.flatMap((group) =>
    group.items
      .filter((item) => item.href !== "/docs")
      .map((item) => ({
        url: `${baseUrl}${item.href}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
  );

  return [...staticPages, ...docPages];
}
