import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { featuredCountForWidth } from "../blog-engine";

/**
 * Feature: blog, Property 15: Número de destacados según el ancho de la ventana
 *
 * Validates: Requirements 11.6, 11.7, 11.8
 *
 * For any ancho de ventana gráfica, `featuredCountForWidth` devuelve 3 cuando el
 * ancho es mayor o igual a 1024, 2 cuando está entre 768 y 1023 inclusive, y 1
 * cuando es menor que 768.
 */

describe("Feature: blog, Property 15: Número de destacados según el ancho de la ventana", () => {
  it("3 si >= 1024, 2 si 768..1023, 1 si < 768", () => {
    fc.assert(
      fc.property(
        // Anchos en torno a los puntos de corte (incluyendo 767/768/1023/1024).
        fc.oneof(
          fc.integer({ min: 0, max: 3000 }),
          fc.constantFrom(0, 767, 768, 1023, 1024, 2560),
        ),
        (width) => {
          const result = featuredCountForWidth(width);

          if (width >= 1024) {
            expect(result).toBe(3);
          } else if (width >= 768) {
            expect(result).toBe(2);
          } else {
            expect(result).toBe(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
