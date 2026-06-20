import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildWikiSearchHref } from "../utils";

/**
 * Feature: wiki, Property 11: Round-trip del enlace de búsqueda del Home
 *
 * Validates: Requirements 7.4
 *
 * Para cualquier texto de búsqueda, `buildWikiSearchHref` produce un enlace
 * cuyo path es `/wiki` y cuyo parámetro `q`, al decodificarlo, es exactamente
 * igual al texto original.
 */
describe("Feature: wiki, Property 11: Round-trip del enlace de búsqueda del Home", () => {
  it("el href apunta a /wiki y su parámetro q decodificado recupera el texto original", () => {
    fc.assert(
      fc.property(
        // Incluye espacios, acentos y símbolos vía la generación amplia de fc.string().
        fc.string(),
        (text) => {
          const href = buildWikiSearchHref(text);

          // El enlace siempre comienza con el path y el prefijo del parámetro.
          expect(href.startsWith("/wiki?q=")).toBe(true);

          // El path es /wiki (la parte anterior al "?").
          const [path, query] = href.split("?");
          expect(path).toBe("/wiki");

          // El parámetro q, al decodificarlo, equivale al texto original.
          const params = new URLSearchParams(query);
          expect(params.get("q")).toBe(text);
        },
      ),
      { numRuns: 100 },
    );
  });
});
