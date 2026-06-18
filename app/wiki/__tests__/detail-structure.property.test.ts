import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  buildShipDetail,
  buildExternalLinks,
  buildGalleryImages,
  resolveShipName,
  displayValue,
} from "../utils";
import type { ApiVehicle, ApiTerminal } from "../types";

/**
 * Feature: wiki-detalle-completo, Property 7: Composición, orden y omisión de secciones del detalle
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.3, 2.4, 4.7, 4.8, 5.5, 6.7, 7.4, 7.5
 *
 * Para cualquier `ApiVehicle` y cualesquiera listas de precios de compra,
 * precios de alquiler y terminales, `buildShipDetail` produce un `WikiDetail`
 * que: (a) conserva `title = resolveShipName(v)` y
 * `subtitle = displayValue(company_name)`; (b) incluye siempre una sección
 * `fields` de Ficha_Tecnica; (c) incluye `gallery`, `prices` de compra,
 * `prices` de alquiler y/o `links` únicamente cuando su contenido no está
 * vacío; y (d) emite las secciones en el orden canónico fijo
 * (gallery, fields, prices-compra, prices-alquiler, links), siendo `kind` un
 * valor del conjunto cerrado de Tipo_Bloque.
 */

const KNOWN_KINDS = ["fields", "gallery", "prices", "links"];

const urlFieldArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.webUrl(),
);

const urlPhotosArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.array(fc.webUrl()).map((urls) => JSON.stringify(urls)),
  fc.constantFrom("not json", "{", "123"),
);

const flagArb = fc.constantFrom(0, 1);

const vehicleArb: fc.Arbitrary<ApiVehicle> = fc.record({
  // id constreñido para solapar con los id_vehicle de las filas de precio.
  id: fc.integer({ min: 1, max: 5 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  name_full: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  scu: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
  crew: fc.option(fc.string({ maxLength: 10 }), { nil: null }),
  is_spaceship: flagArb,
  is_cargo: flagArb,
  is_ground_vehicle: flagArb,
  container_sizes: fc.option(
    fc.array(fc.nat({ max: 64 }), { maxLength: 8 }).map((arr) => arr.join(",")),
    { nil: null },
  ),
  pad_type: fc.option(fc.string({ maxLength: 10 }), { nil: null }),
  company_name: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  url_photo: urlFieldArb,
  url_photos: urlPhotosArb,
  url_store: urlFieldArb,
  url_brochure: urlFieldArb,
  url_video: urlFieldArb,
  url_hotsite: urlFieldArb,
});

const purchaseArb = fc.record({
  id_vehicle: fc.integer({ min: 1, max: 5 }),
  id_terminal: fc.integer({ min: 1, max: 20 }),
  price_buy: fc.integer({ min: 0, max: 10_000_000 }),
  terminal_name: fc.option(fc.string({ maxLength: 10 }), { nil: null }),
});

const rentalArb = fc.record({
  id_vehicle: fc.integer({ min: 1, max: 5 }),
  id_terminal: fc.integer({ min: 1, max: 20 }),
  price_rent: fc.integer({ min: 0, max: 10_000_000 }),
  terminal_name: fc.option(fc.string({ maxLength: 10 }), { nil: null }),
});

const terminalArb: fc.Arbitrary<ApiTerminal> = fc.record({
  id: fc.integer({ min: 1, max: 20 }),
  name: fc.string({ minLength: 1, maxLength: 15 }),
});

describe("Feature: wiki-detalle-completo, Property 7: Composición, orden y omisión de secciones del detalle", () => {
  it("composes title/subtitle, always-present tech sheet, conditional sections and canonical order", () => {
    fc.assert(
      fc.property(
        vehicleArb,
        fc.array(purchaseArb, { maxLength: 15 }),
        fc.array(rentalArb, { maxLength: 15 }),
        fc.array(terminalArb, { maxLength: 10 }),
        (v, purchases, rentals, terminals) => {
          const detail = buildShipDetail(v, purchases, rentals, terminals);

          // (a) Identidad del detalle.
          expect(detail.categoryId).toBe("naves");
          expect(detail.title).toBe(resolveShipName(v));
          expect(detail.subtitle).toBe(displayValue(v.company_name));

          // Todos los `kind` pertenecen al conjunto cerrado de Tipo_Bloque.
          for (const section of detail.sections) {
            expect(KNOWN_KINDS).toContain(section.kind);
          }

          // (b) Exactamente una sección `fields` "Ficha técnica", siempre.
          const fieldsSections = detail.sections.filter(
            (s) => s.kind === "fields",
          );
          expect(fieldsSections).toHaveLength(1);
          expect(
            (fieldsSections[0] as { kind: "fields"; label: string }).label,
          ).toBe("Ficha técnica");

          // Condiciones de inclusión esperadas (replican los helpers puros).
          const galleryPresent = buildGalleryImages(v) !== null;
          const buyPresent = purchases.some((p) => p.id_vehicle === v.id);
          const rentPresent = rentals.some((r) => r.id_vehicle === v.id);
          const linksPresent = buildExternalLinks(v).length > 0;

          // (c) + (d) Firma ordenada esperada (orden canónico fijo).
          const expectedSignatures: string[] = [];
          if (galleryPresent) expectedSignatures.push("gallery");
          expectedSignatures.push("fields");
          if (buyPresent) expectedSignatures.push("prices:buy");
          if (rentPresent) expectedSignatures.push("prices:rent");
          if (linksPresent) expectedSignatures.push("links");

          const actualSignatures = detail.sections.map((s) =>
            s.kind === "prices" ? `prices:${s.operation}` : s.kind,
          );

          expect(actualSignatures).toEqual(expectedSignatures);
        },
      ),
      { numRuns: 100 },
    );
  });
});
