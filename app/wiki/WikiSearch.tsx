"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { WikiSearchResult } from "./types";
import { searchWiki } from "./utils";

/**
 * Props for {@link WikiSearch}.
 *
 * The Wiki_Landing server page (`app/wiki/page.tsx`, task 7.1) derives the
 * searchable items from the active categories of the Registro_Categorias and
 * passes them as the single `items` prop. It may also forward the `?q=` text
 * received from the Home (Home_Wiki_Section) as `initialQuery` so the search is
 * preloaded.
 *
 * @property items        Searchable results across the active categories.
 * @property initialQuery Optional text used to seed the search input (e.g. the
 *                        `?q=` value coming from the Home).
 */
export interface WikiSearchProps {
  items: WikiSearchResult[];
  initialQuery?: string;
}

/** Mensaje mostrado cuando la búsqueda no produce coincidencias (Req 6.5). */
const NO_RESULTS = "Sin resultados";

/**
 * Buscador_Wiki — isla cliente del buscador global de la wiki.
 *
 * Mantiene un input de búsqueda controlado (inicializado con `initialQuery`) y
 * aplica {@link searchWiki} de forma insensible a mayúsculas/minúsculas
 * (Req 6.2) sobre los elementos buscables de las categorías activas (Req 6.1).
 *
 * - Mientras el texto está vacío o es solo espacios, no muestra resultados
 *   (`searchWiki` devuelve `[]`) (Req 6.6).
 * - Cada resultado muestra su nombre y la etiqueta de su categoría, y enlaza al
 *   Detalle_Elemento mediante `<Link href={result.href}>` con la forma
 *   `/wiki/{categoryId}/{slug}` (Req 6.3, 6.4).
 * - Con texto no vacío y sin coincidencias, muestra el mensaje "sin resultados"
 *   (Req 6.5).
 */
const WikiSearch: React.FC<WikiSearchProps> = ({ items, initialQuery }) => {
  const [query, setQuery] = useState<string>(initialQuery ?? "");

  // Resultados derivados del texto actual (case-insensitive; vacío → []).
  const results = useMemo(() => searchWiki(query, items), [query, items]);

  // ¿Hay una búsqueda activa? (texto no vacío tras recortar espacios)
  const hasQuery = query.trim() !== "";

  return (
    <div className="w-full">
      <Input
        size="large"
        allowClear
        prefix={<SearchOutlined className="text-[#9ED0FA]" />}
        placeholder="Busca naves, ítems, lugares…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar en la wiki"
      />

      {/* Resultados: solo se renderizan cuando hay texto de búsqueda (Req 6.6). */}
      {hasQuery && (
        <div className="mt-4">
          {results.length === 0 ? (
            <p className="text-sm text-gray-400">{NO_RESULTS}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map((result) => (
                <li key={result.href}>
                  <Link
                    href={result.href}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#143A52] bg-[#071421] px-4 py-3 no-underline transition-colors hover:border-[#1e4a6e] hover:bg-[#0a1929]"
                  >
                    <span className="font-medium text-white">
                      {result.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-[#1e4a6e]/60 px-2.5 py-0.5 text-xs text-[#9ED0FA]">
                      {result.categoryLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default WikiSearch;
