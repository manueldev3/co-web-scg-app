/**
 * Respuesta del endpoint GET /vehicles.
 *
 * Los campos nuevos de esta mejora son todos opcionales/anulables por diseño
 * defensivo: la API_UEX es comunitaria y no todos los registros traen todos
 * los campos. Los campos existentes se conservan sin cambios.
 */
export interface ApiVehicle {
  // --- existentes ---
  id: number;
  name: string;
  name_full: string | null;
  scu: number | null;
  crew: string | null;
  is_spaceship: number; // 0 | 1
  is_cargo: number; // 0 | 1
  is_ground_vehicle: number; // 0 | 1
  container_sizes: string | null; // p.ej. "1,2,4,8,16,24,32"
  pad_type: string | null;
  company_name: string | null;

  // --- nuevos: dimensiones y físicas ---
  mass?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;

  // --- nuevos: combustible y versión ---
  fuel_quantum?: number | null;
  fuel_hydrogen?: number | null;
  game_version?: string | null;

  // --- nuevos: imágenes y enlaces ---
  url_photo?: string | null; // imagen principal
  url_photos?: string | null; // array de URLs codificado como cadena JSON
  url_store?: string | null;
  url_brochure?: string | null;
  url_video?: string | null;
  url_hotsite?: string | null;

  // --- nuevos: identidad ---
  uuid?: string | null;
  slug?: string | null;

  // --- nuevos: clasificación ampliada (0 | 1; pueden faltar) ---
  is_mining?: number | null;
  is_salvage?: number | null;
  is_refinery?: number | null;
  is_scanning?: number | null;
  is_exploration?: number | null;
  is_military?: number | null;
  is_civilian?: number | null;
  is_medical?: number | null;
  is_racing?: number | null;
  is_stealth?: number | null;
}

/** Fila de GET /vehicles_purchases_prices_all (conjunto reducido relevante). */
export interface ApiVehiclePurchasePrice {
  id_vehicle: number;
  id_terminal: number;
  price_buy: number; // aUEC
  vehicle_name?: string | null;
  terminal_name?: string | null;
}

/** Fila de GET /vehicles_rentals_prices_all (conjunto reducido relevante). */
export interface ApiVehicleRentalPrice {
  id_vehicle: number;
  id_terminal: number;
  price_rent: number; // aUEC
  vehicle_name?: string | null;
  terminal_name?: string | null;
}

/** Subconjunto de GET /terminals para resolver el nombre de la Ubicacion_Juego. */
export interface ApiTerminal {
  id: number;
  name: string;
  nickname?: string | null;
  star_system_name?: string | null;
  planet_name?: string | null;
  city_name?: string | null;
  space_station_name?: string | null;
}

/** Elemento normalizado de un Listado_Categoria. */
export interface WikiListItem {
  id: number | string;
  categoryId: string;
  name: string; // name_full ?? name (para naves)
  slug: string; // derivado del nombre
  subtitle: string; // empresa fabricante para naves
}

/** Resultado del Buscador_Wiki. */
export interface WikiSearchResult {
  name: string;
  categoryId: string;
  categoryLabel: string;
  slug: string;
  href: string; // /wiki/{categoryId}/{slug}
}

/** Un campo ya formateado para la vista de detalle. */
export interface DetailField {
  label: string;
  /** Valor formateado listo para mostrar; usa el marcador si falta el dato. */
  value: string | string[];
}

/** Operación de un Bloque_Precios. */
export type PriceOperation = "buy" | "rent";

/** Fila de un Bloque_Precios: ubicación + importe en aUEC. */
export interface PriceRow {
  locationName: string;
  price: number; // aUEC
}

/** Tipo de un Enlace_Externo. */
export type ExternalLinkType = "store" | "brochure" | "video" | "hotsite";

/** Un Enlace_Externo ya resuelto. */
export interface LinkEntry {
  type: ExternalLinkType;
  label: string; // etiqueta por tipo (p. ej. "Tienda")
  href: string;
}

/** Imágenes de la Galeria_Imagenes. */
export interface GalleryImages {
  mainImage: string | null;
  images: string[];
  altBase: string; // base del texto alternativo (nombre de la Nave)
}

/**
 * Seccion_Detalle — unión discriminada por `kind`. Conjunto cerrado de
 * Tipo_Bloque. Cada variante es autónoma y se renderiza de forma independiente.
 */
export type DetailSection =
  | { kind: "fields"; label: string; fields: DetailField[] } // Bloque_Grupo_Campos
  | {
      kind: "gallery";
      mainImage: string | null;
      images: string[];
      altBase: string;
    } // Bloque_Galeria
  | { kind: "prices"; operation: PriceOperation; rows: PriceRow[] } // Bloque_Precios
  | { kind: "links"; links: LinkEntry[] } // Bloque_Enlaces
  /**
   * Bloque_Descripcion — texto descriptivo (resumen/lore) del elemento.
   *
   * Invariante: `paragraphs` es SIEMPRE no vacío y cada elemento es una cadena
   * no vacía y sin recortar a solo espacios en blanco. La ausencia de
   * descripción NO se representa con `paragraphs: []`, sino con la AUSENCIA de
   * esta sección dentro de `WikiDetail.sections` (Req 1.1, 2.4, 5.1, 6.1).
   */
  | { kind: "description"; paragraphs: string[] }; // Bloque_Descripcion

/**
 * Detalle completo de un elemento (generalizado).
 *
 * Deja de tener `fields`/`classifications` planos y pasa a una lista ordenada
 * de Seccion_Detalle componibles. Las secciones vacías se omiten en la
 * composición; el orden de la lista es el orden de render.
 */
export interface WikiDetail {
  categoryId: string;
  title: string; // nombre completo
  subtitle: string; // empresa fabricante
  sections: DetailSection[]; // ordenadas; las vacías se omiten en composición
}

/** Entrada derivada para la landing (selector puro). */
export interface LandingEntry {
  id: string;
  label: string;
  status: "active" | "coming_soon";
  navigable: boolean; // true solo si status === "active"
}
