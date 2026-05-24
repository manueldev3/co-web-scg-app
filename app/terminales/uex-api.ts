import { ApiTerminal } from "./types";

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

/** Fetch the list of all terminals. Cache for 1 hour (matches API TTL). */
export async function fetchTerminals(): Promise<ApiTerminal[]> {
  try {
    const result = await fetch(`${UEX_API_BASE}/terminals`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!result.ok) {
      console.error(`UEX terminals error: ${result.status}`);
      return [];
    }

    const json = (await result.json()) as UexResponse<ApiTerminal[]>;
    return json.data ?? [];
  } catch (err) {
    console.error("UEX terminals fetch failed:", err);
    return [];
  }
}
