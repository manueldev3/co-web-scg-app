import {
  ApiVehicle,
  ApiVehiclePurchasePrice,
  ApiVehicleRentalPrice,
  ApiTerminal,
} from "./types";

/**
 * UEX Corp API client for the wiki.
 *
 * Follows the repo conventions (see app/mercancia/uex-api.ts and the UEX Corp
 * API steering): the public read endpoints used here do NOT require auth, so no
 * Authorization header is sent. Caching uses the previous (non Cache Components)
 * model `next: { revalidate }`, as confirmed in
 * node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md.
 *
 * Never throws: on any thrown error or non-2xx status it logs and returns [].
 */

const UEX_API_BASE = "https://api.uexcorp.uk/2.0";

interface UexResponse<T> {
  status: string;
  http_code?: number;
  data: T;
  message?: string;
}

/**
 * Fetch the full list of vehicles (~278 rows). Bulk endpoint, no parameters,
 * no Authorization. Cached for ~1h (3600s, within the 3300-3900s range required
 * for list endpoints) to respect the 120 req/min rate limit.
 */
export async function fetchVehicles(): Promise<ApiVehicle[]> {
  try {
    const result = await fetch(`${UEX_API_BASE}/vehicles`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!result.ok) {
      console.error(`UEX vehicles error: ${result.status}`);
      return [];
    }

    const json = (await result.json()) as UexResponse<ApiVehicle[]>;
    return json.data ?? [];
  } catch (err) {
    console.error("UEX vehicles fetch failed:", err);
    return [];
  }
}

/**
 * Fetch los precios de compra de vehículos en todas las ubicaciones. Endpoint
 * masivo *_all (un único request, sin fan-out por nave), sin parámetros ni
 * Authorization. Cacheado ~1h (3600s, dentro del rango 3300-3900s) para
 * respetar el límite de 120 req/min.
 */
export async function fetchVehiclePurchasePrices(): Promise<
  ApiVehiclePurchasePrice[]
> {
  try {
    const result = await fetch(
      `${UEX_API_BASE}/vehicles_purchases_prices_all`,
      {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      },
    );

    if (!result.ok) {
      console.error(`UEX vehicle purchase prices error: ${result.status}`);
      return [];
    }

    const json = (await result.json()) as UexResponse<
      ApiVehiclePurchasePrice[]
    >;
    return json.data ?? [];
  } catch (err) {
    console.error("UEX vehicle purchase prices fetch failed:", err);
    return [];
  }
}

/**
 * Fetch los precios de alquiler de vehículos en todas las ubicaciones. Endpoint
 * masivo *_all (un único request, sin fan-out por nave), sin parámetros ni
 * Authorization. Cacheado ~1h (3600s, dentro del rango 3300-3900s) para
 * respetar el límite de 120 req/min.
 */
export async function fetchVehicleRentalPrices(): Promise<
  ApiVehicleRentalPrice[]
> {
  try {
    const result = await fetch(`${UEX_API_BASE}/vehicles_rentals_prices_all`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!result.ok) {
      console.error(`UEX vehicle rental prices error: ${result.status}`);
      return [];
    }

    const json = (await result.json()) as UexResponse<ApiVehicleRentalPrice[]>;
    return json.data ?? [];
  } catch (err) {
    console.error("UEX vehicle rental prices fetch failed:", err);
    return [];
  }
}

/**
 * Fetch la lista de terminales para resolver el nombre completo de cada
 * Ubicacion_Juego. Endpoint masivo, sin parámetros ni Authorization. Cacheado
 * ~1h (3600s, dentro del rango 3300-3900s) para respetar el límite de
 * 120 req/min.
 */
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
