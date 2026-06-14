import type { ApiCommodity, ApiPriceRecord } from "../mercancia/types";

// Reutiliza los tipos existentes de mercancía (no se redefinen aquí).
export type { ApiCommodity, ApiPriceRecord };

/** GET /vehicles — nave con capacidad de carga en SCU. */
export interface ApiVehicle {
  id: number;
  name: string;
  scu: number | null; // capacidad de carga en SCU
  is_spaceship: number;
}

/** Metadatos de terminal usados para filtrar por seguridad / ocultos / facción (extiende ApiTerminal de app/terminales). */
export interface TerminalMeta {
  id: number;
  name: string;
  securityLevel: number; // nivel de seguridad numérico (mayor = más seguro)
  isHidden: boolean; // bandera Hidden_Location de UEX
  factionId: number | null; // id_faction de la terminal (0/ausente => null)
  factionName: string | null; // nombre de la facción cuando está disponible
}

/** Datos normalizados que la página servidor pasa a RouteFinder. */
export interface MarketData {
  commodities: ApiCommodity[];
  prices: ApiPriceRecord[];
  terminals: TerminalMeta[];
  vehicles: ApiVehicle[];
}

export type ProfitMode = "pure_profit" | "over_time";
export type SelectionMode = "avoid" | "only";

export interface MultiselectFilter {
  mode: SelectionMode;
  values: number[]; // ids seleccionados; vacío => sin filtrado (Req 5.5)
}

export interface RouteFilters {
  profitMode: ProfitMode;
  maxStops: number | null;
  commodityTypes: MultiselectFilter;
  commodities: MultiselectFilter;
  factions: MultiselectFilter;
  minSecurityLevel: number | null;
  boxSizeScu: number | null;
  allowWaitTimers: boolean;
  autoLoading: boolean;
  smartFilters: boolean;
  expandedView: boolean;
  avoidHiddenLocations: boolean;
}

/** Una ruta de comercio calculada (Trade_Route en el glosario). */
export interface TradeRoute {
  commodityId: number;
  commodityName: string;
  commodityTypeId: number | null;
  buyTerminalId: number;
  buyTerminalName: string;
  sellTerminalId: number;
  sellTerminalName: string;
  factionId: number | null;
  quantityScu: number; // cantidad comprada en SCU
  buyValue: number; // capital requerido, UEC
  sellValue: number; // valor bruto de venta, UEC
  profit: number; // sellValue - buyValue, UEC
  stops: number; // número de paradas en la ruta
  requiresWaitTimer: boolean; // la terminal requiere un temporizador de espera
  boxSizesScu: number[]; // tamaños de caja en los que la mercancía es comerciable
  securityLevel: number; // nivel de seguridad mínimo entre las terminales de la ruta
  includesHiddenLocation: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: { ship?: string; investment?: string };
}
