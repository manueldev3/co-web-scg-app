import { describe, it, expect } from "vitest";
import {
  WIKI_CATEGORIES,
  getCategory,
  getActiveCategories,
  getLandingEntries,
} from "../registry";

/**
 * Unit tests for the Registro_Categorias selectors.
 *
 * Validates: Requirements 3.5
 *
 * En el MVP la única Categoria_Wiki activa es "naves". Estos tests de ejemplo
 * cubren los selectores puros del registro sobre el catálogo real
 * (`WIKI_CATEGORIES`), complementando el test de propiedad de las entradas de
 * la landing (Property 10).
 */
describe("registry selectors", () => {
  describe("getActiveCategories(WIKI_CATEGORIES)", () => {
    it("devuelve únicamente la categoría 'naves' como activa en el MVP", () => {
      const active = getActiveCategories(WIKI_CATEGORIES);

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe("naves");
      expect(active[0].status).toBe("active");
    });

    it("solo incluye categorías con status 'active'", () => {
      const active = getActiveCategories(WIKI_CATEGORIES);

      expect(active.every((category) => category.status === "active")).toBe(
        true,
      );
    });
  });

  describe("getCategory(id)", () => {
    it("devuelve la categoría 'naves' cuando existe en el registro", () => {
      const naves = getCategory("naves");

      expect(naves).toBeDefined();
      expect(naves?.id).toBe("naves");
      expect(naves?.label).toBe("Naves");
    });

    it("devuelve undefined para un id inexistente", () => {
      expect(getCategory("nonexistent")).toBeUndefined();
    });
  });

  describe("getLandingEntries(WIKI_CATEGORIES)", () => {
    it("incluye una entrada navegable para 'naves'", () => {
      const entries = getLandingEntries(WIKI_CATEGORIES);
      const naves = entries.find((entry) => entry.id === "naves");

      expect(naves).toBeDefined();
      expect(naves?.navigable).toBe(true);
      expect(naves?.status).toBe("active");
    });
  });
});
