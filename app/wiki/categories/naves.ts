import type { DescriptionProvider, WikiCategory } from "../registry";
import type { WikiDetail, WikiListItem } from "../types";
import {
  fetchTerminals,
  fetchVehiclePurchasePrices,
  fetchVehicleRentalPrices,
  fetchVehicles,
} from "../uex-api";
import {
  buildShipDetail,
  displayValue,
  filterSpaceships,
  resolveDescription,
  resolveShipName,
  toSlug,
} from "../utils";
import { SHIP_DESCRIPTIONS } from "./naves-descriptions";

/**
 * Proveedor_Descripcion de naves: lee la Descripcion_Curada por slug
 * (Req 3.1–3.4). Síncrono y resiliente por contrato: no realiza I/O y devuelve
 * la ausencia (`undefined`) cuando el mapa no tiene entrada para el slug.
 */
const describeShip: DescriptionProvider = (slug) => SHIP_DESCRIPTIONS[slug];

/**
 * Categoría "naves" — única Categoria_Wiki `active` en el MVP (Req 3.5).
 *
 * Implementa los adaptadores de datos del Registro_Categorias apoyándose en el
 * Cliente_UEX (`fetchVehicles`, que nunca lanza y devuelve `[]` en error) y en
 * la lógica pura de `utils.ts`. Las páginas genéricas de la wiki solo conocen
 * este contrato, no la fuente de datos concreta.
 */

/**
 * Carga el listado de naves: obtiene los vehículos del Cliente_UEX, conserva
 * solo las naves (`is_spaceship`) y normaliza cada una a un `WikiListItem`
 * (Req 4.1, 4.2, 4.3). El nombre usa `name_full ?? name` y el subtítulo la
 * empresa fabricante formateada con el marcador de Dato_Faltante.
 */
async function loadItems(): Promise<WikiListItem[]> {
  const vehicles = await fetchVehicles();
  return filterSpaceships(vehicles).map((vehicle) => {
    const name = resolveShipName(vehicle);
    return {
      id: vehicle.id,
      categoryId: "naves",
      name,
      slug: toSlug(name),
      subtitle: displayValue(vehicle.company_name),
    };
  });
}

/**
 * Carga el detalle de una nave por slug agregando las cuatro fuentes de UEX de
 * forma resiliente con `Promise.allSettled` (Req 6.6): vehículos
 * (`fetchVehicles`), precios de compra (`fetchVehiclePurchasePrices`), precios
 * de alquiler (`fetchVehicleRentalPrices`) y terminales (`fetchTerminals`).
 * Cada origen se reduce a `[]` cuando su promesa resulta `rejected`, de modo
 * que el fallo de una fuente no impide mostrar el resto del detalle (Req 6.7).
 *
 * Sobre el conjunto de vehículos conserva solo las naves y busca aquella cuyo
 * slug derivado de su nombre coincide con `slug`. Devuelve `null` cuando no se
 * encuentra (Req 7.1); en otro caso compone el `WikiDetail` con
 * `buildShipDetail`, que omite los bloques sin datos (Req 6.7).
 */
async function loadDetail(slug: string): Promise<WikiDetail | null> {
  const [vehiclesR, purchasesR, rentalsR, terminalsR] =
    await Promise.allSettled([
      fetchVehicles(),
      fetchVehiclePurchasePrices(),
      fetchVehicleRentalPrices(),
      fetchTerminals(),
    ]);

  const vehicles = vehiclesR.status === "fulfilled" ? vehiclesR.value : [];
  const purchases = purchasesR.status === "fulfilled" ? purchasesR.value : [];
  const rentals = rentalsR.status === "fulfilled" ? rentalsR.value : [];
  const terminals = terminalsR.status === "fulfilled" ? terminalsR.value : [];

  const ship = filterSpaceships(vehicles).find(
    (vehicle) => toSlug(resolveShipName(vehicle)) === slug,
  );
  if (!ship) return null;

  // Resolución resiliente y aislada de la descripción (Req 4.1–4.3): síncrona,
  // local y sin I/O, no participa en el `Promise.allSettled` de UEX ni añade
  // llamadas nuevas. Su ausencia o fallo no impide componer el resto del detalle.
  const paragraphs = resolveDescription(
    navesCategory.descriptionProvider,
    slug,
  );

  return buildShipDetail(ship, purchases, rentals, terminals, paragraphs);
}

export const navesCategory: WikiCategory = {
  id: "naves",
  label: "Naves",
  status: "active",
  description: "Naves de Star Citizen: capacidad, tripulación y más.",
  loadItems,
  loadDetail,
  descriptionProvider: describeShip,
};
