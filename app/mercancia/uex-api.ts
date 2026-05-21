import { ApiCommodity, ApiPriceRecord } from "./types";

/**
 * UEX Corp API client.
 *
 * Uses the correct endpoint from the official documentation:
 * https://uexcorp.space/api/documentation
 *
 * The /commodities and /commodities_prices endpoints do NOT require
 * authentication (Autorização: —), so no Bearer token is needed.
 */

const UEX_API_BASE = "https://api.uexcorp.uk/2.0";

interface UexResponse<T> {
  status: string;
  http_code?: number;
  data: T;
  message?: string;
}

/** Fetch the list of all commodities. Cache for 1 hour (matches API TTL). */
export async function fetchCommodities(): Promise<ApiCommodity[]> {
  try {
    const result = await fetch(`${UEX_API_BASE}/commodities`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!result.ok) {
      console.error(`UEX commodities error: ${result.status}`);
      return [];
    }

    const json = (await result.json()) as UexResponse<ApiCommodity[]>;
    return json.data ?? [];
  } catch (err) {
    console.error("UEX commodities fetch failed:", err);
    return [];
  }
}

/** Fetch prices for a specific commodity by name. Cache for 30 minutes. */
export async function fetchCommodityPrices(
  commodityName: string,
): Promise<ApiPriceRecord[]> {
  try {
    const url = `${UEX_API_BASE}/commodities_prices?commodity_name=${encodeURIComponent(commodityName)}`;
    const result = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { Accept: "application/json" },
    });

    if (!result.ok) {
      console.error(`UEX prices error: ${result.status}`);
      return [];
    }

    const json = (await result.json()) as UexResponse<ApiPriceRecord[]>;
    return json.data ?? [];
  } catch (err) {
    console.error("UEX prices fetch failed:", err);
    return [];
  }
}
