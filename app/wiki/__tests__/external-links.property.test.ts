import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildExternalLinks } from "../utils";
import type { ApiVehicle, ExternalLinkType } from "../types";

/**
 * Feature: wiki-detalle-completo, Property 5: Omisión y etiquetado de enlaces externos
 *
 * Validates: Requirements 5.1, 5.2, 5.4
 *
 * Para cualquier `ApiVehicle`, `buildExternalLinks` devuelve exactamente un
 * `LinkEntry` por cada campo de enlace (`url_store`, `url_brochure`,
 * `url_video`, `url_hotsite`) cuyo valor no es un Dato_Faltante ni una cadena
 * vacía, omitiendo el resto; cada `LinkEntry` lleva el `href` original y la
 * etiqueta correspondiente a su tipo.
 */

/** Campos de enlace en su orden estable + tipo y etiqueta esperados. */
const LINK_FIELDS: ReadonlyArray<{
  field: keyof ApiVehicle;
  type: ExternalLinkType;
  label: string;
}> = [
  { field: "url_store", type: "store", label: "Tienda" },
  { field: "url_brochure", type: "brochure", label: "Folleto" },
  { field: "url_video", type: "video", label: "Vídeo" },
  { field: "url_hotsite", type: "hotsite", label: "Hotsite" },
];

/** Un valor de campo de enlace: ausente/Dato_Faltante, cadena vacía o URL. */
const urlFieldArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(""),
  fc.webUrl(),
);

const vehicleArb: fc.Arbitrary<ApiVehicle> = fc.record({
  id: fc.nat(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  name_full: fc.constant(null),
  scu: fc.constant(null),
  crew: fc.constant(null),
  is_spaceship: fc.constant(1),
  is_cargo: fc.constant(0),
  is_ground_vehicle: fc.constant(0),
  container_sizes: fc.constant(null),
  pad_type: fc.constant(null),
  company_name: fc.constant(null),
  url_store: urlFieldArb,
  url_brochure: urlFieldArb,
  url_video: urlFieldArb,
  url_hotsite: urlFieldArb,
});

describe("Feature: wiki-detalle-completo, Property 5: Omisión y etiquetado de enlaces externos", () => {
  it("emits one labeled LinkEntry per present non-empty url field, in stable order", () => {
    fc.assert(
      fc.property(vehicleArb, (v) => {
        const result = buildExternalLinks(v);

        const expected = LINK_FIELDS.filter((f) => {
          const value = v[f.field];
          return typeof value === "string" && value !== "";
        }).map((f) => ({ type: f.type, label: f.label, href: v[f.field] }));

        expect(result).toEqual(expected);
      }),
      { numRuns: 100 },
    );
  });
});
