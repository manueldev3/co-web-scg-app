"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "antd";
import {
  ReadOutlined,
  CommentOutlined,
  LikeOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { featuredCountForWidth } from "../blog/blog-engine";
import type { Post } from "../blog/types";
import { getFeaturedPostsAction } from "@/lib/blog/featured-actions";

/**
 * Seccion_Destacados — primera sección de la página de inicio (Req 11.1).
 *
 * Es un Client Component (`"use client"`) por dos motivos:
 *  - Necesita el ancho de la ventana gráfica para decidir cuántas entradas
 *    mostrar con {@link featuredCountForWidth}: 3 (≥1024), 2 (768–1023) o 1
 *    (<768), reaccionando a los cambios de tamaño (Req 11.6, 11.7, 11.8).
 *  - Obtiene los datos server-only de Firestore a través de la Server Action
 *    `getFeaturedPostsAction`, ya que `app/page.tsx` es también un Client
 *    Component y no puede importar el acceso a datos del servidor.
 *
 * La selección (más reciente + top por comentarios, sin repetir) la realiza
 * `selectFeatured` en el servidor; aquí solo se recorta la lista ya ordenada al
 * número responsive, mostrando la entrada más reciente con mayor tamaño visual
 * (Req 11.2) y sin huecos de relleno cuando hay menos entradas (Req 11.9). Si no
 * hay ninguna entrada publicada se muestra un mensaje en español (Req 11.10).
 */
const HomeFeaturedBlog: React.FC = () => {
  // `null` mientras la carga inicial está en curso; un arreglo cuando llega la
  // respuesta (posiblemente vacío si no hay publicadas o si la lectura falla).
  const [posts, setPosts] = useState<Post[] | null>(null);
  // `null` hasta que conocemos el ancho real en el cliente (evita desajustes de
  // hidratación al depender de `window`).
  const [count, setCount] = useState<1 | 2 | 3 | null>(null);

  // Conteo responsive: se calcula tras el montaje y se actualiza al redimensionar.
  useEffect(() => {
    const update = () => setCount(featuredCountForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Carga de las entradas destacadas mediante la Server Action.
  useEffect(() => {
    let active = true;
    getFeaturedPostsAction()
      .then((result) => {
        if (active) setPosts(result);
      })
      .catch(() => {
        if (active) setPosts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const loading = posts === null || count === null;

  return (
    <section className="px-6 lg:px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F2C3E] text-2xl text-[#9ED0FA]">
            <ReadOutlined />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Destacados del blog
          </h2>
          <p className="mt-3 text-gray-300 max-w-3xl mx-auto lg:text-lg">
            Lo más reciente y lo más comentado del blog de SCG. Ponte al día con
            las entradas que están marcando la conversación.
          </p>
        </div>

        <div className="mt-10">
          {loading ? (
            <FeaturedSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState />
          ) : (
            <FeaturedGrid posts={posts.slice(0, count)} />
          )}
        </div>
      </div>
    </section>
  );
};

/** Cuadrícula de destacados: la primera (más reciente) ocupa mayor tamaño. */
const FeaturedGrid: React.FC<{ posts: Post[] }> = ({ posts }) => {
  const [featured, ...rest] = posts;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Entrada más reciente con tamaño visual mayor (Req 11.2). Ocupa las dos
          primeras columnas en escritorio cuando hay más entradas. */}
      <FeaturedCard
        post={featured}
        large
        className={rest.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}
      />

      {/* Resto de destacados (top por comentarios) en tamaño estándar. */}
      {rest.map((post) => (
        <FeaturedCard key={post.id} post={post} />
      ))}
    </div>
  );
};

interface FeaturedCardProps {
  post: Post;
  large?: boolean;
  className?: string;
}

/** Tarjeta de una entrada destacada con enlace a su detalle. */
const FeaturedCard: React.FC<FeaturedCardProps> = ({
  post,
  large = false,
  className = "",
}) => {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col rounded-2xl border border-[#143A52] bg-[#071421] no-underline transition-colors hover:border-[#1e4a6e] hover:bg-[#0a1b2b] ${
        large ? "p-6 lg:p-10" : "p-6"
      } ${className}`}
    >
      {large && (
        <span className="text-sm font-semibold uppercase tracking-wide text-[#4a9eda]">
          Entrada más reciente
        </span>
      )}

      <h3
        className={`mt-1 font-bold text-white ${
          large ? "text-2xl lg:text-3xl" : "text-xl"
        }`}
      >
        {post.title}
      </h3>

      {post.publishedAt !== null && (
        <time
          className="mt-2 text-sm text-gray-400"
          dateTime={new Date(post.publishedAt).toISOString()}
        >
          {formatPublishedDate(post.publishedAt)}
        </time>
      )}

      {large && (
        <p className="mt-3 text-gray-300 lg:text-lg line-clamp-3">
          {buildExcerpt(post.content)}
        </p>
      )}

      <div className="mt-4 flex items-center gap-5 text-sm text-gray-300">
        <span className="inline-flex items-center gap-1.5">
          <CommentOutlined className="text-[#9ED0FA]" />
          {post.commentCount}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LikeOutlined className="text-[#9ED0FA]" />
          {post.likeCount}
        </span>
      </div>

      <span className="mt-4 inline-flex items-center gap-2 font-semibold text-[#9ED0FA]">
        Leer entrada
        <ArrowRightOutlined className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
};

/** Mensaje en español cuando no hay ninguna entrada publicada (Req 11.10). */
const EmptyState: React.FC = () => (
  <div className="mx-auto max-w-2xl rounded-2xl border border-[#143A52] bg-[#071421] p-8 text-center lg:p-12">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F2C3E] text-2xl text-[#9ED0FA]">
      <ReadOutlined />
    </div>
    <p className="text-gray-300 lg:text-lg">
      Aún no hay entradas en el blog. Vuelve pronto para descubrir el primer
      contenido.
    </p>
  </div>
);

/** Indicador de carga mientras se obtienen las entradas y el ancho de ventana. */
const FeaturedSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div className="rounded-2xl border border-[#143A52] bg-[#071421] p-6 lg:col-span-2 lg:p-10">
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
    <div className="rounded-2xl border border-[#143A52] bg-[#071421] p-6">
      <Skeleton active paragraph={{ rows: 2 }} />
    </div>
  </div>
);

/** Formatea una fecha epoch (ms) en español (ej.: «3 de marzo de 2025»). */
function formatPublishedDate(publishedAt: number): string {
  return new Date(publishedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Genera un breve extracto del contenido para la tarjeta grande. */
function buildExcerpt(content: string, maxLength = 180): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

export default HomeFeaturedBlog;
