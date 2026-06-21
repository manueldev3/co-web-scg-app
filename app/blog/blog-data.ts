// Acceso de lectura a Firestore para el Blog (capa de servidor).
//
// Este módulo lee Cloud Firestore mediante el Admin SDK (firebase-admin v14,
// API MODULAR: `firebase-admin/app`, `firebase-admin/firestore`) y devuelve los
// tipos de dominio de `app/blog/types.ts`. La lógica pura (ordenación, filtrado,
// selección de destacados) vive en `blog-engine.ts`; aquí solo se obtienen y
// mapean los datos.
//
// Es un módulo SOLO de servidor: importa `firebase-admin`, que no puede ejecutar
// en el navegador, por lo que cualquier intento de incluirlo en un bundle de
// cliente fallará en tiempo de compilación.
//
// --- Estrategia de caché (Restricción de plataforma, Next.js 16 modificado) ---
// El diseño pide «marcar el contenido publicado estable como cacheado». La
// directiva `use cache` de Next.js 16 (ver
// `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md`)
// es una característica de *Cache Components* y EXIGE `cacheComponents: true` en
// `next.config.ts`. Este proyecto NO habilita Cache Components (ver el steering
// `uex-corp-api.md`: «this project does NOT enable Cache Components, so the
// `revalidate` model applies») y otras rutas (`mercancia`, `mejor-ruta`)
// dependen del modelo `revalidate`. Por tanto, siguiendo la guía
// `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`
// («Caching and Revalidating (Previous Model)»), el contenido publicado estable
// se cachea con `unstable_cache` de `next/cache`, con etiquetas para invalidación
// bajo demanda (`revalidateTag`) desde las Server Actions de administración.
//
// Las métricas de administración (`getAdminMetricsData`) NO se cachean: deben
// reflejar el estado actual (incluye borradores) para el panel.

import { unstable_cache } from "next/cache";
import {
  getFirestore,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import initFirebase from "@/lib/firebase/admin";
import { FEATURED_TOTAL, selectFeatured } from "./blog-engine";
import type { Category, Comment, Like, Post } from "./types";

// ---------------------------------------------------------------------------
// Configuración de caché
// ---------------------------------------------------------------------------

/** Etiqueta de caché para el contenido de entradas publicadas (invalidación). */
export const BLOG_POSTS_TAG = "blog-posts";

/** Etiqueta de caché para las categorías (invalidación). */
export const BLOG_CATEGORIES_TAG = "blog-categories";

/**
 * Frecuencia de revalidación (segundos) del contenido publicado estable. Cinco
 * minutos equilibra frescura y coste de lectura; las mutaciones del panel
 * invalidan de inmediato mediante `revalidateTag`.
 */
const BLOG_CACHE_REVALIDATE_SECONDS = 300;

// ---------------------------------------------------------------------------
// Utilidades de acceso e mapeo
// ---------------------------------------------------------------------------

/** Inicializa el Admin SDK (idempotente) y devuelve la instancia de Firestore. */
function db() {
  initFirebase();
  return getFirestore();
}

/**
 * Convierte un valor de Firestore (Timestamp, Date o número) a epoch ms.
 * Devuelve `null` cuando el valor no representa una fecha válida.
 */
function toMillisOrNull(value: unknown): number | null {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

/** Igual que `toMillisOrNull` pero con 0 como valor por defecto seguro. */
function toMillis(value: unknown): number {
  return toMillisOrNull(value) ?? 0;
}

/** Normaliza un contador denormalizado a un entero >= 0. */
function toNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return 0;
}

/** Extrae un arreglo de cadenas, descartando valores no string. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

/** Mapea un documento de `posts/{id}` al tipo de dominio `Post`. */
function mapPost(id: string, data: Record<string, unknown>): Post {
  return {
    id,
    // Si la entrada no tiene slug, se usa su id como segmento de ruta.
    slug:
      typeof data.slug === "string" && data.slug.length > 0 ? data.slug : id,
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    status: data.status === "publicada" ? "publicada" : "borrador",
    publishedAt: toMillisOrNull(data.publishedAt),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    categoryIds: toStringArray(data.categoryIds),
    commentCount: toNonNegativeInt(data.commentCount),
    likeCount: toNonNegativeInt(data.likeCount),
  };
}

/** Mapea un documento de `categories/{id}` al tipo de dominio `Category`. */
function mapCategory(id: string, data: Record<string, unknown>): Category {
  const name = typeof data.name === "string" ? data.name : "";
  return {
    id,
    name,
    nameLower:
      typeof data.nameLower === "string" ? data.nameLower : name.toLowerCase(),
  };
}

/** Mapea un documento de `posts/{postId}/comments/{id}` a `Comment`. */
function mapComment(doc: QueryDocumentSnapshot): Comment {
  const data = doc.data() as Record<string, unknown>;
  const parentPostId = doc.ref.parent.parent?.id;
  return {
    id: doc.id,
    postId:
      typeof data.postId === "string" ? data.postId : (parentPostId ?? ""),
    authorId: typeof data.authorId === "string" ? data.authorId : "",
    content: typeof data.content === "string" ? data.content : "",
    createdAt: toMillis(data.createdAt),
  };
}

/** Mapea un documento de `posts/{postId}/likes/{userId}` a `Like`. */
function mapLike(doc: QueryDocumentSnapshot): Like {
  const data = doc.data() as Record<string, unknown>;
  const parentPostId = doc.ref.parent.parent?.id;
  return {
    postId:
      typeof data.postId === "string" ? data.postId : (parentPostId ?? ""),
    // El id del documento de like es el uid del usuario (máx. 1 like/usuario).
    userId: typeof data.userId === "string" ? data.userId : doc.id,
    createdAt: toMillis(data.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Lecturas internas (sin caché)
// ---------------------------------------------------------------------------

/** Lee todas las entradas en estado `publicada`. */
async function fetchPublishedPosts(): Promise<Post[]> {
  const snapshot = await db()
    .collection("posts")
    .where("status", "==", "publicada")
    .get();
  return snapshot.docs.map((doc) =>
    mapPost(doc.id, doc.data() as Record<string, unknown>),
  );
}

/**
 * Resuelve una entrada publicada por slug. Busca primero por el campo `slug` y,
 * si no hay coincidencia, intenta el documento cuyo id coincide con el slug.
 * Devuelve `null` si no existe o si su estado es `borrador`.
 */
async function fetchPublishedPostBySlug(slug: string): Promise<Post | null> {
  const database = db();

  const bySlug = await database
    .collection("posts")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!bySlug.empty) {
    const doc = bySlug.docs[0];
    const post = mapPost(doc.id, doc.data() as Record<string, unknown>);
    return post.status === "publicada" ? post : null;
  }

  const byId = await database.collection("posts").doc(slug).get();
  const data = byId.data();
  if (!byId.exists || data === undefined) {
    return null;
  }
  const post = mapPost(byId.id, data as Record<string, unknown>);
  return post.status === "publicada" ? post : null;
}

/** Lee todas las categorías. */
async function fetchCategories(): Promise<Category[]> {
  const snapshot = await db().collection("categories").get();
  return snapshot.docs.map((doc) =>
    mapCategory(doc.id, doc.data() as Record<string, unknown>),
  );
}

/** Calcula las entradas destacadas a partir de las publicadas (Req 11.3). */
async function computeFeaturedPosts(): Promise<Post[]> {
  const published = await fetchPublishedPosts();
  return selectFeatured(published, FEATURED_TOTAL);
}

// ---------------------------------------------------------------------------
// API pública (contenido publicado estable cacheado con unstable_cache)
// ---------------------------------------------------------------------------

const getPublishedPostsCached = unstable_cache(
  fetchPublishedPosts,
  ["blog", "published-posts"],
  { tags: [BLOG_POSTS_TAG], revalidate: BLOG_CACHE_REVALIDATE_SECONDS },
);

const getPublishedPostBySlugCached = unstable_cache(
  (slug: string) => fetchPublishedPostBySlug(slug),
  ["blog", "published-post-by-slug"],
  { tags: [BLOG_POSTS_TAG], revalidate: BLOG_CACHE_REVALIDATE_SECONDS },
);

const getCategoriesCached = unstable_cache(
  fetchCategories,
  ["blog", "categories"],
  { tags: [BLOG_CATEGORIES_TAG], revalidate: BLOG_CACHE_REVALIDATE_SECONDS },
);

const getFeaturedPostsCached = unstable_cache(
  computeFeaturedPosts,
  ["blog", "featured-posts"],
  { tags: [BLOG_POSTS_TAG], revalidate: BLOG_CACHE_REVALIDATE_SECONDS },
);

/** Devuelve todas las entradas publicadas (Req 1.1). Contenido estable cacheado. */
export async function getPublishedPosts(): Promise<Post[]> {
  return getPublishedPostsCached();
}

/**
 * Devuelve la entrada publicada con el slug dado, o `null` si no existe o está
 * en `borrador` (Req 2.6, 2.7). Contenido estable cacheado por slug.
 */
export async function getPublishedPostBySlug(
  slug: string,
): Promise<Post | null> {
  return getPublishedPostBySlugCached(slug);
}

/** Devuelve todas las categorías. Contenido estable cacheado. */
export async function getCategories(): Promise<Category[]> {
  return getCategoriesCached();
}

/** Devuelve las entradas destacadas (usa `selectFeatured` con `FEATURED_TOTAL`). */
export async function getFeaturedPosts(): Promise<Post[]> {
  return getFeaturedPostsCached();
}

/**
 * Datos para las métricas del panel de administración (Req 7.5). NO se cachea:
 * incluye todas las entradas (también borradores), comentarios y «me gusta»
 * actuales para que el Dashboard refleje el estado real.
 */
export async function getAdminMetricsData(): Promise<{
  posts: Post[];
  comments: Comment[];
  likes: Like[];
}> {
  const database = db();
  const [postsSnapshot, commentsSnapshot, likesSnapshot] = await Promise.all([
    database.collection("posts").get(),
    database.collectionGroup("comments").get(),
    database.collectionGroup("likes").get(),
  ]);

  return {
    posts: postsSnapshot.docs.map((doc) =>
      mapPost(doc.id, doc.data() as Record<string, unknown>),
    ),
    comments: commentsSnapshot.docs.map(mapComment),
    likes: likesSnapshot.docs.map(mapLike),
  };
}
