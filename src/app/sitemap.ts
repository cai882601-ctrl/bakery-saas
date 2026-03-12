import type { MetadataRoute } from "next";
import { getSiteUrl, shouldAllowIndexing } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  if (!shouldAllowIndexing(siteUrl)) {
    return [];
  }

  return [
    {
      url: new URL("/", siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/pricing", siteUrl).toString(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
