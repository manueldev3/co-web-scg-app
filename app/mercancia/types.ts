/** Respuesta del endpoint GET /commodities */
export interface ApiCommodity {
  id: number;
  id_parent: number | null;
  name: string;
  code: string;
  slug: string;
  kind: string | null;
  weight_scu: number | null;
  price_buy: number;
  price_sell: number;
  is_available: number;
  is_available_live: number;
  is_visible: number;
}

/** Respuesta del endpoint GET /commodities_prices */
export interface ApiPriceRecord {
  id: number;
  id_commodity: number;
  id_terminal: number;
  id_star_system: number;
  id_planet: number;
  id_orbit: number;
  id_moon: number;
  id_city: number;
  id_outpost: number;
  id_poi: number;
  id_faction: number;
  price_buy: number;
  price_sell: number;
  scu_buy: number;
  scu_buy_max: number;
  scu_sell: number;
  scu_sell_stock?: number;
  scu_sell_stock_avg?: number;
  scu_sell_avg?: number;
  scu_sell_max: number;
  commodity_name: string;
  commodity_slug: string;
  star_system_name: string | null;
  planet_name: string | null;
  orbit_name: string | null;
  moon_name: string | null;
  space_station_name: string | null;
  outpost_name: string | null;
  city_name: string | null;
  terminal_name: string;
  terminal_slug: string;
  terminal_code: string;
  game_version: string;
  date_modified: number;
  /** Tamaños de caja soportados, p.ej. "1,2,4,8,16,24,32" (presente en /commodities_prices_all). */
  container_sizes?: string;
}

/** Opción para el autocompletado del buscador */
export interface CommodityOption {
  id: number;
  name: string;
  slug: string;
}

/** Registro procesado de terminal con precio */
export interface TerminalPriceRecord {
  id: number;
  terminalName: string;
  location: string;
  price: number;
  stockAvailable: number;
  stockMax: number | null;
}

/** Datos procesados para la vista de detalle */
export interface CommodityDetailData {
  commodityName: string;
  sellers: TerminalPriceRecord[];
  buyers: TerminalPriceRecord[];
}
