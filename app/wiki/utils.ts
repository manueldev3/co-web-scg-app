import type { DescriptionProvider } from "./registry";
import {
  ApiTerminal,
  ApiVehicle,
  DetailField,
  DetailSection,
  ExternalLinkType,
  GalleryImages,
  LinkEntry,
  PriceRow,
  WikiDetail,
  WikiListItem,
  WikiSearchResult,
} from "./types";

/**
 * Returns `true` when the vehicle's `is_spaceship` flag indicates it is a ship.
 * The UEX `/vehicles` endpoint encodes the flag as 0 | 1.
 */
export function isSpaceship(v: ApiVehicle): boolean {
  return v.is_spaceship === 1;
}

/**
 * Keeps only the vehicles that are ships, preserving the original order and
 * without adding or duplicating elements.
 */
export function filterSpaceships(v: ApiVehicle[]): ApiVehicle[] {
  return v.filter(isSpaceship);
}

/**
 * Resolves the display name of a ship: `name_full` when present and non-empty,
 * otherwise the fallback `name`.
 */
export function resolveShipName(v: ApiVehicle): string {
  const full = v.name_full;
  return full != null && full !== "" ? full : v.name;
}

/**
 * Converts a name to a URL-friendly slug: lowercase, with non-alphanumeric
 * runs collapsed into single hyphens and no leading/trailing hyphens.
 * Example: "Aurora MR" → "aurora-mr"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Marcador mostrado cuando un campo es un Dato_Faltante (`null`/`undefined`). */
export const MISSING_DATA = "Dato no disponible";

/**
 * Parses the UEX `container_sizes` field (a comma-separated string such as
 * "1,2,4,8,16,24,32") into a list of numbers. An empty string or `null`
 * yields an empty list. Round-trips a comma-joined list of non-negative ints.
 */
export function parseContainerSizes(s: string | null): number[] {
  if (s == null || s === "") return [];
  return s
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => !Number.isNaN(n));
}

/**
 * Formats a raw value for display. Returns the `MISSING_DATA` marker only when
 * the value is `null` or `undefined`. An empty string and the number zero are
 * NOT treated as missing and are rendered as their textual representation
 * ("" and "0" respectively).
 */
export function displayValue(v: unknown): string {
  if (v == null) return MISSING_DATA;
  return String(v);
}

/**
 * Mapa estable indicador `is_*` → etiqueta de clasificación. El orden de las
 * entradas define el orden de salida de `activeClassifications`.
 */
const CLASSIFICATION_LABELS: ReadonlyArray<
  readonly [keyof ApiVehicle, string]
> = [
  ["is_spaceship", "Nave espacial"],
  ["is_cargo", "Carga"],
  ["is_ground_vehicle", "Vehículo terrestre"],
  ["is_mining", "Minería"],
  ["is_salvage", "Salvamento"],
  ["is_refinery", "Refinería"],
  ["is_scanning", "Escaneo"],
  ["is_exploration", "Exploración"],
  ["is_military", "Militar"],
  ["is_civilian", "Civil"],
  ["is_medical", "Médico"],
  ["is_racing", "Carreras"],
  ["is_stealth", "Sigilo"],
];

/**
 * Returns the labels of every active `is_*` classification flag on a vehicle,
 * in the stable order of `CLASSIFICATION_LABELS`. A label is only added when
 * the corresponding flag is exactly `1`; values of `0`, `null` or absent are
 * ignored. Covers the expanded classification set exposed by `/vehicles`.
 */
export function activeClassifications(v: ApiVehicle): string[] {
  const labels: string[] = [];
  for (const [key, label] of CLASSIFICATION_LABELS) {
    if (v[key] === 1) labels.push(label);
  }
  return labels;
}

/**
 * Decodifica la cadena JSON del campo `url_photos` de `/vehicles` en una lista
 * de URLs (`string[]`). Es resiliente por diseño: ante `null`/`undefined`,
 * cadena vacía, JSON inválido o JSON que no representa un array de cadenas,
 * devuelve la lista vacía y NUNCA lanza. Sólo se conservan los elementos que
 * sean cadenas; cualquier elemento no-cadena descarta toda la entrada.
 */
export function parsePhotoUrls(urlPhotos: string | null | undefined): string[] {
  if (urlPhotos == null || urlPhotos === "") return [];
  try {
    const parsed = JSON.parse(urlPhotos);
    if (!Array.isArray(parsed)) return [];
    if (!parsed.every((item) => typeof item === "string")) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}

/** Resolver de nombre de Ubicacion_Juego a partir de un `id_terminal`. */
export type LocationNameResolver = (
  idTerminal: number,
  fallbackName: string | null | undefined,
) => string;

/**
 * Construye un resolver `id_terminal → nombre de la Ubicacion_Juego` a partir
 * de la lista de terminales. El resolver devuelve el `name` del terminal cuyo
 * `id` coincide con `idTerminal`; si no hay coincidencia, devuelve el
 * `fallbackName` cuando no es un Dato_Faltante ni una cadena vacía; en
 * cualquier otro caso devuelve el marcador `MISSING_DATA`.
 */
export function buildLocationNameResolver(
  terminals: ApiTerminal[],
): LocationNameResolver {
  const byId = new Map<number, string>();
  for (const t of terminals) {
    byId.set(t.id, t.name);
  }
  return (idTerminal, fallbackName) => {
    const matched = byId.get(idTerminal);
    if (matched != null) return matched;
    if (fallbackName != null && fallbackName !== "") return fallbackName;
    return MISSING_DATA;
  };
}

/** Fila de precio normalizada que consume `buildPriceRows`. */
export interface NormalizedPriceRow {
  id_vehicle: number;
  id_terminal: number;
  terminal_name?: string | null;
  price: number; // aUEC
}

/**
 * Filtra las filas de precio dejando únicamente las que corresponden al
 * `vehicleId` indicado (ninguna fila de otro vehículo aparece y ninguna fila
 * coincidente se omite), preservando el orden original, y mapea cada fila a una
 * `PriceRow` con `locationName` resuelto por el `resolver` (a partir del
 * `id_terminal` y el `terminal_name` de la fila) y `price` igual al importe de
 * la fila. Acepta filas ya normalizadas a `{ id_vehicle, id_terminal,
 * terminal_name, price }` (la clave `price_buy`/`price_rent` se normaliza antes
 * de invocar este helper).
 */
export function buildPriceRows(
  vehicleId: number,
  priceRows: NormalizedPriceRow[],
  resolver: LocationNameResolver,
): PriceRow[] {
  return priceRows
    .filter((row) => row.id_vehicle === vehicleId)
    .map((row) => ({
      locationName: resolver(row.id_terminal, row.terminal_name),
      price: row.price,
    }));
}

/**
 * Orden estable y etiqueta de cada Enlace_Externo de `/vehicles`.
 */
const EXTERNAL_LINK_FIELDS: ReadonlyArray<{
  field: keyof ApiVehicle;
  type: ExternalLinkType;
  label: string;
}> = [
  { field: "url_store", type: "store", label: "Tienda" },
  { field: "url_brochure", type: "brochure", label: "Folleto" },
  { field: "url_video", type: "video", label: "Vídeo" },
  { field: "url_hotsite", type: "hotsite", label: "Hotsite" },
];

/**
 * Recorre los campos de Enlace_Externo (`url_store`, `url_brochure`,
 * `url_video`, `url_hotsite`) en orden estable y devuelve un `LinkEntry` por
 * cada uno cuyo valor no es un Dato_Faltante ni una cadena vacía, omitiendo el
 * resto. Cada `LinkEntry` conserva el `href` original y lleva la etiqueta
 * correspondiente a su tipo.
 */
export function buildExternalLinks(v: ApiVehicle): LinkEntry[] {
  const links: LinkEntry[] = [];
  for (const { field, type, label } of EXTERNAL_LINK_FIELDS) {
    const value = v[field];
    if (typeof value === "string" && value !== "") {
      links.push({ type, label, href: value });
    }
  }
  return links;
}

/**
 * Compone la Galeria_Imagenes de una nave: `mainImage` desde `url_photo` (null
 * si está vacío o ausente), `images` desde `parsePhotoUrls(url_photos)` y
 * `altBase` desde `resolveShipName(v)`. Devuelve `null` cuando no hay ninguna
 * imagen (ni principal ni adicionales).
 */
export function buildGalleryImages(v: ApiVehicle): GalleryImages | null {
  const photo = v.url_photo;
  const mainImage = photo != null && photo !== "" ? photo : null;
  const images = parsePhotoUrls(v.url_photos);
  if (mainImage == null && images.length === 0) return null;
  return {
    mainImage,
    images,
    altBase: resolveShipName(v),
  };
}

/**
 * Configuración (reutilizable) de un campo de detalle: su etiqueta visible y
 * un accesor puro que extrae y formatea el valor desde un `ApiVehicle`.
 */
export interface ShipDetailFieldConfig {
  label: string;
  accessor: (v: ApiVehicle) => DetailField["value"];
}

/**
 * Campos configurados de la Ficha_Tecnica de la categoría "naves", en el orden
 * en que deben mostrarse: capacidad de carga (`scu`), tripulación (`crew`),
 * plataforma de aterrizaje (`pad_type`), tamaños de contenedor
 * (`container_sizes`), dimensiones físicas (masa, longitud, anchura, altura),
 * combustible (cuántico e hidrógeno) y versión del juego.
 *
 * Los campos escalares aplican el marcador de Dato_Faltante mediante
 * `displayValue`. `container_sizes` se formatea como lista numérica (cada
 * tamaño como cadena) usando `parseContainerSizes`; si no hay tamaños, se usa
 * el marcador de Dato_Faltante.
 */
export const SHIP_DETAIL_FIELDS: ShipDetailFieldConfig[] = [
  { label: "Capacidad de carga (SCU)", accessor: (v) => displayValue(v.scu) },
  { label: "Tripulación", accessor: (v) => displayValue(v.crew) },
  {
    label: "Plataforma de aterrizaje",
    accessor: (v) => displayValue(v.pad_type),
  },
  {
    label: "Tamaños de contenedor",
    accessor: (v) => {
      const sizes = parseContainerSizes(v.container_sizes);
      return sizes.length === 0 ? MISSING_DATA : sizes.map((n) => String(n));
    },
  },
  { label: "Masa", accessor: (v) => displayValue(v.mass) },
  { label: "Longitud", accessor: (v) => displayValue(v.length) },
  { label: "Anchura", accessor: (v) => displayValue(v.width) },
  { label: "Altura", accessor: (v) => displayValue(v.height) },
  {
    label: "Combustible cuántico",
    accessor: (v) => displayValue(v.fuel_quantum),
  },
  {
    label: "Combustible de hidrógeno",
    accessor: (v) => displayValue(v.fuel_hydrogen),
  },
  { label: "Versión del juego", accessor: (v) => displayValue(v.game_version) },
];

/**
 * Construye la sección `fields` de la Ficha_Tecnica: una `DetailField` por cada
 * campo configurado en `SHIP_DETAIL_FIELDS`, en orden, más un campo final
 * "Clasificaciones" cuyo valor es la lista de clasificaciones activas (o el
 * marcador de Dato_Faltante si no hay ninguna). Esta sección está SIEMPRE
 * presente en el detalle (Req 7.5).
 */
function buildTechSheetSection(
  v: ApiVehicle,
): Extract<DetailSection, { kind: "fields" }> {
  const classifications = activeClassifications(v);
  const fields: DetailField[] = SHIP_DETAIL_FIELDS.map((field) => ({
    label: field.label,
    value: field.accessor(v),
  }));
  fields.push({
    label: "Clasificaciones",
    value: classifications.length === 0 ? MISSING_DATA : classifications,
  });
  return { kind: "fields", label: "Ficha técnica", fields };
}

/**
 * Normaliza un Texto_Descripcion en bruto en una lista de párrafos limpios.
 *
 * Divide el texto por líneas en blanco (`\n\s*\n+`), recorta (`trim`) cada
 * fragmento y descarta los vacíos, preservando el orden. Devuelve `null`
 * cuando la entrada es un Dato_Faltante (`null`/`undefined`), la cadena vacía,
 * una cadena compuesta únicamente por espacios en blanco, o cuando tras
 * normalizar no queda ningún párrafo no vacío. El resultado, cuando no es
 * `null`, es una lista NO vacía cuyos elementos son cadenas no vacías y sin
 * espacios sobrantes en los extremos. Es pura y NUNCA lanza (Req 2.4, 6.1).
 */
export function normalizeDescription(
  raw: string | null | undefined,
): string[] | null {
  if (raw == null) return null;
  const paragraphs = raw
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
  return paragraphs.length === 0 ? null : paragraphs;
}

/**
 * Resuelve de forma resiliente el Texto_Descripcion de un elemento a partir de
 * un Proveedor_Descripcion opcional y el `slug` del elemento.
 *
 * - Si `provider` es `undefined`, devuelve `null` (la categoría no declara
 *   descripción; Req 2.3).
 * - En otro caso, invoca `provider(slug)` dentro de un `try/catch`: si lanza
 *   (defensa adicional aunque el contrato lo prohíbe), devuelve `null`
 *   (Req 2.5, 4.3).
 * - Aplica `normalizeDescription` al valor resuelto, devolviendo una lista no
 *   vacía de párrafos o `null` cuando no hay texto con contenido.
 *
 * Es resiliente: NUNCA lanza.
 */
export function resolveDescription(
  provider: DescriptionProvider | undefined,
  slug: string,
): string[] | null {
  if (provider === undefined) return null;
  let raw: string | null | undefined;
  try {
    raw = provider(slug);
  } catch {
    return null;
  }
  return normalizeDescription(raw);
}

/**
 * Compone el `WikiDetail` completo de una nave como una lista ordenada de
 * Seccion_Detalle componibles, en el orden canónico:
 *
 *   1. `gallery`     — sólo si `buildGalleryImages(v) !== null`.
 *   2. `description` — Bloque_Descripcion; sólo si `descriptionParagraphs` es
 *                      una lista no vacía (Req 1.2, 1.3, 6.3).
 *   3. `fields`      — Ficha_Tecnica; SIEMPRE presente (Req 7.5).
 *   4. `prices` compra  — sólo si hay filas tras filtrar por `id_vehicle`.
 *   5. `prices` alquiler — sólo si hay filas tras filtrar por `id_vehicle`.
 *   6. `links`       — sólo si `buildExternalLinks(v).length > 0`.
 *
 * El parámetro opcional `descriptionParagraphs` recibe la descripción YA
 * resuelta (p. ej. mediante `resolveDescription`). Cuando es una lista no
 * vacía, se inserta una sección `{ kind: "description", paragraphs }` en su
 * posición canónica (tras la `gallery` si existe y antes de la Ficha_Tecnica);
 * cuando es `null`/`undefined`/vacía, la sección se omite. Las demás secciones
 * y su orden se conservan sin cambios, de modo que las invocaciones previas de
 * cuatro argumentos siguen siendo válidas (Req 1.6, 4.2, 6.1).
 *
 * `title = resolveShipName(v)`, `subtitle = displayValue(company_name)` y
 * `categoryId = "naves"` se conservan respecto del detalle actual. Las
 * secciones vacías se omiten; la Ficha_Tecnica nunca se omite.
 */
export function buildShipDetail(
  v: ApiVehicle,
  purchases: {
    id_vehicle: number;
    id_terminal: number;
    price_buy: number;
    terminal_name?: string | null;
  }[],
  rentals: {
    id_vehicle: number;
    id_terminal: number;
    price_rent: number;
    terminal_name?: string | null;
  }[],
  terminals: ApiTerminal[],
  descriptionParagraphs?: string[] | null,
): WikiDetail {
  const sections: DetailSection[] = [];

  // 1. Galería (sólo si hay alguna imagen)
  const gallery = buildGalleryImages(v);
  if (gallery !== null) {
    sections.push({
      kind: "gallery",
      mainImage: gallery.mainImage,
      images: gallery.images,
      altBase: gallery.altBase,
    });
  }

  // 2. Descripción (Bloque_Descripcion; sólo si hay párrafos no vacíos)
  if (descriptionParagraphs != null && descriptionParagraphs.length > 0) {
    sections.push({ kind: "description", paragraphs: descriptionParagraphs });
  }

  // 3. Ficha técnica (siempre presente)
  sections.push(buildTechSheetSection(v));

  // 4 y 5. Precios de compra y alquiler (sólo si hay filas)
  const resolver = buildLocationNameResolver(terminals);

  const buyRows = buildPriceRows(
    v.id,
    purchases.map((p) => ({
      id_vehicle: p.id_vehicle,
      id_terminal: p.id_terminal,
      terminal_name: p.terminal_name,
      price: p.price_buy,
    })),
    resolver,
  );
  if (buyRows.length > 0) {
    sections.push({ kind: "prices", operation: "buy", rows: buyRows });
  }

  const rentRows = buildPriceRows(
    v.id,
    rentals.map((r) => ({
      id_vehicle: r.id_vehicle,
      id_terminal: r.id_terminal,
      terminal_name: r.terminal_name,
      price: r.price_rent,
    })),
    resolver,
  );
  if (rentRows.length > 0) {
    sections.push({ kind: "prices", operation: "rent", rows: rentRows });
  }

  // 6. Enlaces externos (sólo si hay alguno)
  const links = buildExternalLinks(v);
  if (links.length > 0) {
    sections.push({ kind: "links", links });
  }

  return {
    categoryId: "naves",
    title: resolveShipName(v),
    subtitle: displayValue(v.company_name),
    sections,
  };
}

/**
 * Filtra un listado de elementos de categoría dejando solo aquellos cuyo
 * nombre contiene el texto `q` de forma insensible a mayúsculas/minúsculas.
 * Conserva el orden original y no añade ni duplica elementos. Un texto vacío
 * o de solo espacios no restringe el resultado (todos los elementos coinciden,
 * pues toda cadena contiene la cadena vacía).
 */
export function filterByName(items: WikiListItem[], q: string): WikiListItem[] {
  const needle = q.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}

/**
 * Busca elementos del Buscador_Wiki por nombre de forma insensible a
 * mayúsculas/minúsculas. Un texto vacío o compuesto únicamente por espacios
 * en blanco devuelve una lista vacía (no se muestran resultados). Cada
 * resultado conserva su `name`, `categoryLabel` y `href` de la forma
 * `/wiki/{categoryId}/{slug}`.
 */
export function searchWiki(
  q: string,
  items: WikiSearchResult[],
): WikiSearchResult[] {
  const needle = q.trim().toLowerCase();
  if (needle === "") return [];
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}

/**
 * Construye el enlace de búsqueda del Home hacia la wiki: `/wiki?q=<encoded>`,
 * codificando el texto con `encodeURIComponent` para que, al decodificar el
 * parámetro `q`, se recupere exactamente el texto original.
 */
export function buildWikiSearchHref(q: string): string {
  return `/wiki?q=${encodeURIComponent(q)}`;
}
