import { Suspense } from "react";
import {
  getFirestore,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import initFirebase from "@/lib/firebase/admin";
import EntradasManagerClient from "@/app/admin/entradas/EntradasManagerClient";
import type { Category, Post, PublicationStatus } from "@/app/blog/types";

// Gestión de Entradas y Categorías del Panel_Admin (`/admin/entradas`).
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Documentación consultada en `node_modules/next/dist/docs/`:
//
// 1. `01-app/01-getting-started/05-server-and-client-components.md`: esta página
//    es un **Server Component**. Lee TODAS las entradas (incluidos borradores) y
//    todas las categorías con el Admin SDK (`firebase-admin/firestore`, solo
//    servidor) y entrega resultados serializables (`Post[]`, `Category[]`) al
//    Client Component `EntradasManagerClient`, que gestiona los formularios
//    (crear / editar / publicar / eliminar entradas y categorías) con
//    `useActionState` sobre las Server Actions de `lib/blog/actions.ts`. El
//    Admin SDK NUNCA llega al bundle del cliente.
//
// 2. `01-app/02-guides/instant-navigation.md` (streaming con `<Suspense>`): la
//    lectura de entradas y categorías se aísla en un componente servidor
//    asíncrono envuelto en `<Suspense>` para transmitir un indicador de carga
//    mientras se consulta Firestore.
//
// 3. La lista del panel NO se cachea (se lee fresca en cada visita) porque debe
//    mostrar borradores y reflejar de inmediato altas/ediciones/publicaciones.
//    Las Server Actions de entradas/categorías invalidan la caché del contenido
//    público con `updateTag`; además, el Client Component llama a
//    `router.refresh()` tras cada mutación para re-renderizar esta página en el
//    servidor y actualizar la lista no cacheada sin recarga manual. El layout de
//    `/admin` (`app/admin/layout.tsx`) ya exporta `unstable_instant = false` y
//    verifica el claim de administrador (Req 6.4, 6.8), de modo que esta vista
//    solo se renderiza para administradores.
//
// Reparto de responsabilidades respecto a los requisitos:
//   - Req 10.1: lista de entradas ordenada por fecha desc con título, estado,
//     fecha y categorías.
//   - Req 10.2-10.5, 10.9, 10.12: crear / editar / publicar / eliminar entradas.
//   - Req 10.6-10.8: crear / eliminar categorías.
//   - Req 10.11: mensaje en español cuando no hay entradas.

/** Paleta del tema oscuro del panel (coincide con el resto de vistas admin). */
const CARD_BG = "bg-[#0F2C3E]";
const ACCENT = "text-[#9ED0FA]";

/** Inicializa el Admin SDK (idempotente) y devuelve la instancia de Firestore. */
function db() {
  initFirebase();
  return getFirestore();
}

/** Convierte un valor de Firestore (Timestamp/Date/número) a epoch ms o null. */
function toMillisOrNull(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
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
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** Normaliza el estado leído de Firestore a un `PublicationStatus` válido. */
function toStatus(value: unknown): PublicationStatus {
  return value === "publicada" ? "publicada" : "borrador";
}

/** Mapea un documento de `posts/{id}` al tipo de dominio `Post`. */
function mapPost(doc: QueryDocumentSnapshot): Post {
  const data = doc.data() as Record<string, unknown>;
  return {
    id: doc.id,
    slug:
      typeof data.slug === "string" && data.slug.length > 0
        ? data.slug
        : doc.id,
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    status: toStatus(data.status),
    publishedAt: toMillisOrNull(data.publishedAt),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    categoryIds: toStringArray(data.categoryIds),
    commentCount: toNonNegativeInt(data.commentCount),
    likeCount: toNonNegativeInt(data.likeCount),
  };
}

/** Mapea un documento de `categories/{id}` al tipo de dominio `Category`. */
function mapCategory(doc: QueryDocumentSnapshot): Category {
  const data = doc.data() as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name : "";
  return {
    id: doc.id,
    name,
    nameLower:
      typeof data.nameLower === "string" ? data.nameLower : name.toLowerCase(),
  };
}

/**
 * Fecha representativa de una entrada para la ordenación del listado (Req 10.1):
 * la fecha de publicación si la entrada está publicada y, en su defecto (los
 * borradores tienen `publishedAt = null`), la última actualización o creación.
 */
function entryDate(post: Post): number {
  return post.publishedAt ?? post.updatedAt ?? post.createdAt;
}

/**
 * Lee TODAS las entradas (incluidos borradores) ordenadas por fecha descendente
 * (Req 10.1). La ordenación se hace en memoria porque los borradores tienen
 * `publishedAt = null` y combinar campos de fecha en una consulta de Firestore
 * sería frágil; el volumen del panel lo permite.
 */
async function fetchAllPosts(): Promise<Post[]> {
  const snapshot = await db().collection("posts").get();
  return snapshot.docs.map(mapPost).sort((a, b) => entryDate(b) - entryDate(a));
}

/** Lee todas las categorías ordenadas por nombre (ascendente). */
async function fetchAllCategories(): Promise<Category[]> {
  const snapshot = await db().collection("categories").get();
  return snapshot.docs
    .map(mapCategory)
    .sort((a, b) => a.nameLower.localeCompare(b.nameLower));
}

/**
 * Componente servidor asíncrono que lee entradas y categorías de Firestore y
 * monta el Client Component de gestión. Si la lectura falla, muestra un mensaje
 * de error en español sin renderizar una lista parcial.
 */
async function EntradasPanel() {
  let posts: Post[];
  let categories: Category[];
  try {
    [posts, categories] = await Promise.all([
      fetchAllPosts(),
      fetchAllCategories(),
    ]);
  } catch {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-200"
      >
        <p className="font-semibold text-red-100">
          No se pudieron cargar las entradas
        </p>
        <p className="mt-1">
          No fue posible obtener las entradas y categorías desde el almacén de
          datos. Vuelve a intentarlo más tarde.
        </p>
      </div>
    );
  }

  return <EntradasManagerClient posts={posts} categories={categories} />;
}

/**
 * Página de gestión de Entradas y Categorías del Panel_Admin. Server Component
 * que compone la lectura tras un límite `<Suspense>` para transmitir un
 * indicador de carga mientras se consulta Firestore.
 */
export default function AdminEntradasPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className={`mb-1 text-2xl font-bold ${ACCENT}`}>
          Gestión de entradas
        </h2>
        <p className="mb-0 text-sm text-gray-400">
          Entradas del Blog y sus categorías: creación, edición, publicación y
          eliminación.
        </p>
      </div>

      <Suspense
        fallback={
          <div className={`rounded-lg ${CARD_BG} p-6 text-gray-300 shadow-xl`}>
            <span aria-label="Cargando entradas">Cargando entradas…</span>
          </div>
        }
      >
        <EntradasPanel />
      </Suspense>
    </div>
  );
}
