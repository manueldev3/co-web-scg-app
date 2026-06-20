import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type {
  ApiTerminal,
  ApiVehicle,
  ApiVehiclePurchasePrice,
  ApiVehicleRentalPrice,
  DetailSection,
} from "../types";

/**
 * Tests for `naves.loadDetail` (task 5.2).
 *
 * `loadDetail` aggregates four UEX sources with `Promise.allSettled`
 * (vehicles, purchase prices, rental prices, terminals) and composes a
 * `WikiDetail` with `buildShipDetail`. These tests mock the Cliente_UEX module
 * (`../uex-api`) so we can drive each source independently — including a source
 * that REJECTS — without touching the network.
 *
 * Verifies:
 *   - `loadDetail` returns `null` for a slug that matches no ship (Req 7.1).
 *   - When a price source rejects OR returns `[]`, the rest of the detail is
 *     still composed without that Bloque_Precios (Req 6.6, 6.7).
 *   - When the ship has purchase/rental rows, the detail includes the
 *     corresponding `prices` sections (Req 6.7).
 *
 * These are example-based unit + aggregation-integration tests, not PBT.
 *
 * Validates: Requirements 6.6, 6.7, 7.1
 */

// --- Cliente_UEX mock -----------------------------------------------------
// Hoisted mock fns so the factory below can reference them and individual
// tests can program each source's resolution/rejection per scenario.
const mocks = vi.hoisted(() => ({
  fetchVehicles: vi.fn(),
  fetchVehiclePurchasePrices: vi.fn(),
  fetchVehicleRentalPrices: vi.fn(),
  fetchTerminals: vi.fn(),
}));

vi.mock("../uex-api", () => ({
  fetchVehicles: mocks.fetchVehicles,
  fetchVehiclePurchasePrices: mocks.fetchVehiclePurchasePrices,
  fetchVehicleRentalPrices: mocks.fetchVehicleRentalPrices,
  fetchTerminals: mocks.fetchTerminals,
}));

import { navesCategory } from "../categories/naves";

// --- fixtures -------------------------------------------------------------

/** A minimal spaceship whose name resolves to slug "aurora-mr". */
function makeShip(overrides: Partial<ApiVehicle> = {}): ApiVehicle {
  return {
    id: 42,
    name: "Aurora MR",
    name_full: "Aurora MR",
    scu: 0,
    crew: "1",
    is_spaceship: 1,
    is_cargo: 0,
    is_ground_vehicle: 0,
    container_sizes: null,
    pad_type: null,
    company_name: "Roberts Space Industries",
    ...overrides,
  };
}

const TERMINALS: ApiTerminal[] = [
  { id: 100, name: "Port Olisar" },
  { id: 200, name: "Lorville" },
];

const PURCHASES: ApiVehiclePurchasePrice[] = [
  { id_vehicle: 42, id_terminal: 100, price_buy: 1_200_000 },
];

const RENTALS: ApiVehicleRentalPrice[] = [
  { id_vehicle: 42, id_terminal: 200, price_rent: 35_000 },
];

/** Find the (single) prices section for a given operation, if present. */
function priceSection(
  sections: DetailSection[],
  operation: "buy" | "rent",
): Extract<DetailSection, { kind: "prices" }> | undefined {
  return sections.find(
    (s): s is Extract<DetailSection, { kind: "prices" }> =>
      s.kind === "prices" && s.operation === operation,
  );
}

beforeEach(() => {
  mocks.fetchVehicles.mockReset();
  mocks.fetchVehiclePurchasePrices.mockReset();
  mocks.fetchVehicleRentalPrices.mockReset();
  mocks.fetchTerminals.mockReset();

  // Sensible defaults; individual tests override what they exercise.
  mocks.fetchVehicles.mockResolvedValue([makeShip()]);
  mocks.fetchVehiclePurchasePrices.mockResolvedValue(PURCHASES);
  mocks.fetchVehicleRentalPrices.mockResolvedValue(RENTALS);
  mocks.fetchTerminals.mockResolvedValue(TERMINALS);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("naves.loadDetail — slug inexistente (Req 7.1)", () => {
  it("returns null when no ship matches the slug", async () => {
    const detail = await navesCategory.loadDetail("nave-inexistente");
    expect(detail).toBeNull();
  });

  it("returns null when the vehicles source is empty", async () => {
    mocks.fetchVehicles.mockResolvedValue([]);
    const detail = await navesCategory.loadDetail("aurora-mr");
    expect(detail).toBeNull();
  });

  it("returns null when the matching vehicle is not a spaceship", async () => {
    mocks.fetchVehicles.mockResolvedValue([makeShip({ is_spaceship: 0 })]);
    const detail = await navesCategory.loadDetail("aurora-mr");
    expect(detail).toBeNull();
  });
});

describe("naves.loadDetail — composición e identidad (Req 6.7)", () => {
  it("composes the detail with title/subtitle and both prices sections when data is present", async () => {
    const detail = await navesCategory.loadDetail("aurora-mr");

    expect(detail).not.toBeNull();
    expect(detail!.categoryId).toBe("naves");
    expect(detail!.title).toBe("Aurora MR");
    expect(detail!.subtitle).toBe("Roberts Space Industries");

    const buy = priceSection(detail!.sections, "buy");
    const rent = priceSection(detail!.sections, "rent");

    expect(buy).toBeDefined();
    expect(buy!.rows).toEqual([
      { locationName: "Port Olisar", price: 1_200_000 },
    ]);

    expect(rent).toBeDefined();
    expect(rent!.rows).toEqual([{ locationName: "Lorville", price: 35_000 }]);
  });

  it("always includes the Ficha técnica fields section", async () => {
    const detail = await navesCategory.loadDetail("aurora-mr");
    const fields = detail!.sections.find((s) => s.kind === "fields");
    expect(fields).toBeDefined();
  });
});

describe("naves.loadDetail — resiliencia de agregación (Req 6.6, 6.7)", () => {
  it("omits the buy prices section when the purchase source returns []", async () => {
    mocks.fetchVehiclePurchasePrices.mockResolvedValue([]);

    const detail = await navesCategory.loadDetail("aurora-mr");

    expect(detail).not.toBeNull();
    expect(priceSection(detail!.sections, "buy")).toBeUndefined();
    // The rest of the detail still composes (rental section remains).
    expect(priceSection(detail!.sections, "rent")).toBeDefined();
  });

  it("omits the rent prices section when the rental source returns []", async () => {
    mocks.fetchVehicleRentalPrices.mockResolvedValue([]);

    const detail = await navesCategory.loadDetail("aurora-mr");

    expect(detail).not.toBeNull();
    expect(priceSection(detail!.sections, "rent")).toBeUndefined();
    expect(priceSection(detail!.sections, "buy")).toBeDefined();
  });

  it("still composes the detail (without the buy section) when the purchase source REJECTS (Req 6.6)", async () => {
    mocks.fetchVehiclePurchasePrices.mockRejectedValue(
      new Error("network down"),
    );

    const detail = await navesCategory.loadDetail("aurora-mr");

    expect(detail).not.toBeNull();
    expect(detail!.title).toBe("Aurora MR");
    // Failed source → treated as [] → buy section omitted, others survive.
    expect(priceSection(detail!.sections, "buy")).toBeUndefined();
    expect(priceSection(detail!.sections, "rent")).toBeDefined();
  });

  it("composes the detail without ANY prices section when both price sources fail", async () => {
    mocks.fetchVehiclePurchasePrices.mockRejectedValue(new Error("boom"));
    mocks.fetchVehicleRentalPrices.mockResolvedValue([]);

    const detail = await navesCategory.loadDetail("aurora-mr");

    expect(detail).not.toBeNull();
    expect(detail!.sections.some((s) => s.kind === "prices")).toBe(false);
    // Ficha técnica is always present even when every optional source is gone.
    expect(detail!.sections.some((s) => s.kind === "fields")).toBe(true);
  });

  it("falls back to the row's terminal_name when the terminals source fails", async () => {
    mocks.fetchTerminals.mockRejectedValue(new Error("terminals down"));
    mocks.fetchVehiclePurchasePrices.mockResolvedValue([
      {
        id_vehicle: 42,
        id_terminal: 100,
        price_buy: 999,
        terminal_name: "Área 18",
      },
    ]);
    mocks.fetchVehicleRentalPrices.mockResolvedValue([]);

    const detail = await navesCategory.loadDetail("aurora-mr");

    const buy = priceSection(detail!.sections, "buy");
    expect(buy).toBeDefined();
    expect(buy!.rows).toEqual([{ locationName: "Área 18", price: 999 }]);
  });
});
