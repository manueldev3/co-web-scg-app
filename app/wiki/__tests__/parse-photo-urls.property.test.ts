import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parsePhotoUrls } from "../utils";

/**
 * Feature: wiki-detalle-completo, Property 1: Round-trip y resiliencia de parsePhotoUrls
 *
 * Validates: Requirements 3.2, 3.3
 *
 * Para cualquier lista de cadenas de URL, codificarla con `JSON.stringify` y
 * luego aplicar `parsePhotoUrls` reproduce la lista original; y para cualquier
 * entrada que sea `null`, `undefined`, cadena vacía, JSON inválido o JSON que
 * no representa un array de cadenas, `parsePhotoUrls` devuelve la lista vacía
 * sin lanzar ninguna excepción.
 */
describe("Feature: wiki-detalle-completo, Property 1: Round-trip y resiliencia de parsePhotoUrls", () => {
  it("round-trips a JSON-encoded list of URL strings", () => {
    fc.assert(
      fc.property(fc.array(fc.webUrl()), (urls) => {
        expect(parsePhotoUrls(JSON.stringify(urls))).toEqual(urls);
      }),
      { numRuns: 100 },
    );
  });

  it("returns [] without throwing for missing, empty, invalid or non-string-array inputs", () => {
    // JSON que NO representa un array de cadenas: escalares, objetos, arrays
    // con elementos no-cadena, etc. (todos deben colapsar a []).
    const nonStringArrayJson = fc
      .oneof(
        fc.integer(),
        fc.double({ noNaN: true }),
        fc.boolean(),
        fc.constant(null),
        fc.string(),
        fc.record({ a: fc.integer() }),
        fc.array(fc.integer(), { minLength: 1 }),
        fc.array(fc.oneof(fc.integer(), fc.boolean()), { minLength: 1 }),
      )
      .map((value) => JSON.stringify(value));

    // Cadenas que no son JSON válido.
    const invalidJson = fc.constantFrom(
      "not json",
      "{",
      "[1,2",
      "{bad}",
      "undefined",
      "[",
      "]]",
    );

    const resilientInput = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(""),
      invalidJson,
      nonStringArrayJson,
    );

    fc.assert(
      fc.property(resilientInput, (input) => {
        let result: string[] | undefined;
        expect(() => {
          result = parsePhotoUrls(input as string | null | undefined);
        }).not.toThrow();
        expect(result).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });
});
