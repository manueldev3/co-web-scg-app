"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Tooltip } from "antd";
import { AppstoreOutlined, RocketOutlined } from "@ant-design/icons";

/**
 * Datos de presentación de una tarjeta de categoría de la Wiki_Landing.
 *
 * El Server Component `app/wiki/page.tsx` deriva estas entradas del
 * Registro_Categorias y las pasa como datos planos serializables (sin nodos de
 * React ni dependencias de antd), de la misma forma que `mejor-ruta/page.tsx`
 * delega en `RouteFinder`. El icono NO se transporta como prop: se resuelve
 * aquí, en el cliente, a partir del `id` (mapa `CATEGORY_ICONS`), de modo que
 * ni antd ni `@ant-design/icons` entran en el grafo de módulos del servidor.
 */
export interface CategoryCardEntry {
  /** Identificador único = segmento de ruta. P.ej. "naves". */
  id: string;
  /** Nombre visible de la categoría. */
  label: string;
  /** Texto corto descriptivo para la tarjeta. */
  description: string;
  /** `true` solo si la categoría está activa (Req 2.3, 2.5). */
  navigable: boolean;
}

export interface CategoryCardsProps {
  /** Una entrada por categoría definida en el registro (Req 2.1). */
  entries: CategoryCardEntry[];
}

/**
 * Mapa `id de categoría → icono` (Ant Design). Mantener los iconos aquí (lado
 * cliente) evita que `@ant-design/icons` se evalúe en el Server Component y
 * rompa la recolección de datos de página (`React.createContext`).
 */
const CATEGORY_ICONS: Record<string, ReactNode> = {
  naves: <RocketOutlined />,
};

/** Icono por defecto para categorías sin entrada explícita en el mapa. */
const DEFAULT_ICON: ReactNode = <AppstoreOutlined />;

/** Resuelve el icono de una categoría por su `id`, con respaldo por defecto. */
function iconFor(id: string): ReactNode {
  return CATEGORY_ICONS[id] ?? DEFAULT_ICON;
}

/**
 * CategoryCards — isla cliente con la cuadrícula de tarjetas de categorías.
 *
 * Por cada categoría muestra su nombre visible y su icono (Req 2.2). Las
 * categorías navegables (activas) se renderizan como `<Link>` al
 * Listado_Categoria `/wiki/{id}` (Req 2.3); las `coming_soon` se renderizan
 * deshabilitadas, envueltas en un `Tooltip` con título "Próximamente" y sin
 * enlace de navegación (Req 2.5, 2.6). Aplica el tema oscuro del sitio
 * (Req 2.7).
 */
const CategoryCards: React.FC<CategoryCardsProps> = ({ entries }) => {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => {
        const icon = iconFor(entry.id);

        // Categoría activa → tarjeta enlazable al Listado_Categoria.
        if (entry.navigable) {
          return (
            <li key={entry.id}>
              <Link
                href={`/wiki/${entry.id}`}
                className="flex h-full flex-col gap-2 rounded-xl border border-[#143A52] bg-[#071421] p-5 no-underline transition-colors hover:border-[#1e4a6e] hover:bg-[#0a1929]"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl text-[#9ED0FA]">{icon}</span>
                  <span className="text-lg font-semibold text-white">
                    {entry.label}
                  </span>
                </span>
                {entry.description && (
                  <span className="text-sm text-gray-400">
                    {entry.description}
                  </span>
                )}
              </Link>
            </li>
          );
        }

        // Categoría "próximamente" → deshabilitada, con tooltip y sin enlace
        // de navegación (Req 2.5, 2.6).
        return (
          <li key={entry.id}>
            <Tooltip title="Próximamente">
              <div
                aria-disabled="true"
                className="flex h-full cursor-not-allowed flex-col gap-2 rounded-xl border border-dashed border-[#143A52]/70 bg-[#071421]/50 p-5 opacity-60"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl text-gray-500">{icon}</span>
                  <span className="text-lg font-semibold text-gray-400">
                    {entry.label}
                  </span>
                </span>
                <span className="inline-flex w-fit items-center rounded-full border border-[#1e4a6e]/60 px-2.5 py-0.5 text-xs text-gray-400">
                  Próximamente
                </span>
              </div>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
};

export default CategoryCards;
