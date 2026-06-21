"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button, Card, Empty, Space, Tag, Typography } from "antd";
import {
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import type { Category, Post } from "./types";

const { Title, Text } = Typography;

/**
 * Props for {@link BlogListClient}.
 *
 * The listing page (task 4.3, `app/blog/page.tsx`) is the Server Component that
 * renders this client UI. It performs the ordering (`orderPublishedPosts`) and
 * pagination (`paginate`) on the server and hands the already-ordered,
 * already-paginated slice to this component. The prop names below are the exact
 * contract task 4.3 must wire to:
 *
 * - `posts`: the slice of published posts for the CURRENT page, already ordered
 *   (publication date desc, title asc on ties) and already paginated by the
 *   server. This component does not re-order or re-slice (Req 1.5, 1.6, 1.7).
 * - `categories`: every available category, used to resolve `post.categoryIds`
 *   into human-readable names and to build the category navigation (Req 1.7).
 * - `pageIndex`: zero-based index of the current page (matches the value
 *   returned by the pure `paginate` helper).
 * - `totalPages`: total number of pages for the full ordered list. Used to
 *   disable the "next" control on the last page (Req 1.8, 1.9).
 *
 * > Note for task 4.3: this component calls `useSearchParams()` to preserve any
 * > existing query parameters (e.g. ordering) when navigating between pages, so
 * > the listing page must render `<BlogListClient />` inside a `<Suspense>`
 * > boundary to satisfy the Next.js static-prerender requirement.
 */
export interface BlogListClientProps {
  /** Already-ordered, already-paginated published posts for the current page. */
  posts: Post[];
  /** All available categories, used to resolve names and build navigation. */
  categories: Category[];
  /** Zero-based index of the current page. */
  pageIndex: number;
  /** Total number of pages for the full ordered list. */
  totalPages: number;
}

/** Formateador de fecha en español: «12 de marzo de 2025». */
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Formatea una fecha de publicación (epoch ms) en español; vacío si es null. */
function formatPublishedAt(publishedAt: number | null): string {
  if (publishedAt === null) {
    return "";
  }
  return dateFormatter.format(new Date(publishedAt));
}

export default function BlogListClient({
  posts,
  categories,
  pageIndex,
  totalPages,
}: BlogListClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolución de `categoryId` -> nombre, para mostrar los nombres de las
  // categorías de cada entrada (Req 1.7).
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  // Construye un href de paginación preservando el resto de parámetros de
  // consulta (p. ej. el orden), cambiando únicamente `page` (1-based en la URL).
  const buildPageHref = (oneBasedPage: number): string => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("page", String(oneBasedPage));
    return `${pathname}?${params.toString()}`;
  };

  // Construye un href de categoría preservando el orden (resto de parámetros),
  // reiniciando la paginación al cambiar de categoría.
  const buildCategoryHref = (categoryId: string): string => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("page");
    const query = params.toString();
    return `/blog/categoria/${categoryId}${query ? `?${query}` : ""}`;
  };

  // Página actual en base 1 para mostrar, y disponibilidad de prev/next.
  const currentPage = pageIndex + 1;
  const hasPrev = pageIndex > 0;
  const hasNext = pageIndex < totalPages - 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Navegación por categorías (Req 1.7): enlaces que preservan el orden. */}
      {categories.length > 0 && (
        <nav aria-label="Categorías del blog">
          <div className="flex items-center gap-2 flex-wrap">
            <TagsOutlined className="text-[#4a9eda]" />
            <Text className="text-gray-400 mr-1">Categorías:</Text>
            {categories.map((category) => (
              <Link key={category.id} href={buildCategoryHref(category.id)}>
                <Tag className="cursor-pointer m-0" color="blue">
                  {category.name}
                </Tag>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Listado de entradas de la página actual. El mensaje de listado vacío
          es responsabilidad de la página servidor (task 4.3, Req 1.11). */}
      {posts.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-gray-500">No hay entradas disponibles.</span>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4 list-none p-0 m-0">
          {posts.map((post) => (
            <li key={post.id}>
              <Card size="small" className="bg-[#0a1929]/80">
                <article className="flex flex-col gap-2">
                  {/* Título enlazado al detalle de la entrada (Req 1.5). */}
                  <Link href={`/blog/${post.slug}`}>
                    <Title
                      level={3}
                      className="mb-0! text-[#9ED0FA]! hover:text-[#c5e4fc]! transition-colors"
                    >
                      {post.title}
                    </Title>
                  </Link>

                  {/* Fecha de publicación en español (Req 1.6). */}
                  <Text className="text-gray-400 flex items-center gap-2">
                    <CalendarOutlined className="text-[#4a9eda]" />
                    <time
                      dateTime={
                        post.publishedAt !== null
                          ? new Date(post.publishedAt).toISOString()
                          : undefined
                      }
                    >
                      {formatPublishedAt(post.publishedAt)}
                    </time>
                  </Text>

                  {/* Nombres de las categorías asociadas, enlazadas a su
                      listado por categoría (Req 1.7). */}
                  {post.categoryIds.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.categoryIds.map((categoryId) => {
                        const name = categoryNameById.get(categoryId);
                        if (name === undefined) {
                          return null;
                        }
                        return (
                          <Link
                            key={categoryId}
                            href={buildCategoryHref(categoryId)}
                          >
                            <Tag className="cursor-pointer m-0">{name}</Tag>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </article>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* Controles de paginación (Req 1.8, 1.9). «Anterior» se desactiva en la
          primera página y «Siguiente» en la última, preservando el orden. */}
      {totalPages > 1 && (
        <nav
          aria-label="Paginación del listado"
          className="flex items-center justify-between gap-4 flex-wrap"
        >
          <Space>
            {hasPrev ? (
              <Link href={buildPageHref(currentPage - 1)}>
                <Button icon={<LeftOutlined />}>Página anterior</Button>
              </Link>
            ) : (
              <Button icon={<LeftOutlined />} disabled>
                Página anterior
              </Button>
            )}

            {hasNext ? (
              <Link href={buildPageHref(currentPage + 1)}>
                <Button>
                  Página siguiente
                  <RightOutlined />
                </Button>
              </Link>
            ) : (
              <Button disabled>
                Página siguiente
                <RightOutlined />
              </Button>
            )}
          </Space>

          <Text className="text-gray-400">
            Página {currentPage} de {totalPages}
          </Text>
        </nav>
      )}
    </div>
  );
}
