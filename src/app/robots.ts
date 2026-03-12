import type { MetadataRoute } from "next";
import { getSiteUrl, shouldAllowIndexing } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const allowIndexing = shouldAllowIndexing(siteUrl);

  return {
    rules: allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/dashboard",
            "/orders",
            "/customers",
            "/products",
            "/ingredients",
            "/calendar",
            "/settings",
            "/api/",
          ],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
