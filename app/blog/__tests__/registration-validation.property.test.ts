import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateRegistration, PASSWORD_MIN } from "../blog-engine";

// Feature: blog, Property 6: Validación de registro por email y contraseña
//
// Validates: Requirements 3.1, 3.5
//
// Para cualquier par (email, contraseña), validateRegistration lo acepta si y
// solo si el email tiene un formato válido y la contraseña tiene al menos
// PASSWORD_MIN (8) caracteres; en caso contrario devuelve un error en el campo
// correspondiente (email, contraseña o ambos).

/**
 * Oráculo de formato de email: misma definición práctica que el motor (parte
 * local sin espacios, una arroba, dominio con punto y TLD de 2+ caracteres).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Emails con formato válido. */
const validEmailArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9._%+-]{1,12}$/),
    fc.stringMatching(/^[a-zA-Z0-9-]{1,10}$/),
    fc.constantFrom("com", "org", "net", "io", "es", "co"),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)
  .filter((email) => EMAIL_PATTERN.test(email));

/** Posibles emails inválidos (sin arroba, con espacios, sin dominio, etc.). */
const maybeInvalidEmailArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant(""),
  fc.constant("sin-arroba"),
  fc.constant("foo@"),
  fc.constant("@dominio.com"),
  fc.constant("foo @bar.com"),
  fc.constant("foo@bar"),
  fc.constant("foo@bar."),
  fc.string({ minLength: 0, maxLength: 20 }),
);

/** Cualquier email: mezcla de válidos e inválidos. */
const anyEmailArb: fc.Arbitrary<string> = fc.oneof(
  validEmailArb,
  maybeInvalidEmailArb,
);

/** Contraseñas de longitud variable alrededor del mínimo. */
const passwordArb: fc.Arbitrary<string> = fc.string({
  minLength: 0,
  maxLength: PASSWORD_MIN + 8,
});

describe("Feature: blog, Property 6: Validación de registro por email y contraseña", () => {
  it("acepta si y solo si el email es válido y la contraseña tiene >= PASSWORD_MIN caracteres", () => {
    fc.assert(
      fc.property(anyEmailArb, passwordArb, (email, password) => {
        const result = validateRegistration(email, password);

        const emailOk = EMAIL_PATTERN.test(email);
        const passwordOk = password.length >= PASSWORD_MIN;
        const expectedOk = emailOk && passwordOk;

        expect(result.ok).toBe(expectedOk);

        if (!result.ok) {
          // Cada campo que falla tiene un mensaje; los válidos no aparecen.
          if (emailOk) {
            expect(result.errors.email).toBeUndefined();
          } else {
            expect(typeof result.errors.email).toBe("string");
            expect((result.errors.email as string).length).toBeGreaterThan(0);
          }

          if (passwordOk) {
            expect(result.errors.password).toBeUndefined();
          } else {
            expect(typeof result.errors.password).toBe("string");
            expect((result.errors.password as string).length).toBeGreaterThan(
              0,
            );
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
