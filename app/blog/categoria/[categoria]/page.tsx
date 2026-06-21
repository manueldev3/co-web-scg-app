// Listado público del Blog filtrado por categoría (Req 1.4, 1.10).
//
// Server Component (Next.js 16 modificado). Según la documentación incluida en
// `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
// y `.../dynamic-routes.md`, en esta versión el prop `params` es una **Promesa**
// que DEBE esperarse con `async/await` («Since the `params` prop is a promise,
// you must use `async`/`await` ... to access the values»). `searchParams` es
// igualmente una Promesa y una Request-time API. Por eso este componente es
// `async` y resuelve ambos con `await` antes de usarlos.
//
// La obtención de datos se delega en la capa de servidor (`blog-data.ts`) y toda
// la lógica de filtrado, orden y paginación vive en la lógica pura
// (`blog-engine.ts`). La UI de paginación y navegación de categorías la renderiza
// el Client Component `BlogListClient`.

import { Suspense } from "react";
import { getCategories, getPublishedPosts } from "../../blog-data";
import {
  POSTS_PER_PAGE,
  filterByCategory,
  orderPublishedPosts,
  paginate,
} from "../../blog-engine";
import BlogListClient from "../../BlogListClient";

/**
 * Extrae el índice de página (base 0) a partir del valor del query string.
 * El parámetro `page` es 1-based de cara al usuario; un valor ausente, no
 * numérico o menor que 1 se interpreta como la primera página (índice 0).
 */
function resolvePageIndex(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 0;
  }
  return parsed - 1;
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // `params` y `searchParams` son Promesas en esta versión de Next.js: se esperan.
  const { categoria } = await params;
  const { page } = await searchParams;

  // Datos de lectura desde la capa de servidor (cacheada en `blog-data.ts`).
  const [posts, categories] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
  ]);

  // Solo publicadas de esta categoría (Req 1.4), ordenadas por fecha desc y
  // título asc (Req 1.2, 1.3) mediante la lógica pura.
  const categoryPosts = orderPublishedPosts(filterByCategory(posts, categoria));

  // Nombre legible de la categoría para los encabezados (cae al id si no existe).
  const category = categories.find((item) => item.id === categoria);
  const categoryName = category?.name ?? categoria;

  // Req 1.10: si la categoría no contiene entradas publicadas, mostrar un
  // mensaje en español y NO renderizar ninguna entrada.
  if (categoryPosts.length === 0) {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-wide text-[#4a90d9]">
            Categoría
          </p>
          <h1 className="text-2xl font-semibold text-gray-100">
            {categoryName}
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#1e4a6e] bg-[#0b1622]/60 px-4 py-16 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#1e4a6e]">
            <span className="text-3xl">📭</span>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-300">
            No hay entradas disponibles
          </h2>
          <p className="max-w-md text-gray-500">
            Todavía no hay entradas publicadas en esta categoría. Vuelve más
            adelante para descubrir nuevo contenido.
          </p>
        </div>
      </section>
    );
  }

  // Paginación: como máximo `POSTS_PER_PAGE` (10) entradas por página (Req 1.8,
  // 1.9), preservando el orden. `paginate` sujeta el índice al rango válido.
  const {
    items,
    pageIndex: safePageIndex,
    totalPages,
  } = paginate(categoryPosts, POSTS_PER_PAGE, resolvePageIndex(page));

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wide text-[#4a90d9]">
          Categoría
        </p>
        <h1 className="text-2xl font-semibold text-gray-100">{categoryName}</h1>
      </header>
      {/* `BlogListClient` usa `useSearchParams()`; debe renderizarse dentro de
          un límite `<Suspense>` para cumplir el requisito de prerenderizado
          estático de Next.js (ver la nota de contrato en `BlogListClient.tsx`). */}
      <Suspense fallback={null}>
        <BlogListClient
          posts={items}
          categories={categories}
          pageIndex={safePageIndex}
          totalPages={totalPages}
        />
      </Suspense>
    </section>
  );
}
