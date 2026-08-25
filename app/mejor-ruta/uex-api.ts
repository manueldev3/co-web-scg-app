import type { ApiTerminal } from "../terminales/types";
import type {
  ApiCommodity,
  ApiPriceRecord,
  ApiVehicle,
  MarketData,
  TerminalMeta,
} from "./types";

/**
 * UEX Corp API client for the "Mejor Ruta" (Best Route) feature.
 *
 * Conventions (see `.kiro/steering/uex-corp-api.md` for the full API
 * reference), mirroring `app/mercancia/uex-api.ts` / `app/terminales/uex-api.ts`:
 *   - base URL `https://api.uexcorp.uk/2.0`
 *   - `fetch` with `next: { revalidate }` for caching (this project does NOT
 *     enable Cache Components, so the `revalidate` model from the modified
 *     Next.js data-fetching/caching guides in `node_modules/next/dist/docs/`
 *     applies)
 *   - `Accept: application/json`, no Authorization token (these endpoints are
 *     public — "Autorização: —" in the UEX docs)
 *   - on any thrown error or non-2xx status, return `[]` (never throw)
 *
 * IMPORTANT — price loading:
 *   `/commodities_prices` REQUIRES a query parameter (e.g. `id_commodity`);
 *   calling it bare returns HTTP 400, which is why the page used to report
 *   "no market data". To get every price in a single request we use
 *   `/commodities_prices_all` (no params, no auth, 30-min cache TTL, ~2.6k
 *   rows), which also includes `commodity_name`, `terminal_name`, and
 *   `container_sizes`. Using the bulk endpoint avoids issuing one request per
 *   commodity (~205), which would risk the 120 requests/minute rate limit.
 *
 * `fetchMarketData` aggregates the four datasets with `Promise.allSettled`
 * (per the parallel data-fetching guide) so a single failed dataset yields
 * `[]` for that dataset without failing the others.
 */

const UEX_API_BASE = "https://api.uexcorp.uk/2.0";

interface UexResponse<T> {
  status: string;
  http_code?: number;
  data: T;
  message?: string;
}

/**
 * Raw shape returned by `GET /terminals`. It is a superset of the thin
 * `ApiTerminal` ({ id, name }) used by the terminales feature; the extra
 * fields are what `fetchMarketData` needs to derive `TerminalMeta`.
 * The public terminals payload does not expose a numeric security rating, so
 * `security_level` is optional and treated as unknown (0) when absent.
 */
export interface RawTerminal extends ApiTerminal {
  is_visible?: number;
  security_level?: number | null;
  max_container_size?: number | null;
  id_faction?: number | null;
  faction_name?: string | null;
  // Location fields from the terminals endpoint
  star_system_name?: string | null;
  planet_name?: string | null;
  moon_name?: string | null;
  city_name?: string | null;
  space_station_name?: string | null;
  outpost_name?: string | null;
}

/**
 * Shared GET helper: fetches a UEX endpoint and returns `json.data` as an
 * array. On any thrown error or non-2xx status it logs and returns `[]`
 * (never throws), matching the existing clients.
 */
async function fetchUexList<T>(path: string, revalidate: number): Promise<T[]> {
  try {
    const result = await fetch(`${UEX_API_BASE}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });

    if (!result.ok) {
      console.error(`UEX ${path} error: ${result.status}`);
      return [];
    }

    const json = (await result.json()) as UexResponse<T[]>;
    return json.data ?? [];
  } catch (err) {
    console.error(`UEX ${path} fetch failed:`, err);
    return [];
  }
}

/** Fetch the list of all commodities. Cache for 1 hour (matches API TTL). */
export async function fetchCommodities(): Promise<ApiCommodity[]> {
  return fetchUexList<ApiCommodity>("/commodities", 3600);
}

/**
 * Fetch every commodity price at every terminal in a single request via
 * `/commodities_prices_all`. No auth, no parameters; cache for 30 minutes
 * (matches the endpoint's TTL). The bulk payload includes `commodity_name`,
 * `terminal_name`, and `container_sizes`, but NOT `id_faction` or the
 * location-name fields — consumers must treat those as optional.
 */
export async function fetchAllCommodityPrices(): Promise<ApiPriceRecord[]> {
  return fetchUexList<ApiPriceRecord>("/commodities_prices_all", 1800);
}

/**
 * Fetch the prices for a single commodity across every terminal, via
 * `/commodities_prices?id_commodity=N`. Cache for 30 minutes. Retained as a
 * targeted alternative to the bulk fetch (the bare endpoint returns HTTP 400,
 * so the `id_commodity` parameter is always required).
 */
export async function fetchCommodityPrices(
  idCommodity: number,
): Promise<ApiPriceRecord[]> {
  return fetchUexList<ApiPriceRecord>(
    `/commodities_prices?id_commodity=${encodeURIComponent(idCommodity)}`,
    1800,
  );
}

/** Fetch the list of all terminals. Cache for 1 hour (matches API TTL). */
export async function fetchTerminals(): Promise<RawTerminal[]> {
  return fetchUexList<RawTerminal>("/terminals", 3600);
}

/** Fetch the list of all vehicles (ships). Cache for 1 hour. */
export async function fetchVehicles(): Promise<ApiVehicle[]> {
  return fetchUexList<ApiVehicle>("/vehicles", 3600);
}

/**
 * Normalize a raw UEX terminal into the `TerminalMeta` shape used by the
 * Route_Engine for security/hidden filtering.
 *   - `securityLevel`: numeric rating from the payload when present, else 0.
 *     (The public terminals endpoint does not currently expose a security
 *     rating, so this is typically 0.)
 *   - `isHidden`: a terminal flagged `is_visible === 0` is treated as a
 *     Hidden_Location (not publicly listed).
 */
function toTerminalMeta(t: RawTerminal): TerminalMeta {
  // Build a short location string: planet/moon > city/station/outpost
  const locationParts: string[] = [];
  if (t.planet_name) locationParts.push(t.planet_name);
  if (t.moon_name) locationParts.push(t.moon_name);
  if (t.city_name) locationParts.push(t.city_name);
  if (t.space_station_name) locationParts.push(t.space_station_name);
  if (t.outpost_name) locationParts.push(t.outpost_name);

  return {
    id: t.id,
    name: t.name,
    location: locationParts.join(" > "),
    securityLevel: typeof t.security_level === "number" ? t.security_level : 0,
    isHidden: t.is_visible === 0,
    factionId: typeof t.id_faction === "number" && t.id_faction > 0 ? t.id_faction : null,
    factionName: t.faction_name ?? null,
  };
}

/**
 * Aggregate commodities, prices, terminals, and vehicles in parallel.
 *
 * Uses `Promise.allSettled` so that one failing endpoint does not abort the
 * others; any rejected (or empty-returning) dataset maps to `[]`. Terminals
 * are normalized into `TerminalMeta` before being returned.
 */
export async function fetchMarketData(): Promise<MarketData> {
  const [commoditiesResult, pricesResult, terminalsResult, vehiclesResult] =
    await Promise.allSettled([
      fetchCommodities(),
      fetchAllCommodityPrices(),
      fetchTerminals(),
      fetchVehicles(),
    ]);

  const commodities =
    commoditiesResult.status === "fulfilled" ? commoditiesResult.value : [];
  const prices = pricesResult.status === "fulfilled" ? pricesResult.value : [];
  const rawTerminals =
    terminalsResult.status === "fulfilled" ? terminalsResult.value : [];
  const vehicles =
    vehiclesResult.status === "fulfilled" ? vehiclesResult.value : [];

  return {
    commodities,
    prices,
    terminals: rawTerminals.map(toTerminalMeta),
    vehicles,
  };
}
