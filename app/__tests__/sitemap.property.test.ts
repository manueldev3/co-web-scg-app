import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import type { ApiCommodity } from "@/app/mercancia/types";
import type { ApiVehicle } from "@/app/wiki/types";
import { CANONICAL_DOMAIN } from "@/lib/seo/constants";

// Mock the UEX API modules
vi.mock("@/app/mercancia/uex-api", () => ({
  fetchCommodities: vi.fn(),
}));

vi.mock("@/app/wiki/uex-api", () => ({
  fetchVehicles: vi.fn(),
}));

// Lazy imports — resolved after mocks are set up
const getMocks = async () => {
  const { fetchCommodities } = await import("@/app/mercancia/uex-api");
  const { fetchVehicles } = await import("@/app/wiki/uex-api");
  return {
    fetchCommodities: fetchCommodities as ReturnType<typeof vi.fn>,
    fetchVehicles: fetchVehicles as ReturnType<typeof vi.fn>,
  };
};

const getSitemap = async () => {
  const mod = await import("@/app/sitemap");
  return mod.default;
};

// --- Arbitraries ---

/** Generates a valid slug: lowercase alphanumeric with dashes, non-empty. */
const slugArb = fc
  .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789-".split("")), {
    minLength: 1,
    maxLength: 30,
  })
  .map((chars) => chars.join("").replace(/^-+|-+$/g, ""))
  .filter((s) => s.length > 0);

/** Generates a minimal ApiCommodity with a valid slug. */
const commodityArb: fc.Arbitrary<ApiCommodity> = fc.record({
  id: fc.nat(),
  id_parent: fc.constant(null),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  code: fc.string({ minLength: 1, maxLength: 10 }),
  slug: slugArb,
  kind: fc.constant(null),
  weight_scu: fc.constant(null),
  price_buy: fc.nat(),
  price_sell: fc.nat(),
  is_available: fc.constant(1),
  is_available_live: fc.constant(1),
  is_visible: fc.constant(1),
});

/** Generates a vehicle name suitable for slug conversion (alphanumeric + spaces). */
const vehicleNameArb = fc
  .array(
    fc.constantFrom(
      ..."abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-".split(
        ""
      )
    ),
    { minLength: 1, maxLength: 30 }
  )
  .map((chars) => chars.join("").trim())
  .filter((s) => s.length > 0 && /[a-z0-9]/i.test(s));

/** Generates a minimal ApiVehicle that IS a spaceship. */
const spaceshipArb: fc.Arbitrary<ApiVehicle> = fc.record({
  id: fc.nat(),
  name: vehicleNameArb,
  name_full: fc.option(vehicleNameArb, { nil: null }),
  scu: fc.constant(null),
  crew: fc.constant(null),
  is_spaceship: fc.constant(1 as number),
  is_cargo: fc.constant(0 as number),
  is_ground_vehicle: fc.constant(0 as number),
  container_sizes: fc.constant(null),
  pad_type: fc.constant(null),
  company_name: fc.constant(null),
});

/** Generates a minimal ApiVehicle that is NOT a spaceship. */
const nonSpaceshipArb: fc.Arbitrary<ApiVehicle> = fc.record({
  id: fc.nat(),
  name: vehicleNameArb,
  name_full: fc.option(vehicleNameArb, { nil: null }),
  scu: fc.constant(null),
  crew: fc.constant(null),
  is_spaceship: fc.constant(0 as number),
  is_cargo: fc.constant(0 as number),
  is_ground_vehicle: fc.constant(1 as number),
  container_sizes: fc.constant(null),
  pad_type: fc.constant(null),
  company_name: fc.constant(null),
});

/** Helper: replicate the toSlug logic from sitemap.ts for verification. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Tests ---

beforeEach(() => {
  vi.resetModules();
});

/**
 * Property 1: Sitemap commodity entries match API data
 *
 * For any list of commodities returned by the API, the sitemap output SHALL
 * contain exactly one entry per commodity, and each entry's URL SHALL match
 * the pattern `https://scg-app.com/mercancia/{slug}`.
 *
 * **Validates: Requirements 1.3**
 */
describe("Property 1: Sitemap commodity entries match API data", () => {
  it("contains one entry per commodity with correct URL pattern", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(commodityArb, { minLength: 0, maxLength: 20 }),
        async (commodities) => {
          vi.resetModules();
          const { fetchCommodities, fetchVehicles } = await getMocks();
          fetchCommodities.mockResolvedValue(commodities);
          fetchVehicles.mockResolvedValue([]);

          const sitemap = await getSitemap();
          const entries = await sitemap();

          const commodityEntries = entries.filter((e) =>
            /\/mercancia\/[^/]+$/.test(e.url)
          );

          // Exactly one entry per commodity
          expect(commodityEntries.length).toBe(commodities.length);

          // Each commodity has a matching entry
          for (const c of commodities) {
            const expectedUrl = `${CANONICAL_DOMAIN}/mercancia/${c.slug}`;
            const found = commodityEntries.find((e) => e.url === expectedUrl);
            expect(found).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Sitemap vehicle entries match API data
 *
 * For any list of vehicles with is_spaceship===1, the sitemap output SHALL
 * contain exactly one entry per spaceship with URL `/wiki/naves/{slug}`.
 *
 * **Validates: Requirements 1.4**
 */
describe("Property 2: Sitemap vehicle entries match API data", () => {
  it("contains one entry per spaceship with correct URL pattern", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(spaceshipArb, nonSpaceshipArb),
          { minLength: 0, maxLength: 20 }
        ),
        async (vehicles) => {
          vi.resetModules();
          const { fetchCommodities, fetchVehicles } = await getMocks();
          fetchCommodities.mockResolvedValue([]);
          fetchVehicles.mockResolvedValue(vehicles);

          const sitemap = await getSitemap();
          const entries = await sitemap();

          const vehicleEntries = entries.filter((e) =>
            /\/wiki\/naves\/[^/]+$/.test(e.url)
          );

          const spaceships = vehicles.filter((v) => v.is_spaceship === 1);

          // Exactly one entry per spaceship
          expect(vehicleEntries.length).toBe(spaceships.length);

          // Each spaceship has a matching entry
          for (const v of spaceships) {
            const slug = toSlug(v.name_full ?? v.name);
            const expectedUrl = `${CANONICAL_DOMAIN}/wiki/naves/${slug}`;
            const found = vehicleEntries.find((e) => e.url === expectedUrl);
            expect(found).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Sitemap URL prefix invariant
 *
 * For any entry in the sitemap output, the URL SHALL start with
 * `https://scg-app.com`.
 *
 * **Validates: Requirements 1.5**
 */
describe("Property 3: Sitemap URL prefix invariant", () => {
  it("all URLs start with CANONICAL_DOMAIN", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(commodityArb, { minLength: 0, maxLength: 10 }),
        fc.array(
          fc.oneof(spaceshipArb, nonSpaceshipArb),
          { minLength: 0, maxLength: 10 }
        ),
        async (commodities, vehicles) => {
          vi.resetModules();
          const { fetchCommodities, fetchVehicles } = await getMocks();
          fetchCommodities.mockResolvedValue(commodities);
          fetchVehicles.mockResolvedValue(vehicles);

          const sitemap = await getSitemap();
          const entries = await sitemap();

          for (const entry of entries) {
            expect(entry.url.startsWith(CANONICAL_DOMAIN)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Sitemap changeFrequency assignment
 *
 * Dynamic entries (commodity/vehicle) have changeFrequency "daily",
 * static entries have changeFrequency "weekly".
 *
 * **Validates: Requirements 1.7**
 */
describe("Property 4: Sitemap changeFrequency assignment", () => {
  it("dynamic entries have 'daily', static entries have 'weekly'", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(commodityArb, { minLength: 1, maxLength: 10 }),
        fc.array(spaceshipArb, { minLength: 1, maxLength: 10 }),
        async (commodities, spaceships) => {
          vi.resetModules();
          const { fetchCommodities, fetchVehicles } = await getMocks();
          fetchCommodities.mockResolvedValue(commodities);
          fetchVehicles.mockResolvedValue(spaceships);

          const sitemap = await getSitemap();
          const entries = await sitemap();

          for (const entry of entries) {
            const isDynamic =
              /\/mercancia\/[^/]+$/.test(entry.url) ||
              /\/wiki\/naves\/[^/]+$/.test(entry.url);

            if (isDynamic) {
              expect(entry.changeFrequency).toBe("daily");
            } else {
              expect(entry.changeFrequency).toBe("weekly");
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
