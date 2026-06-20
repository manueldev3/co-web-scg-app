import WikiSearch from "./WikiSearch";
import CategoryCards, { type CategoryCardEntry } from "./CategoryCards";
import {
  WIKI_CATEGORIES,
  getActiveCategories,
  getCategory,
  getLandingEntries,
} from "./registry";
import type { WikiSearchResult } from "./types";

/**
 * Wiki_Landing — página índice de la wiki (`/wiki`), Server Component.
 *
 * Conforme a la Documentacion_Next de esta versión modificada de Next.js
 * (`03-layouts-and-pages.md`, `06-fetching-data.md`), `searchParams` es un
 * `Promise` y debe resolverse con `await` antes de leer sus valores
 * (Req 9.1, 9.2, 9.3). Sigue el mismo patrón usado en
 * `app/mercancia/[name]/page.tsx`.
 *
 * La landing es **genérica**: deriva sus tarjetas de
 * `getLandingEntries(WIKI_CATEGORIES)` (Req 2.1) sin conocer ninguna categoría
 * concreta. Calcula datos planos serializables (entradas + descripción y los
 * elementos buscables) y delega TODA la interactividad y el uso de antd a islas
 * cliente (`CategoryCards`, `WikiSearch`), igual que `mejor-ruta/page.tsx`
 * delega en `RouteFinder`. Así ni antd ni `@ant-design/icons` entran en el
 * grafo de módulos del servidor (que invalidaría la recolección de datos de
 * página al llamar a `React.createContext`).
 *
 * `CategoryCards` muestra una tarjeta por categoría con su nombre e icono
 * (Req 2.2); las activas como enlace al Listado_Categoria (Req 2.3) y las
 * `coming_soon` deshabilitadas con tooltip "Próximamente" y sin enlace
 * (Req 2.5, 2.6), aplicando el tema oscuro del sitio (Req 2.7).
 *
 * Incluye el Buscador_Wiki (`<WikiSearch />`): construye los elementos
 * buscables a partir de las categorías activas (await `loadItems()` por cada
 * una) y precarga el texto recibido desde el Home (`?q=`).
 */
export default async function WikiLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // `searchParams` es un Promise en esta versión de Next.js: hay que await.
  const { q } = await searchParams;
  const initialQuery = q ?? "";

  // Entradas de la landing derivadas del registro (una por categoría). Se
  // enriquecen con la descripción de cada categoría y se pasan como datos
  // planos serializables a la isla cliente `CategoryCards` (el icono se
  // resuelve en el cliente para no arrastrar antd al grafo del servidor).
  const cardEntries: CategoryCardEntry[] = getLandingEntries(
    WIKI_CATEGORIES,
  ).map((entry) => ({
    id: entry.id,
    label: entry.label,
    navigable: entry.navigable,
    description: getCategory(entry.id)?.description ?? "",
  }));

  // Elementos buscables: por cada categoría activa, cargar sus items y
  // normalizarlos a WikiSearchResult con href `/wiki/{categoryId}/{slug}`.
  const activeCategories = getActiveCategories(WIKI_CATEGORIES);
  const itemsPerCategory = await Promise.all(
    activeCategories.map(async (category) => {
      const items = await category.loadItems();
      return items.map<WikiSearchResult>((item) => ({
        name: item.name,
        categoryId: category.id,
        categoryLabel: category.label,
        slug: item.slug,
        href: `/wiki/${category.id}/${item.slug}`,
      }));
    }),
  );
  const searchItems: WikiSearchResult[] = itemsPerCategory.flat();

  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera de la wiki */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            WIKI
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            Información de referencia del universo de Star Citizen: naves, ítems
            y lugares. Explora por categorías o usa el buscador.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Buscador_Wiki (precargado con ?q= del Home) */}
        <section className="mb-10">
          <WikiSearch items={searchItems} initialQuery={initialQuery} />
        </section>

        {/* Tarjetas de categorías derivadas del registro (isla cliente) */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-200">
            Categorías
          </h2>
          <CategoryCards entries={cardEntries} />
        </section>
      </div>
    </div>
  );
}
