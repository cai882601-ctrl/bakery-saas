const FALLBACK_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string): string {
  const withProtocol =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  return new URL(withProtocol).origin;
}

export function getSiteUrl(): URL {
  const explicitUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? undefined;

  if (explicitUrl) {
    return new URL(normalizeSiteUrl(explicitUrl));
  }

  if (process.env.VERCEL_URL) {
    return new URL(normalizeSiteUrl(process.env.VERCEL_URL));
  }

  return new URL(FALLBACK_SITE_URL);
}

export function shouldAllowIndexing(siteUrl: URL): boolean {
  if (siteUrl.hostname === "localhost" || siteUrl.hostname === "127.0.0.1") {
    return false;
  }

  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "production";
  }

  return true;
}
