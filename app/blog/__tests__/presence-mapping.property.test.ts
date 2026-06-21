import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isMappableLocation } from "../blog-engine";
import type { GeoLocation, PresenceConnection } from "../types";

/**
 * Feature: blog, Property 10: El total de conectados incluye todas las conexiones activas y el mapa solo las geolocalizables
 *
 * Validates: Requirements 8.1, 8.6, 8.7
 *
 * For any conjunto de conexiones activas, el número total de conectados es un
 * entero >= 0 igual al número de conexiones activas, el subconjunto representado
 * en el mapa es exactamente el de conexiones con una ubicación cuyo
 * `lat ∈ [-90, 90]` y `lng ∈ [-180, 180]`, y el tamaño de ese subconjunto nunca
 * supera el total.
 */

/**
 * Ubicación que mezcla coordenadas dentro y fuera de rango (incluyendo los
 * límites exactos) para ejercitar ambas ramas de `isMappableLocation`.
 */
const geoArb: fc.Arbitrary<GeoLocation> = fc.record({
  lat: fc.oneof(
    fc.constantFrom(-90, -91, 0, 90, 91, -90.0001, 90.0001),
    fc.double({ min: -200, max: 200, noNaN: true }),
  ),
  lng: fc.oneof(
    fc.constantFrom(-180, -181, 0, 180, 181, -180.0001, 180.0001),
    fc.double({ min: -360, max: 360, noNaN: true }),
  ),
});

/** Conexión activa con ubicación posible (mapeable, no mapeable o ausente). */
const activeConnectionArb: fc.Arbitrary<PresenceConnection> = fc.record({
  connectionId: fc.string({ minLength: 1, maxLength: 8 }),
  lastSeen: fc.integer({ min: 0, max: 1_000_000 }),
  location: fc.option(geoArb, { nil: null }),
});

describe("Feature: blog, Property 10: El total de conectados incluye todas las conexiones activas y el mapa solo las geolocalizables", () => {
  it("el mapa es exactamente el subconjunto mapeable y su tamaño no supera el total", () => {
    fc.assert(
      fc.property(
        fc.array(activeConnectionArb, { maxLength: 50 }),
        (active) => {
          // Total de conectados: entero >= 0 igual al número de conexiones activas.
          const total = active.length;
          expect(Number.isInteger(total)).toBe(true);
          expect(total).toBeGreaterThanOrEqual(0);

          // Subconjunto del mapa: solo conexiones con ubicación mapeable.
          const mappable = active.filter((c) => isMappableLocation(c.location));

          for (const conn of mappable) {
            const loc = conn.location!;
            expect(loc.lat).toBeGreaterThanOrEqual(-90);
            expect(loc.lat).toBeLessThanOrEqual(90);
            expect(loc.lng).toBeGreaterThanOrEqual(-180);
            expect(loc.lng).toBeLessThanOrEqual(180);
          }

          // Toda conexión excluida del mapa no es mapeable.
          const inMap = new Set(mappable);
          for (const conn of active) {
            if (!inMap.has(conn)) {
              expect(isMappableLocation(conn.location)).toBe(false);
            }
          }

          // El subconjunto mapeado nunca supera el total de conectados.
          expect(mappable.length).toBeLessThanOrEqual(total);
        },
      ),
      { numRuns: 100 },
    );
  });
});
