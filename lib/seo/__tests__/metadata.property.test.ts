import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { buildCanonicalUrl, buildMetadata } from "../metadata";
import { CANONICAL_DOMAIN, SITE_NAME, DEFAULT_LOCALE } from "../constants";

/**
 * Arbitrary for valid URL path segments: letters, numbers, dashes, forward slashes.
 * Generates strings like "/mercancia/hydrogen", "/wiki/naves/aurora-mr", etc.
 */
const pathCharArb = fc.constantFrom(
  ..."abcdefghijklmnopqrstuvwxyz0123456789-/".split("")
);

/**
 * Arbitrary for paths that start with "/" to simulate real route paths.
 */
const validPathArb = fc
  .array(pathCharArb, { minLength: 1, maxLength: 40 })
  .map((chars) => `/${chars.join("").replace(/^\/+/, "")}`);

/**
 * Arbitrary for MetadataConfig objects with valid inputs.
 */
const metadataConfigArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 80 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  path: validPathArb,
  ogType: fc.option(
    fc.constantFrom("website" as const, "article" as const, "product" as const),
    { nil: undefined }
  ),
  ogImageUrl: fc.option(fc.webUrl(), { nil: undefined }),
  noIndex: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Property 5: Canonical URL correctness
 *
 * For any valid path string, buildCanonicalUrl(path) SHALL produce a URL that
 * (a) starts with "https://scg-app.com", (b) is entirely lowercase,
 * (c) has no trailing slash unless root "/", (d) includes the normalized path.
 *
 * **Validates: Requirements 3.3, 5.1, 5.2, 5.3, 5.4**
 */
describe("Property 5: Canonical URL correctness", () => {
  it("always starts with CANONICAL_DOMAIN", () => {
    fc.assert(
      fc.property(validPathArb, (path) => {
        const url = buildCanonicalUrl(path);
        expect(url.startsWith(CANONICAL_DOMAIN)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("is entirely lowercase", () => {
    const mixedCasePathArb = fc
      .array(
        fc.constantFrom(
          ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/".split(
            ""
          )
        ),
        { minLength: 1, maxLength: 40 }
      )
      .map((chars) => `/${chars.join("").replace(/^\/+/, "")}`);

    fc.assert(
      fc.property(mixedCasePathArb, (path) => {
        const url = buildCanonicalUrl(path);
        expect(url).toBe(url.toLowerCase());
      }),
      { numRuns: 100 }
    );
  });

  it("has no trailing slash unless root", () => {
    fc.assert(
      fc.property(validPathArb, (path) => {
        const url = buildCanonicalUrl(path);
        const pathPart = url.slice(CANONICAL_DOMAIN.length);

        if (pathPart === "/") {
          // Root is allowed to be just "/"
          expect(pathPart).toBe("/");
        } else {
          expect(pathPart.endsWith("/")).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("includes the normalized (lowercased, no trailing slash) path", () => {
    const mixedCasePathArb = fc
      .array(
        fc.constantFrom(
          ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/".split(
            ""
          )
        ),
        { minLength: 1, maxLength: 40 }
      )
      .map((chars) => `/${chars.join("").replace(/^\/+/, "")}`);

    fc.assert(
      fc.property(mixedCasePathArb, (path) => {
        const url = buildCanonicalUrl(path);
        const expectedPath = path.toLowerCase().replace(/\/+$/, "") || "/";
        expect(url).toBe(`${CANONICAL_DOMAIN}${expectedPath}`);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Metadata completeness
 *
 * For any valid MetadataConfig, buildMetadata SHALL return a Metadata object with
 * openGraph (title, description, url, siteName="SCG - Guía de Star Citizen",
 * locale="es_ES", type, images), and twitter (card="summary_large_image", title,
 * description, images).
 *
 * **Validates: Requirements 3.4, 3.5**
 */
describe("Property 6: Metadata completeness", () => {
  it("returns openGraph with all required fields", () => {
    fc.assert(
      fc.property(metadataConfigArb, (config) => {
        const metadata = buildMetadata(config);

        expect(metadata.openGraph).toBeDefined();
        const og = metadata.openGraph as Record<string, unknown>;

        expect(og.title).toBe(config.title);
        expect(og.description).toBe(config.description);
        expect(og.url).toBeDefined();
        expect(og.siteName).toBe(SITE_NAME);
        expect(og.locale).toBe(DEFAULT_LOCALE);
        expect(og.type).toBeDefined();
        expect(og.images).toBeDefined();
        expect(Array.isArray(og.images)).toBe(true);
        expect((og.images as unknown[]).length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it("returns twitter with card=summary_large_image and all required fields", () => {
    fc.assert(
      fc.property(metadataConfigArb, (config) => {
        const metadata = buildMetadata(config);

        expect(metadata.twitter).toBeDefined();
        const twitter = metadata.twitter as Record<string, unknown>;

        expect(twitter.card).toBe("summary_large_image");
        expect(twitter.title).toBe(config.title);
        expect(twitter.description).toBe(config.description);
        expect(twitter.images).toBeDefined();
        expect(Array.isArray(twitter.images)).toBe(true);
        expect((twitter.images as unknown[]).length).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: OG image propagation
 *
 * If ogImageUrl is provided, both openGraph.images and twitter.images SHALL contain
 * that URL; if absent, both SHALL contain a URL with "/og/default?title=".
 *
 * **Validates: Requirements 3.6, 3.7**
 */
describe("Property 7: OG image propagation", () => {
  it("uses provided ogImageUrl in both openGraph and twitter images", () => {
    const configWithImageArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 80 }),
      description: fc.string({ minLength: 1, maxLength: 200 }),
      path: validPathArb,
      ogType: fc.option(
        fc.constantFrom(
          "website" as const,
          "article" as const,
          "product" as const
        ),
        { nil: undefined }
      ),
      ogImageUrl: fc.webUrl(),
      noIndex: fc.option(fc.boolean(), { nil: undefined }),
    });

    fc.assert(
      fc.property(configWithImageArb, (config) => {
        const metadata = buildMetadata(config);

        const og = metadata.openGraph as Record<string, unknown>;
        const ogImages = og.images as Array<Record<string, unknown>>;
        const ogImageUrl = ogImages[0].url as string;
        expect(ogImageUrl).toBe(config.ogImageUrl);

        const twitter = metadata.twitter as Record<string, unknown>;
        const twitterImages = twitter.images as string[];
        expect(twitterImages[0]).toBe(config.ogImageUrl);
      }),
      { numRuns: 100 }
    );
  });

  it("generates default OG URL with /og/default?title= when ogImageUrl is absent", () => {
    const configWithoutImageArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 80 }),
      description: fc.string({ minLength: 1, maxLength: 200 }),
      path: validPathArb,
      ogType: fc.option(
        fc.constantFrom(
          "website" as const,
          "article" as const,
          "product" as const
        ),
        { nil: undefined }
      ),
      noIndex: fc.option(fc.boolean(), { nil: undefined }),
    });

    fc.assert(
      fc.property(configWithoutImageArb, (config) => {
        const metadata = buildMetadata(config);

        const expectedDefault = `${CANONICAL_DOMAIN}/og/default?title=${encodeURIComponent(config.title)}`;

        const og = metadata.openGraph as Record<string, unknown>;
        const ogImages = og.images as Array<Record<string, unknown>>;
        const ogImageUrl = ogImages[0].url as string;
        expect(ogImageUrl).toBe(expectedDefault);

        const twitter = metadata.twitter as Record<string, unknown>;
        const twitterImages = twitter.images as string[];
        expect(twitterImages[0]).toBe(expectedDefault);
      }),
      { numRuns: 100 }
    );
  });
});
