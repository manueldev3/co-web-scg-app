import { ApiPriceRecord, TerminalPriceRecord } from "./types";

/**
 * Builds a hierarchical location string from a price record.
 * Concatenates non-null location fields separated by " > ".
 * Order: star_system > planet > orbit > moon > city > space_station > outpost
 */
export function buildHierarchicalLocation(
  record: Pick<
    ApiPriceRecord,
    | "star_system_name"
    | "planet_name"
    | "orbit_name"
    | "moon_name"
    | "city_name"
    | "space_station_name"
    | "outpost_name"
  >,
): string {
  return [
    record.star_system_name,
    record.planet_name,
    record.orbit_name,
    record.moon_name,
    record.city_name,
    record.space_station_name,
    record.outpost_name,
  ]
    .filter(Boolean)
    .join(" > ");
}

/**
 * Formats a price number with thousands separator and decimals, suffixed with " UEC".
 * Example: formatPrice(1234.56) → "1,234.56 UEC"
 */
export function formatPrice(price: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  return `${formatted} UEC`;
}

/**
 * Formats stock as "{available} / {max} SCU" or "{available} SCU".
 * Uses thousands separators for numbers.
 */
export function formatStock(available: number, max?: number | null): string {
  const formatter = new Intl.NumberFormat("en-US");
  const formattedAvailable = formatter.format(available);

  if (max != null) {
    const formattedMax = formatter.format(max);
    return `${formattedAvailable} / ${formattedMax} SCU`;
  }

  return `${formattedAvailable} SCU`;
}

/**
 * Separates API price records into sellers and buyers with correct ordering.
 * - sellers: records where price_buy > 0, sorted by price_buy ASC
 * - buyers: records where price_sell > 0, sorted by price_sell DESC
 */
export function separateRecords(data: ApiPriceRecord[]): {
  sellers: TerminalPriceRecord[];
  buyers: TerminalPriceRecord[];
} {
  const sellers: TerminalPriceRecord[] = data
    .filter((record) => record.price_buy > 0)
    .sort((a, b) => a.price_buy - b.price_buy)
    .map((record) => ({
      id: record.id,
      terminalName: record.terminal_name,
      location: buildHierarchicalLocation(record),
      price: record.price_buy,
      stockAvailable: record.scu_buy,
      stockMax: record.scu_buy_max ?? null,
    }));

  const buyers: TerminalPriceRecord[] = data
    .filter((record) => record.price_sell > 0)
    .sort((a, b) => b.price_sell - a.price_sell)
    .map((record) => ({
      id: record.id,
      terminalName: record.terminal_name,
      location: buildHierarchicalLocation(record),
      price: record.price_sell,
      stockAvailable: record.scu_sell,
      stockMax: record.scu_sell_max ?? null,
    }));

  return { sellers, buyers };
}

/**
 * Converts a slug to a readable name.
 * Replaces hyphens with spaces and capitalizes the first letter of each word.
 * Example: "hydrogen-fuel" → "Hydrogen Fuel"
 */
export function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
