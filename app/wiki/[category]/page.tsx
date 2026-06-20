import Link from "next/link";

import { getCategory } from "../registry";
import CategoryList from "./CategoryList";

/**
 * Listado_Categoria — Server Component genérico de la wiki.
 *
 * Resuelve el segmento dinámico `[category]` (en esta versión de Next.js
 * `params` es un `Promise` que debe resolverse con `await`; ver
 * `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`).
 *
 * La página no conoce categorías concretas: busca la entrada en el
 * Registro_Categorias. Si la categoría no existe o no está activa, muestra un
 * estado "no encontrado". Si está activa, delega la carga de datos a la propia
 * categoría (`loadItems`) y la presentación al island cliente `CategoryList`
 * (Req 4.1, 4.2). Una lista vacía produce un mensaje de estado vacío en lugar
 * de una cuadrícula vacía (Req 4.6).
 */
export default async function CategoryListPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const wikiCategory = getCategory(category);

  // Categoría inexistente o inactiva → estado "no encontrado" (tema oscuro).
  if (!wikiCategory || wikiCategory.status !== "active") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center text-white">
        <h1 className="mb-3 text-2xl font-bold text-[#9ED0FA]">
          Categoría no encontrada
        </h1>
        <p className="mb-8 max-w-md text-gray-400">
          La categoría que buscas no existe o aún no está disponible.
        </p>
        <Link
          href="/wiki"
          className="rounded-lg border border-[#143A52] bg-[#071421] px-5 py-2.5 text-[#9ED0FA] transition-colors hover:border-[#4a9eda] hover:bg-[#0a1f33]"
        >
          Volver a la wiki
        </Link>
      </div>
    );
  }

  const items = await wikiCategory.loadItems();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 text-white">
      <header className="mb-8">
        <Link
          href="/wiki"
          className="mb-4 inline-block text-sm text-[#4a9eda] transition-colors hover:text-[#9ED0FA]"
        >
          ← Volver a la wiki
        </Link>
        <h1 className="text-3xl font-bold text-[#9ED0FA]">
          {wikiCategory.label}
        </h1>
        <p className="mt-2 text-gray-400">{wikiCategory.description}</p>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#143A52] bg-[#071421] px-4 py-16 text-center">
          <p className="text-lg text-gray-400">
            No hay elementos disponibles en esta categoría por el momento.
          </p>
        </div>
      ) : (
        <CategoryList items={items} categoryId={wikiCategory.id} />
      )}
    </div>
  );
}
