"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Empty, Input } from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { WikiListItem } from "../types";
import { filterByName } from "../utils";

/**
 * Props for {@link CategoryList}.
 *
 * @property items      Normalized {@link WikiListItem}[] for the category,
 *                      already loaded by the server page (task 8.1).
 * @property categoryId The active category id (route segment). Each item also
 *                      carries its own `categoryId`; the detail href is built
 *                      from `item.categoryId` so the list stays correct even if
 *                      it ever mixes categories.
 */
export interface CategoryListProps {
  items: WikiListItem[];
  categoryId: string;
}

/**
 * Client island for a Listado_Categoria. Renders a name filter input
 * (`filterByName`, Req 4.5) and, for each matching element, its name and
 * subtitle (manufacturer company, Req 4.3) as a `<Link>` to the element detail
 * (Req 4.4). When the filter yields no matches, shows a "sin resultados" empty
 * state; the page-level empty state for a truly empty category is handled by
 * the server page (task 8.1).
 */
const CategoryList: React.FC<CategoryListProps> = ({ items, categoryId }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterByName(items, query), [items, query]);

  return (
    <div className="w-full text-white">
      <div className="mb-6">
        <Input
          size="large"
          allowClear
          aria-label="Filtrar por nombre"
          placeholder="Filtrar por nombre..."
          prefix={<SearchOutlined className="text-[#4a9eda]" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Empty
          className="py-12"
          description={
            <span className="text-gray-400">
              No hay elementos que coincidan con el filtro
            </span>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={`/wiki/${item.categoryId || categoryId}/${item.slug}`}
                className="block h-full rounded-lg border border-[#143A52] bg-[#071421] p-4 transition-colors hover:border-[#4a9eda] hover:bg-[#0a1f33]"
              >
                <span className="block text-base font-semibold text-[#9ED0FA]">
                  {item.name}
                </span>
                <span className="mt-1 block text-sm text-gray-300">
                  {item.subtitle}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryList;
