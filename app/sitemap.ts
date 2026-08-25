import type { MetadataRoute } from "next";
import { CANONICAL_DOMAIN } from "@/lib/seo/constants";
import { fetchCommodities } from "@/app/mercancia/uex-api";
import { fetchVehicles } from "@/app/wiki/uex-api";

/**
 * Dynamic XML sitemap.
 *
 * Includes static pages with appropriate priorities plus dynamic entries
 * fetched from the UEX API (commodities and spaceships). Uses
 * Promise.allSettled so that a single API failure never breaks the entire
 * sitemap — static pages are always returned.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${CANONICAL_DOMAIN}/`, changeFrequency: "weekly", priority: 1.0 },
    {
      url: `${CANONICAL_DOMAIN}/mercancia`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${CANONICAL_DOMAIN}/mejor-ruta`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: `${CANONICAL_DOMAIN}/wiki`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${CANONICAL_DOMAIN}/organizador-de-carga`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${CANONICAL_DOMAIN}/guias`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${CANONICAL_DOMAIN}/naves`, changeFrequency: "weekly", priority: 0.7 },
    {
      url: `${CANONICAL_DOMAIN}/sobre-nosotros`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${CANONICAL_DOMAIN}/contacto`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // Fetch dynamic data; on failure, APIs return [] (no throw)
  const [commodities, vehicles] = await Promise.allSettled([
    fetchCommodities(),
    fetchVehicles(),
  ]);

  const commodityEntries: MetadataRoute.Sitemap =
    commodities.status === "fulfilled"
      ? commodities.value.map((c) => ({
          url: `${CANONICAL_DOMAIN}/mercancia/${c.slug}`,
          changeFrequency: "daily" as const,
          priority: 0.7,
        }))
      : [];

  const vehicleEntries: MetadataRoute.Sitemap =
    vehicles.status === "fulfilled"
      ? vehicles.value
          .filter((v) => v.is_spaceship === 1)
          .map((v) => ({
            url: `${CANONICAL_DOMAIN}/wiki/naves/${toSlug(v.name_full ?? v.name)}`,
            changeFrequency: "daily" as const,
            priority: 0.7,
          }))
      : [];

  return [...staticPages, ...commodityEntries, ...vehicleEntries];
}

/** Convert a display name into a URL-safe slug. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
