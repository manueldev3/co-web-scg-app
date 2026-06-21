import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isBlogLinkActive } from "../blog-engine";

/**
 * Feature: blog, Property 16: Estado activo del enlace «Blog» en la cabecera
 *
 * Validates: Requirements 12.3
 *
 * For any ruta (`pathname`), `isBlogLinkActive` devuelve verdadero si y solo si
 * la ruta es exactamente `/blog` o comienza por el segmento `/blog/`, y falso en
 * cualquier otra ruta.
 */

/**
 * Arbitrario de pathname. Mezcla rutas construidas explícitamente alrededor de
 * `/blog` (la propia raíz, subrutas y casos límite como `/blogfoo`) con rutas
 * arbitrarias, para ejercitar ambas ramas del predicado.
 */
const pathnameArb: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom(
    "/blog",
    "/blog/",
    "/blog/123",
    "/blog/categoria/naves",
    "/blogfoo",
    "/blog-extra",
    "/",
    "/mejor-ruta",
    "/mercancia/blog",
    "/admin/blog",
    "blog",
  ),
  fc.webPath(),
  fc.string({ minLength: 0, maxLength: 20 }).map((s) => `/${s}`),
);

describe("Feature: blog, Property 16: Estado activo del enlace «Blog» en la cabecera", () => {
  it("activo si y solo si la ruta es exactamente /blog o comienza por /blog/", () => {
    fc.assert(
      fc.property(pathnameArb, (pathname) => {
        const expected = pathname === "/blog" || pathname.startsWith("/blog/");
        expect(isBlogLinkActive(pathname)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});
