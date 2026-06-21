import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { activeConnections } from "../blog-engine";
import type { PresenceConnection } from "../types";

/**
 * Feature: blog, Property 9: Las conexiones inactivas quedan excluidas del conjunto activo
 *
 * Validates: Requirements 8.4
 *
 * For any conjunto de conexiones de presencia, un instante actual y una ventana
 * de inactividad `ttl`, `activeConnections` devuelve exactamente las conexiones
 * cuya antigüedad (`now - lastSeen`) no supera `ttl` y excluye todas las que la
 * superan.
 */

/**
 * Arbitrario de conexión de presencia. `lastSeen` se extrae de un rango amplio
 * alrededor del instante de referencia para producir antigüedades tanto dentro
 * como fuera de la ventana. La ubicación es irrelevante para esta propiedad.
 */
const connectionArb: fc.Arbitrary<PresenceConnection> = fc.record({
  connectionId: fc.string({ minLength: 1, maxLength: 8 }),
  lastSeen: fc.integer({ min: 0, max: 2_000_000 }),
  location: fc.constant(null),
});

describe("Feature: blog, Property 9: Las conexiones inactivas quedan excluidas del conjunto activo", () => {
  it("devuelve exactamente las conexiones cuya antigüedad no supera el ttl", () => {
    fc.assert(
      fc.property(
        fc.array(connectionArb, { maxLength: 50 }),
        fc.integer({ min: 0, max: 2_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (conns, nowMs, ttlMs) => {
          const result = activeConnections(conns, nowMs, ttlMs);

          // Toda conexión devuelta tiene antigüedad <= ttl.
          for (const conn of result) {
            expect(nowMs - conn.lastSeen).toBeLessThanOrEqual(ttlMs);
          }

          // Ninguna conexión excluida tiene antigüedad <= ttl (todas la superan).
          const kept = new Set(result);
          for (const conn of conns) {
            if (!kept.has(conn)) {
              expect(nowMs - conn.lastSeen).toBeGreaterThan(ttlMs);
            }
          }

          // El resultado es exactamente el subconjunto vigente (mismo conteo).
          const expectedCount = conns.filter(
            (c) => nowMs - c.lastSeen <= ttlMs,
          ).length;
          expect(result.length).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});
