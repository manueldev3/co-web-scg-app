import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { searchUsersByEmail } from "../blog-engine";
import type { BlogUser } from "../types";

// Feature: blog, Property 11: Búsqueda de usuarios por email insensible a mayúsculas
//
// Validates: Requirements 9.5
//
// Para cualquier lista de usuarios y cualquier término de búsqueda, toda entrada
// devuelta por searchUsersByEmail tiene un email que contiene el término sin
// distinción de mayúsculas y minúsculas, y toda entrada excluida tiene un email
// que no lo contiene.

/** Emails de un pool con mezcla de may/min para ejercitar la insensibilidad. */
const EMAIL_POOL = [
  "Alice@Example.com",
  "bob@TEST.org",
  "CAROL@mail.net",
  "dave@Example.COM",
  "eve@sample.io",
] as const;

const userArb: fc.Arbitrary<BlogUser> = fc.record({
  uid: fc.string({ minLength: 1, maxLength: 8 }),
  email: fc.oneof(
    fc.constantFrom(...EMAIL_POOL),
    fc.string({ minLength: 1, maxLength: 8 }).map((s) => `${s}@domain.com`),
  ),
  role: fc.constantFrom("suscriptor" as const, "admin" as const),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
});

/** Términos: subcadenas de emails del pool, vacío y cadenas arbitrarias. */
const termArb: fc.Arbitrary<string> = fc.oneof(
  fc.constantFrom("ex", "EX", "test", "MAIL", "@", ".com", ".COM", ""),
  fc.string({ minLength: 0, maxLength: 6 }),
);

describe("Feature: blog, Property 11: Búsqueda de usuarios por email insensible a mayúsculas", () => {
  it("incluye exactamente los emails que contienen el término (case-insensitive)", () => {
    fc.assert(
      fc.property(
        fc.array(userArb, { maxLength: 30 }),
        termArb,
        (users, term) => {
          const result = searchUsersByEmail(users, term);
          const needle = term.toLowerCase();
          const resultSet = new Set(result);

          // Todo usuario devuelto contiene el término (case-insensitive).
          for (const user of result) {
            expect(user.email.toLowerCase().includes(needle)).toBe(true);
          }

          // Todo usuario excluido NO contiene el término (case-insensitive).
          for (const user of users) {
            if (!resultSet.has(user)) {
              expect(user.email.toLowerCase().includes(needle)).toBe(false);
            }
          }

          // No introduce usuarios ajenos a la lista original.
          for (const user of result) {
            expect(users.includes(user)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("un término vacío devuelve todos los usuarios", () => {
    fc.assert(
      fc.property(fc.array(userArb, { maxLength: 30 }), (users) => {
        expect(searchUsersByEmail(users, "")).toEqual(users);
      }),
      { numRuns: 100 },
    );
  });
});
