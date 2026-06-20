import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildGalleryImages, parsePhotoUrls, resolveShipName } from "../utils";
import type { ApiVehicle } from "../types";

/**
 * Feature: wiki-detalle-completo, Property 2: Composición de la galería
 *
 * Validates: Requirements 3.1, 3.4, 3.5
 *
 * Para cualquier `ApiVehicle`, `buildGalleryImages` devuelve `null` cuando no
 * hay imagen principal (`url_photo` faltante o cadena vacía) ni imágenes
 * adicionales (`parsePhotoUrls(url_photos)` vacío); en caso contrario devuelve
 * un objeto cuyo `mainImage` es la imagen principal cuando existe (o `null`),
 * cuyo `images` es exactamente `parsePhotoUrls(url_photos)`, y cuyo `altBase`
 * se deriva del nombre de la Nave (`resolveShipName`).
 */

/** `url_photo`: ausente/Dato_Faltante, cadena vacía o URL principal. */
const urlPhotoArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.webUrl(),
);

/** `url_photos`: variado — null/""/JSON array de URLs/JSON inválido/no-array. */
const urlPhotosArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.array(fc.webUrl()).map((urls) => JSON.stringify(urls)),
  fc.constantFrom("not json", "{", '{"a":1}', "123", "true"),
);

const vehicleArb: fc.Arbitrary<ApiVehicle> = fc.record({
  id: fc.nat(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  name_full: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  scu: fc.constant(null),
  crew: fc.constant(null),
  is_spaceship: fc.constant(1),
  is_cargo: fc.constant(0),
  is_ground_vehicle: fc.constant(0),
  container_sizes: fc.constant(null),
  pad_type: fc.constant(null),
  company_name: fc.constant(null),
  url_photo: urlPhotoArb,
  url_photos: urlPhotosArb,
});

describe("Feature: wiki-detalle-completo, Property 2: Composición de la galería", () => {
  it("returns null only when there is no main image nor additional images, else composes the gallery", () => {
    fc.assert(
      fc.property(vehicleArb, (v) => {
        const result = buildGalleryImages(v);

        const expectedMain =
          v.url_photo != null && v.url_photo !== "" ? v.url_photo : null;
        const expectedImages = parsePhotoUrls(v.url_photos);

        if (expectedMain == null && expectedImages.length === 0) {
          expect(result).toBeNull();
        } else {
          expect(result).not.toBeNull();
          expect(result!.mainImage).toBe(expectedMain);
          expect(result!.images).toEqual(expectedImages);
          expect(result!.altBase).toBe(resolveShipName(v));
        }
      }),
      { numRuns: 100 },
    );
  });
});
