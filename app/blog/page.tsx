import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getPublishedPosts } from "./blog-data";
import { orderPublishedPosts, paginate, POSTS_PER_PAGE } from "./blog-engine";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "Blog | Guía de Star Citizen",
  description:
    "Entradas del Blog de la Guía no oficial de Star Citizen: noticias, guías y novedades del universo.",
};

/**
 * Listado público del Blog (Server Component).
 *
 * Responsabilidades de esta página (tarea 4.3):
 * - Obtener las entradas con `getPublishedPosts` (capa de datos de servidor).
 * - Ordenar con `orderPublishedPosts` (solo publicadas; fecha desc, título asc).
 *   (Req 1.1, 1.2, 1.3)
 * - Paginar con `paginate(..., POSTS_PER_PAGE, pageIndex)` leyendo el índice de
 *   página desde `searchParams`. (Req 1.8, 1.9)
 * - Mostrar un mensaje en español cuando no hay entradas publicadas. (Req 1.11)
 * - Delegar el renderizado de la página (título, fecha y categorías de cada
 *   entrada, Req 1.5, 1.6, 1.7) y la navegación interactiva (paginación +
 *   categorías, Req 1.8, 1.9) en el Client Component `BlogListClient` (tarea
 *   4.4), al que se le entrega la porción ya ordenada y ya paginada.
 *
 * Si `getPublishedPosts` lanza, el segmento entero se reemplaza por `error.tsx`
 * y nunca se muestra un listado parcial. (Req 1.12)
 *
 * --- Restricción de plataforma (Next.js 16 modificado) ---
 * - `searchParams` es una Promesa: DEBE esperarse con `await` antes de leer sus
 *   claves (convención de `params`/`searchParams` de esta versión).
 * - `BlogListClient` usa `useSearchParams()`, por lo que DEBE renderizarse
 *   dentro de una frontera `<Suspense>` para cumplir el requisito de
 *   prerenderizado estático de Next.js (lo documenta el propio componente).
 */
export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  // `searchParams` es una Promesa en esta versión de Next.js: hay que esperarla.
  const { page } = await searchParams;
  const requestedPageIndex = parsePageParam(page);

  // Si cualquiera de estas lecturas lanza, burbujea al `error.tsx` del segmento
  // (Req 1.12): no se renderiza ningún listado parcial.
  const [posts, categories] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
  ]);

  // Solo publicadas, ordenadas por fecha desc y título asc (Req 1.1, 1.2, 1.3).
  const ordered = orderPublishedPosts(posts);

  // Estado vacío: no existe ninguna entrada publicada (Req 1.11).
  if (ordered.length === 0) {
    return (
      <div className="min-h-screen bg-[#040d16] text-white">
        <BlogHeader />
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#1e4a6e] flex items-center justify-center mb-6">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Aún no hay entradas disponibles
          </h2>
          <p className="text-gray-500 max-w-md">
            Todavía no se ha publicado ninguna entrada en el Blog. Vuelve pronto
            para descubrir el contenido más reciente.
          </p>
        </div>
      </div>
    );
  }

  // Página actual: como máximo `POSTS_PER_PAGE` (10) entradas, preservando el
  // orden (Req 1.8, 1.9). `paginate` sujeta el índice al rango válido.
  const {
    items: pagePosts,
    pageIndex,
    totalPages,
  } = paginate(ordered, POSTS_PER_PAGE, requestedPageIndex);

  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      <BlogHeader />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/*
          `BlogListClient` (tarea 4.4) renderiza la lista de la página actual
          (título, fecha y nombres de categoría por entrada — Req 1.5, 1.6, 1.7)
          y los controles de navegación (paginación + categorías — Req 1.8, 1.9).
          Esta página le entrega la porción ya ordenada y ya paginada, todas las
          categorías y la posición de paginación. Se envuelve en <Suspense>
          porque el componente usa `useSearchParams()`.
        */}
        <Suspense fallback={null}>
          <BlogListClient
            posts={pagePosts}
            categories={categories}
            pageIndex={pageIndex}
            totalPages={totalPages}
          />
        </Suspense>
      </div>
    </div>
  );
}

/** Cabecera de sección reutilizada por los estados con y sin contenido. */
function BlogHeader() {
  return (
    <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
          BLOG
        </h1>
      </div>
    </div>
  );
}

/**
 * Convierte el parámetro `page` de la URL (1-based, legible) al índice 0-based
 * que espera `paginate`. Valores ausentes, no numéricos o < 1 caen a la
 * primera página (índice 0); `paginate` además sujeta el índice al rango real.
 */
function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 0;
  }
  return parsed - 1;
}
