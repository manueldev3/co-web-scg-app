// Detalle de una Entrada del Blog (Server Component).
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Antes de implementar esta ruta dinámica se consultó la documentación incluida
// en `node_modules/next/dist/docs/`. Hallazgos aplicados aquí:
//
// 1. `params` es una Promesa que DEBE esperarse. Según
//    `01-app/01-getting-started/10-error-handling.md` (sección «Not found»):
//      export default async function Page({
//        params,
//      }: { params: Promise<{ slug: string }> }) {
//        const { slug } = await params
//        ...
//      }
//    Por eso este componente es `async` y hace `const { slug } = await params`.
//
// 2. Recurso no encontrado: el mismo doc indica usar la función `notFound()` de
//    `next/navigation` dentro del segmento y un archivo `not-found.tsx` para la
//    UI 404:
//      import { notFound } from 'next/navigation'
//      const post = getPostBySlug(slug)
//      if (!post) { notFound() }
//    `getPublishedPostBySlug` devuelve `null` tanto para slug inexistente como
//    para entradas en `borrador`, así que ambos casos disparan `notFound()`
//    (Req 2.6, 2.7) y se renderiza `app/blog/[slug]/not-found.tsx`
//    (ver `03-api-reference/03-file-conventions/not-found.md`).
//
// No se exporta `unstable_instant` ni se usa la directiva `use cache` porque el
// proyecto NO habilita Cache Components (ver `blog-data.ts`); el cacheado del
// contenido publicado ya lo gestiona `blog-data.ts` con `unstable_cache`.

import { notFound } from "next/navigation";
import { getCategories, getPublishedPostBySlug } from "../blog-data";
import type { Category } from "../types";
import CommentsSection from "./CommentsSection";
import LikeButton from "./LikeButton";

/** Formatea un epoch ms a fecha larga en español (o un guion si no hay fecha). */
function formatPublishedDate(publishedAt: number | null): string {
  if (publishedAt === null) {
    return "—";
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(publishedAt));
}

/** Devuelve los nombres de las categorías de la entrada, en el orden dado. */
function resolveCategoryNames(
  categoryIds: string[],
  categories: Category[],
): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categoryIds
    .map((id) => byId.get(id)?.name)
    .filter(
      (name): name is string => typeof name === "string" && name.length > 0,
    );
}

export default async function BlogPostDetailPage({
  params,
}: {
  // Next.js 16 modificado: `params` es una Promesa (ver doc citada arriba).
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // `getPublishedPostBySlug` devuelve `null` si la entrada no existe o está en
  // borrador → página de recurso no encontrado (Req 2.6, 2.7).
  const post = await getPublishedPostBySlug(slug);
  if (post === null) {
    notFound();
  }

  // Solo se necesitan las categorías para resolver nombres cuando la entrada
  // tiene alguna asociada (Req 2.4, 2.5).
  const categoryNames =
    post.categoryIds.length > 0
      ? resolveCategoryNames(post.categoryIds, await getCategories())
      : [];

  // Contadores denormalizados normalizados a enteros >= 0 (Req 2.8, 2.9).
  const commentCount = Math.max(0, Math.floor(post.commentCount));
  const likeCount = Math.max(0, Math.floor(post.likeCount));

  return (
    <article className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Título (Req 2.1) */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide mb-4">
        {post.title}
      </h1>

      {/* Metadatos: fecha (Req 2.3) y contadores (Req 2.8, 2.9) */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-[#82919E] mb-4">
        <span className="inline-flex items-center gap-1.5">
          <time>{formatPublishedDate(post.publishedAt)}</time>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span>
            {commentCount} comentario{commentCount !== 1 ? "s" : ""}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span>{likeCount} me gusta</span>
        </span>
      </div>

      {/* Categorías (Req 2.4). Se omite la sección por completo si la entrada no
          tiene categorías asociadas, sin error (Req 2.5). */}
      {categoryNames.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categoryNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-md border border-[#1e4a6e] bg-[#1e4a6e]/30 px-2.5 py-0.5 text-xs font-medium text-[#9ED0FA]"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <hr className="border-[#1e4a6e] mb-6" />

      {/* Contenido completo, sin truncar (Req 2.2). `whitespace-pre-wrap`
          conserva los saltos de línea del texto original. */}
      <div className="text-base leading-relaxed text-gray-200 whitespace-pre-wrap wrap-break-word">
        {post.content}
      </div>

      {/* Componentes interactivos en tiempo real (Client Components).
          - `LikeButton` (tarea 8.3): control de «me gusta» con estado y
            contador en tiempo real; recibe el contador denormalizado inicial.
          - `CommentsSection` (tarea 8.2): lista de comentarios en tiempo real y
            formulario condicionado a sesión.
          Ambos reciben `post.id` para suscribirse a la subcolección correcta. */}
      <div className="mt-8">
        <LikeButton postId={post.id} initialLikeCount={likeCount} />
      </div>

      <CommentsSection postId={post.id} />
    </article>
  );
}
