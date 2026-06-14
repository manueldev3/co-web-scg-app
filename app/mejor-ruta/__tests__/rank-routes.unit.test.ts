import { describe, it, expect } from "vitest";
import { rankRoutes } from "../route-engine";
import type { TradeRoute } from "../types";

/**
 * Unit tests for `rankRoutes` (Route_Engine).
 *
 * Validates: Requirements 3.5, 3.6
 *
 * Example-based tests (NOT property-based). They assert the exact resulting
 * order for small fixed route lists under both profit modes, and that
 * `rankRoutes` does not mutate its input (it returns a new array).
 *
 * Ranking rules under test:
 *   - "pure_profit": descending by total `profit`.
 *   - "over_time":   descending by profit per unit of travel/wait time, where
 *                    time = max(1, stops * 1 + (requiresWaitTimer ? 1 : 0)).
 */

/**
 * Builds a complete `TradeRoute` from partial overrides. Only the fields that
 * affect ranking (`profit`, `stops`, `requiresWaitTimer`) and an identifying
 * `commodityName` matter for these tests; the rest get harmless defaults.
 */
function makeRoute(overrides: Partial<TradeRoute>): TradeRoute {
  return {
    commodityId: 100,
    commodityName: "Route",
    commodityTypeId: null,
    buyTerminalId: 1,
    buyTerminalName: "Terminal A",
    sellTerminalId: 2,
    sellTerminalName: "Terminal B",
    factionId: null,
    quantityScu: 10,
    buyValue: 1000,
    sellValue: 1500,
    profit: 500,
    stops: 1,
    requiresWaitTimer: false,
    boxSizesScu: [1, 2, 4, 8, 16, 24, 32],
    securityLevel: 0,
    includesHiddenLocation: false,
    ...overrides,
  };
}

describe("rankRoutes — pure_profit mode", () => {
  it("orders routes in descending order of total profit", () => {
    const low = makeRoute({ commodityName: "low", profit: 100 });
    const high = makeRoute({ commodityName: "high", profit: 500 });
    const mid = makeRoute({ commodityName: "mid", profit: 300 });

    const ranked = rankRoutes([low, high, mid], "pure_profit");

    expect(ranked.map((r) => r.commodityName)).toEqual(["high", "mid", "low"]);
    expect(ranked.map((r) => r.profit)).toEqual([500, 300, 100]);
  });

  it("ignores stops and wait timers when ranking by pure profit", () => {
    // A fast, cheap route vs. a slow, expensive-but-profitable route: pure
    // profit only looks at total profit, so the higher-profit route wins
    // regardless of how many stops or wait timers it has.
    const fastSmall = makeRoute({
      commodityName: "fastSmall",
      profit: 200,
      stops: 1,
      requiresWaitTimer: false,
    });
    const slowLarge = makeRoute({
      commodityName: "slowLarge",
      profit: 900,
      stops: 5,
      requiresWaitTimer: true,
    });

    const ranked = rankRoutes([fastSmall, slowLarge], "pure_profit");

    expect(ranked.map((r) => r.commodityName)).toEqual([
      "slowLarge",
      "fastSmall",
    ]);
  });
});

describe("rankRoutes — over_time mode", () => {
  it("orders routes in descending order of profit per unit time", () => {
    // time = max(1, stops + (requiresWaitTimer ? 1 : 0))
    // A: profit 300, stops 3, no wait  -> time 3 -> ratio 100
    // B: profit 240, stops 1, no wait  -> time 1 -> ratio 240
    // C: profit 150, stops 1, wait     -> time 2 -> ratio 75
    const a = makeRoute({
      commodityName: "a",
      profit: 300,
      stops: 3,
      requiresWaitTimer: false,
    });
    const b = makeRoute({
      commodityName: "b",
      profit: 240,
      stops: 1,
      requiresWaitTimer: false,
    });
    const c = makeRoute({
      commodityName: "c",
      profit: 150,
      stops: 1,
      requiresWaitTimer: true,
    });

    const ranked = rankRoutes([a, b, c], "over_time");

    // By profit/time: b (240) > a (100) > c (75).
    expect(ranked.map((r) => r.commodityName)).toEqual(["b", "a", "c"]);
  });

  it("produces a different order than pure_profit for the same list", () => {
    // Same three routes as above. Pure profit order is a (300) > b (240) > c
    // (150); over_time order is b > a > c. This confirms the two modes rank
    // by genuinely different criteria.
    const a = makeRoute({
      commodityName: "a",
      profit: 300,
      stops: 3,
      requiresWaitTimer: false,
    });
    const b = makeRoute({
      commodityName: "b",
      profit: 240,
      stops: 1,
      requiresWaitTimer: false,
    });
    const c = makeRoute({
      commodityName: "c",
      profit: 150,
      stops: 1,
      requiresWaitTimer: true,
    });

    const byProfit = rankRoutes([a, b, c], "pure_profit");
    const byTime = rankRoutes([a, b, c], "over_time");

    expect(byProfit.map((r) => r.commodityName)).toEqual(["a", "b", "c"]);
    expect(byTime.map((r) => r.commodityName)).toEqual(["b", "a", "c"]);
  });

  it("treats stops <= 0 as a minimum time of 1 (no divide-by-zero)", () => {
    // Degenerate route with stops 0 -> time clamped to 1 -> ratio = profit.
    const degenerate = makeRoute({
      commodityName: "degenerate",
      profit: 50,
      stops: 0,
      requiresWaitTimer: false,
    });
    const normal = makeRoute({
      commodityName: "normal",
      profit: 80,
      stops: 1,
      requiresWaitTimer: false,
    });

    const ranked = rankRoutes([degenerate, normal], "over_time");

    // degenerate ratio = 50/1 = 50; normal ratio = 80/1 = 80 -> normal first.
    expect(ranked.map((r) => r.commodityName)).toEqual([
      "normal",
      "degenerate",
    ]);
  });
});

describe("rankRoutes — immutability", () => {
  it("does not mutate its input and returns a new array", () => {
    const low = makeRoute({ commodityName: "low", profit: 100 });
    const high = makeRoute({ commodityName: "high", profit: 500 });
    const mid = makeRoute({ commodityName: "mid", profit: 300 });

    const input = [low, high, mid];
    const inputOrderBefore = input.map((r) => r.commodityName);

    const ranked = rankRoutes(input, "pure_profit");

    // A new array instance is returned.
    expect(ranked).not.toBe(input);
    // The input array's order is untouched.
    expect(input.map((r) => r.commodityName)).toEqual(inputOrderBefore);
    expect(input).toEqual([low, high, mid]);
  });

  it("does not mutate its input in over_time mode either", () => {
    const a = makeRoute({ commodityName: "a", profit: 300, stops: 3 });
    const b = makeRoute({ commodityName: "b", profit: 240, stops: 1 });

    const input = [a, b];
    const ranked = rankRoutes(input, "over_time");

    expect(ranked).not.toBe(input);
    expect(input).toEqual([a, b]);
  });
});
