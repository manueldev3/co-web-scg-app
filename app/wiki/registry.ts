import type React from "react";

import { LandingEntry, WikiDetail, WikiListItem } from "./types";
// NOTE: `navesCategory` se implementa en la tarea 5.2 (app/wiki/categories/naves.ts).
// El Registro_Categorias depende de esa entrada, por lo que la importa desde
// "./categories/naves" esperando un export `navesCategory: WikiCategory`.
import { navesCategory } from "./categories/naves";

/**
 * Proveedor_Descripcion — dado el identificador (slug) de un elemento de la
 * categoría, resuelve su Texto_Descripcion en bruto o su ausencia. Es
 * resiliente por contrato: NUNCA lanza y devuelve ausencia (null/undefined)
 * cuando no dispone de texto (Req 2.5). Síncrono: no realiza I/O (Req 3.5).
 */
export type DescriptionProvider = (slug: string) => string | null | undefined;

/**
 * Registro_Categorias — contrato declarativo de una categoría de la wiki.
 *
 * Cada entrada describe una Categoria_Wiki: sus metadatos de presentación
 * (id, label, icono, estado, descripción) y sus adaptadores de datos
 * (`loadItems`/`loadDetail`). Las páginas genéricas de la wiki no conocen
 * categorías concretas: derivan todo de este registro. Añadir una categoría
 * nueva = añadir una entrada aquí, sin tocar páginas existentes (Req 3.1, 3.4).
 */
export interface WikiCategory {
  /** Identificador único = segmento de ruta. P.ej. "naves". */
  id: string;
  /** Nombre visible. P.ej. "Naves". */
  label: string;
  /**
   * Icono opcional (Ant Design). Reservado para uso en islas cliente: las
   * páginas de servidor NO deben renderizarlo, ya que importar iconos de antd
   * en el grafo del servidor invalida la recolección de datos de página. La
   * Wiki_Landing resuelve los iconos en el cliente (`CategoryCards`).
   */
  icon?: React.ReactNode;
  /** "active" se navega; "coming_soon" se muestra deshabilitada. */
  status: "active" | "coming_soon";
  /** Texto corto para la tarjeta de la landing. */
  description: string;
  /** Carga y normaliza los elementos de la categoría. */
  loadItems: () => Promise<WikiListItem[]>;
  /** Carga el detalle de un elemento por slug; null si no existe. */
  loadDetail: (slug: string) => Promise<WikiDetail | null>;

  /**
   * Fuente de Texto_Descripcion de la categoría. Opcional: cuando una
   * categoría no lo declara, el Detalle_Elemento omite el Bloque_Descripcion
   * para sus elementos (Req 2.3). Campo aditivo: los selectores existentes
   * (getCategory, getActiveCategories, getLandingEntries) no lo usan.
   */
  descriptionProvider?: DescriptionProvider;
}

/**
 * Catálogo de categorías de la wiki. En el MVP la única categoría `active` es
 * "naves" (Req 3.5). Las categorías futuras se añaden aquí como `coming_soon`.
 */
export const WIKI_CATEGORIES: WikiCategory[] = [navesCategory];

/**
 * Devuelve la categoría cuyo `id` coincide con el indicado, o `undefined` si no
 * existe en el registro. Selector puro sobre `WIKI_CATEGORIES` (Req 3.2).
 */
export function getCategory(id: string): WikiCategory | undefined {
  return WIKI_CATEGORIES.find((category) => category.id === id);
}

/**
 * Devuelve únicamente las categorías con `status === "active"`, preservando su
 * orden original (Req 3.3, 3.5). Selector puro: recibe la lista a filtar para
 * ser fácilmente testable sin acoplarse a `WIKI_CATEGORIES`.
 */
export function getActiveCategories(
  categories: WikiCategory[],
): WikiCategory[] {
  return categories.filter((category) => category.status === "active");
}

/**
 * Deriva las entradas de la Wiki_Landing a partir del registro: exactamente una
 * `LandingEntry` por categoría definida, preservando su identidad (`id`,
 * `label`) y marcando como `navigable` únicamente a las categorías activas
 * (Property 10; Req 2.1, 2.5, 3.2).
 */
export function getLandingEntries(categories: WikiCategory[]): LandingEntry[] {
  return categories.map((category) => ({
    id: category.id,
    label: category.label,
    status: category.status,
    navigable: category.status === "active",
  }));
}
