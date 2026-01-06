import { MetadataRoute } from "next";
import { getDocsGroups } from "@/app/docs/registry";
import { getBlogGroups } from "./blog/registry";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.audexis.app";
  const groups = await getDocsGroups();
  const blogGroups = await getBlogGroups();

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
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog/releases`,
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
  const blogPages: MetadataRoute.Sitemap = blogGroups.flatMap((group) =>
    group.items
      .filter((item) => item.href !== "/docs")
      .map((item) => ({
        url: `${baseUrl}${item.href}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
  );
  return [...staticPages, ...docPages, ...blogPages];
}
