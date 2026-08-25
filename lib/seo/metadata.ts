import type { Metadata } from "next";
import {
  CANONICAL_DOMAIN,
  SITE_NAME,
  DEFAULT_LOCALE,
} from "./constants";

export interface MetadataConfig {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article" | "product";
  ogImageUrl?: string;
  noIndex?: boolean;
}

export function buildMetadata(config: MetadataConfig): Metadata {
  const canonical = buildCanonicalUrl(config.path);
  const ogImage = config.ogImageUrl ?? buildDefaultOgImageUrl(config.title);
  const ogType = config.ogType === "product" ? "website" : (config.ogType ?? "website");

  return {
    metadataBase: new URL(CANONICAL_DOMAIN),
    title: config.title,
    description: config.description,
    alternates: { canonical },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: DEFAULT_LOCALE,
      type: ogType,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [ogImage],
    },
    ...(config.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function buildCanonicalUrl(path: string): string {
  const normalized = path.toLowerCase().replace(/\/+$/, "");
  const cleanPath = normalized === "" ? "/" : normalized;
  return `${CANONICAL_DOMAIN}${cleanPath}`;
}

export function buildDefaultOgImageUrl(title: string): string {
  return `${CANONICAL_DOMAIN}/og/default?title=${encodeURIComponent(title)}`;
}
