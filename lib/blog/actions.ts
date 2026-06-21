"use server";

// Server Actions de contenido del Blog: comentarios y «me gusta».
//
// Plataforma (Next.js 16 modificado), consultado en
// `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`:
//   - Una Server Action es una función asíncrona marcada con la directiva
//     `"use server"` (aquí a nivel de módulo). Es invocable mediante POST y, por
//     tanto, ALCANZABLE DIRECTAMENTE sin pasar por la UI: por eso cada acción
//     verifica autenticación/autorización en su interior antes de mutar.
//   - Tras mutar se invalida la caché con `updateTag` (las lecturas publicadas
//     estables de `blog-data.ts` están etiquetadas con `BLOG_POSTS_TAG`).
//     `updateTag` solo es válido en Server Actions y expira la caché de inmediato
//     (read-your-own-writes), de modo que el autor ve su propio cambio sin
//     contenido obsoleto. La forma de un solo argumento de `revalidateTag` quedó
//     OBSOLETA en este Next.js modificado y `updateTag` es su sustituto en
//     acciones. No usamos `refresh()` porque el contador mostrado en el detalle
//     proviene de datos cacheados por etiqueta, no del router de cliente.
//   - Los errores ESPERADOS (no autenticado, validación, entrada inexistente) se
//     devuelven como VALOR de estado (patrón `useActionState`), no como
//     excepciones. Solo los fallos inesperados (p. ej. error de Firestore) se
//     propagan al `error.tsx` más cercano.
//
// Firebase Admin SDK v14 (API MODULAR): `firebase-admin/firestore` expone
// `getFirestore`, `FieldValue`, `Timestamp` y `runTransaction` (vía
// `getFirestore().runTransaction`). Los contadores denormalizados
// (`commentCount`, `likeCount`) se actualizan DENTRO de una transacción junto
// con la escritura del comentario/like para mantenerlos consistentes.

import { refresh, updateTag } from "next/cache";
import {
  getFirestore,
  FieldValue,
  Timestamp,
  type Transaction,
  type DocumentSnapshot,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import initFirebase from "@/lib/firebase/admin";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/blog/session";
import {
  CATEGORY_NAME_MAX,
  isCategoryNameTaken,
  validateCommentContent,
  validatePost,
} from "@/app/blog/blog-engine";
import { BLOG_CATEGORIES_TAG, BLOG_POSTS_TAG } from "@/app/blog/blog-data";
import type { Category, UserRole } from "@/app/blog/types";
import type {
  CategoryActionState,
  CommentActionState,
  ToggleLikeResult,
  PostActionState,
  PostFieldError,
  UserActionState,
} from "@/lib/blog/action-types";

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Inicializa el Admin SDK (idempotente) y devuelve la instancia de Firestore. */
function db() {
  initFirebase();
  return getFirestore();
}

/** Normaliza un contador denormalizado leído de Firestore a un entero >= 0. */
function toNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return 0;
}

/** Indica si un documento de entrada existe y está en estado `publicada`. */
function isPublishedPost(snap: DocumentSnapshot): boolean {
  if (!snap.exists) return false;
  const data = snap.data() as Record<string, unknown> | undefined;
  return data?.status === "publicada";
}

// ---------------------------------------------------------------------------
// createComment
// ---------------------------------------------------------------------------

/**
 * Crea un comentario sobre una entrada publicada (Req 4.2, 4.5, 4.6, 4.7).
 *
 * Flujo:
 *  1. Verifica la sesión con `getCurrentUser`. Si no hay sesión, NO escribe y
 *     devuelve un estado de error en español pidiendo iniciar sesión (Req 4.5).
 *  2. Valida el contenido con `validateCommentContent` (Req 4.6, 4.7):
 *     - `vacio` → «El contenido es obligatorio.»
 *     - `excede_limite` → «Se superó el límite de 2000 caracteres.»
 *  3. Guarda el comentario en `posts/{postId}/comments` con `postId`,
 *     `authorId` (uid), `content` y `createdAt`, e incrementa de forma
 *     TRANSACCIONAL el contador `commentCount` de la entrada (Req 4.2).
 *
 * @param _state Estado previo (no se usa; requerido por `useActionState`).
 * @param formData Debe incluir los campos `postId` y `content`.
 */
export async function createComment(
  _state: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  // 1) Autenticación: las Server Actions son alcanzables por POST directo.
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      error: "Debes iniciar sesión para comentar.",
    };
  }

  const postId = String(formData.get("postId") ?? "").trim();
  if (postId.length === 0) {
    return { ok: false, error: "No se pudo identificar la entrada." };
  }

  // 2) Validación de contenido (longitud efectiva tras recorte, Req 4.6/4.7).
  const rawContent = String(formData.get("content") ?? "");
  const validation = validateCommentContent(rawContent);
  if (!validation.ok) {
    const error =
      validation.error === "vacio"
        ? "El contenido es obligatorio."
        : "Se superó el límite de 2000 caracteres.";
    return { ok: false, error };
  }

  // 3) Escritura transaccional: crea el comentario e incrementa el contador.
  const database = db();
  const postRef = database.collection("posts").doc(postId);
  const commentRef = postRef.collection("comments").doc();

  try {
    await database.runTransaction(async (tx: Transaction) => {
      const postSnap = await tx.get(postRef);
      if (!isPublishedPost(postSnap)) {
        // Error esperado de control: se traduce a estado de error abajo.
        throw new PostUnavailableError();
      }

      tx.set(commentRef, {
        postId,
        authorId: user.uid,
        content: validation.value,
        createdAt: Timestamp.now(),
      });
      // Contador denormalizado: incremento atómico dentro de la transacción.
      tx.update(postRef, { commentCount: FieldValue.increment(1) });
    });
  } catch (err: unknown) {
    if (err instanceof PostUnavailableError) {
      return { ok: false, error: "La entrada no está disponible." };
    }
    // Fallo inesperado de Firestore → burbujea al error.tsx más cercano.
    throw err;
  }

  // Invalida el contenido publicado cacheado (incluye `commentCount`).
  // `updateTag` (solo válido en Server Actions) expira de inmediato la caché
  // etiquetada para que el autor vea su propio comentario reflejado en los
  // contadores sin contenido obsoleto (patrón read-your-own-writes, Next 16).
  updateTag(BLOG_POSTS_TAG);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// toggleLikeAction
// ---------------------------------------------------------------------------

/**
 * Conmuta el «me gusta» del usuario actual sobre una entrada (Req 5.4-5.8).
 *
 * El documento de like vive en `posts/{postId}/likes/{userId}` (el id del
 * documento es el uid del usuario, lo que garantiza estructuralmente un único
 * like por usuario y entrada, Req 5.6). La operación es TRANSACCIONAL:
 *  - Si el usuario aún no había dado like: crea el documento y suma 1 al
 *    `likeCount` → devuelve `liked: true` (Req 5.4).
 *  - Si ya lo había dado: elimina el documento y resta 1 al `likeCount`
 *    (sin bajar de 0) → devuelve `liked: false` (Req 5.5).
 *
 * @param postId Identificador de la entrada sobre la que se conmuta el like.
 */
export async function toggleLikeAction(
  postId: string,
): Promise<ToggleLikeResult> {
  // 1) Autenticación (Req 5.7): sin sesión no se modifica el contador.
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      error: "Debes iniciar sesión para dar me gusta.",
    };
  }

  const normalizedPostId = (postId ?? "").trim();
  if (normalizedPostId.length === 0) {
    return { ok: false, error: "No se pudo identificar la entrada." };
  }

  const database = db();
  const postRef = database.collection("posts").doc(normalizedPostId);
  const likeRef = postRef.collection("likes").doc(user.uid);

  try {
    const result = await database.runTransaction(
      async (tx: Transaction): Promise<{ liked: boolean; count: number }> => {
        // Las lecturas deben preceder a las escrituras en una transacción.
        const [postSnap, likeSnap] = await Promise.all([
          tx.get(postRef),
          tx.get(likeRef),
        ]);

        if (!isPublishedPost(postSnap)) {
          throw new PostUnavailableError();
        }

        const currentCount = toNonNegativeInt(
          (postSnap.data() as Record<string, unknown>).likeCount,
        );

        if (likeSnap.exists) {
          // Ya existía → eliminar y decrementar (sin bajar de 0).
          const newCount = Math.max(0, currentCount - 1);
          tx.delete(likeRef);
          tx.update(postRef, { likeCount: newCount });
          return { liked: false, count: newCount };
        }

        // No existía → crear y incrementar.
        const newCount = currentCount + 1;
        tx.set(likeRef, {
          postId: normalizedPostId,
          userId: user.uid,
          createdAt: Timestamp.now(),
        });
        tx.update(postRef, { likeCount: newCount });
        return { liked: true, count: newCount };
      },
    );

    // Invalida el contenido publicado cacheado (incluye `likeCount`).
    // `updateTag` expira de inmediato la caché etiquetada (read-your-own-writes).
    updateTag(BLOG_POSTS_TAG);

    return { ok: true, liked: result.liked, count: result.count };
  } catch (err: unknown) {
    if (err instanceof PostUnavailableError) {
      return { ok: false, error: "La entrada no está disponible." };
    }
    // Fallo inesperado de la transacción (Req 5.8): el llamador conserva el
    // estado previo y muestra el mensaje en español.
    return {
      ok: false,
      error: "No se pudo completar la operación. Inténtalo de nuevo.",
    };
  }
}

// ---------------------------------------------------------------------------
// Errores internos de control de flujo
// ---------------------------------------------------------------------------

/** Señaliza, dentro de una transacción, que la entrada no existe o es borrador. */
class PostUnavailableError extends Error {
  constructor() {
    super("post-unavailable");
    this.name = "PostUnavailableError";
  }
}

// ---------------------------------------------------------------------------
// Gestión de entradas del Panel_Admin (Req 10.2, 10.3, 10.4, 10.5, 10.9, 10.12)
// ---------------------------------------------------------------------------
//
// Todas las acciones verifican el custom claim de administrador con
// `isCurrentUserAdmin()` ANTES de mutar (doble línea de defensa: las Reglas de
// Firestore vuelven a validarlo). Como son alcanzables por POST directo, la
// verificación es imprescindible. Los errores esperados (no autorizado,
// validación, entrada inexistente) se devuelven como VALOR de estado
// (`PostActionState`, patrón `useActionState`); solo los fallos inesperados de
// Firestore se propagan. Tras mutar se invalida la caché etiquetada con
// `updateTag(BLOG_POSTS_TAG)` (sustituto de `revalidateTag` en este Next.js
// modificado), de modo que el panel y el contenido público reflejen el cambio.

/** Máximo de operaciones por `WriteBatch` admitido por Firestore. */
const POST_BATCH_LIMIT = 500;

/** Mensaje genérico en español para operaciones sin privilegios de admin. */
const UNAUTHORIZED_MESSAGE = "No tienes autorización para esta operación.";

/** Mensaje de error en español por cada campo inválido (Req 10.9, 10.12). */
function postFieldErrorMessage(field: PostFieldError): string {
  switch (field) {
    case "titulo":
      return "El título es obligatorio y no puede superar los 200 caracteres.";
    case "contenido":
      return "El contenido es obligatorio y no puede superar los 50000 caracteres.";
    case "categorias":
      // Req 10.12: se requiere al menos una categoría (y como máximo 10).
      return "Se requiere asociar al menos una categoría (máximo 10).";
  }
}

/** Campos editables de una entrada extraídos y normalizados del `FormData`. */
interface ParsedPostFields {
  title: string;
  content: string;
  categoryIds: string[];
}

/**
 * Extrae los campos de entrada del `FormData`. El título y el contenido se
 * recortan (un valor de solo espacios cuenta como vacío, Req 10.9) y las
 * categorías se leen con `getAll` (campo repetido en el formulario),
 * descartando valores en blanco.
 */
function parsePostFields(formData: FormData): ParsedPostFields {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const categoryIds = formData
    .getAll("categoryIds")
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
  return { title, content, categoryIds };
}

/** Sufijo aleatorio corto para desambiguar slugs duplicados. */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Convierte un título en un slug legible: sin diacríticos, en minúsculas y con
 * los caracteres no alfanuméricos sustituidos por guiones.
 */
function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina marcas diacríticas
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // no alfanumérico -> guion
    .replace(/^-+|-+$/g, ""); // recorta guiones de los extremos
}

/**
 * Genera un slug único para una entrada nueva. Parte de `slugify(title)`; si el
 * título no produce ningún carácter utilizable, usa una base con sufijo
 * aleatorio. Si ya existe una entrada con ese slug, añade un sufijo aleatorio
 * para garantizar unicidad del segmento de ruta.
 */
async function generateUniqueSlug(
  database: Firestore,
  title: string,
): Promise<string> {
  const base = slugify(title) || `entrada-${randomSuffix()}`;
  const existing = await database
    .collection("posts")
    .where("slug", "==", base)
    .limit(1)
    .get();
  return existing.empty ? base : `${base}-${randomSuffix()}`;
}

/** Lee y normaliza el `postId` del `FormData`; cadena vacía si falta. */
function readPostId(formData: FormData): string {
  return String(formData.get("postId") ?? "").trim();
}

/**
 * Crea una entrada en estado `borrador` (Req 10.2, 10.9, 10.12).
 *
 * Verifica el rol de administrador, valida título/contenido/categorías con
 * `validatePost` (devolviendo el primer campo inválido en español) y guarda la
 * entrada con un slug generado, contadores a 0 y `publishedAt = null`.
 *
 * Contrato de `formData`: `title` (string), `content` (string) y `categoryIds`
 * (campo repetido, una entrada por categoría seleccionada).
 */
export async function createPost(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const { title, content, categoryIds } = parsePostFields(formData);
  const validation = validatePost(title, content, categoryIds);
  if (!validation.ok) {
    return {
      ok: false,
      fieldError: validation.field,
      error: postFieldErrorMessage(validation.field),
    };
  }

  const database = db();
  const slug = await generateUniqueSlug(database, title);
  const now = Timestamp.now();
  const postRef = database.collection("posts").doc();

  await postRef.set({
    slug,
    title,
    content,
    status: "borrador", // Req 10.2: las entradas se crean como borrador.
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    categoryIds,
    commentCount: 0,
    likeCount: 0,
  });

  updateTag(BLOG_POSTS_TAG);
  return { ok: true, postId: postRef.id };
}

/**
 * Edita una entrada existente CONSERVANDO su `Estado_Publicacion` (Req 10.3).
 *
 * Verifica el rol de administrador, valida los campos y actualiza únicamente
 * `title`, `content`, `categoryIds` y `updatedAt`; no toca `status` ni
 * `publishedAt`.
 *
 * Contrato de `formData`: `postId` (string), `title`, `content` y `categoryIds`
 * (campo repetido).
 */
export async function updatePost(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const postId = readPostId(formData);
  if (postId.length === 0) {
    return { ok: false, error: "No se pudo identificar la entrada." };
  }

  const { title, content, categoryIds } = parsePostFields(formData);
  const validation = validatePost(title, content, categoryIds);
  if (!validation.ok) {
    return {
      ok: false,
      fieldError: validation.field,
      error: postFieldErrorMessage(validation.field),
    };
  }

  const database = db();
  const postRef = database.collection("posts").doc(postId);
  const snap = await postRef.get();
  if (!snap.exists) {
    return { ok: false, error: "La entrada no existe." };
  }

  // Se conservan `status` y `publishedAt` (Req 10.3): solo cambian los campos
  // editables del contenido.
  await postRef.update({
    title,
    content,
    categoryIds,
    updatedAt: Timestamp.now(),
  });

  updateTag(BLOG_POSTS_TAG);
  return { ok: true, postId };
}

/**
 * Publica una entrada: establece `status = publicada` y `publishedAt` a la fecha
 * y hora actuales (Req 10.4).
 *
 * Contrato de `formData`: `postId` (string).
 */
export async function publishPost(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const postId = readPostId(formData);
  if (postId.length === 0) {
    return { ok: false, error: "No se pudo identificar la entrada." };
  }

  const database = db();
  const postRef = database.collection("posts").doc(postId);
  const snap = await postRef.get();
  if (!snap.exists) {
    return { ok: false, error: "La entrada no existe." };
  }

  const now = Timestamp.now();
  await postRef.update({
    status: "publicada", // Req 10.4
    publishedAt: now, // fecha y hora actuales de publicación
    updatedAt: now,
  });

  updateTag(BLOG_POSTS_TAG);
  return { ok: true, postId };
}

/**
 * Elimina una entrada y CASCADEA el borrado a sus subcolecciones de comentarios
 * y «me gusta» (Req 10.5).
 *
 * Se leen todos los documentos de `comments` y `likes` y se eliminan, junto con
 * el documento de la entrada, en lotes (`WriteBatch`) de hasta 500 operaciones
 * (el máximo de Firestore) mediante el Admin SDK.
 *
 * Contrato de `formData`: `postId` (string).
 */
export async function deletePost(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const postId = readPostId(formData);
  if (postId.length === 0) {
    return { ok: false, error: "No se pudo identificar la entrada." };
  }

  const database = db();
  const postRef = database.collection("posts").doc(postId);

  // Se recopilan las referencias de todos los documentos a eliminar: los
  // comentarios, los «me gusta» y, por último, la propia entrada.
  const [commentsSnap, likesSnap] = await Promise.all([
    postRef.collection("comments").get(),
    postRef.collection("likes").get(),
  ]);

  const refs: DocumentReference[] = [
    ...commentsSnap.docs.map((doc) => doc.ref),
    ...likesSnap.docs.map((doc) => doc.ref),
    postRef,
  ];

  // Borrado por lotes: Firestore limita cada `WriteBatch` a 500 operaciones.
  for (let i = 0; i < refs.length; i += POST_BATCH_LIMIT) {
    const batch = database.batch();
    for (const ref of refs.slice(i, i + POST_BATCH_LIMIT)) {
      batch.delete(ref);
    }
    await batch.commit();
  }

  updateTag(BLOG_POSTS_TAG);
  return { ok: true, postId };
}

// ---------------------------------------------------------------------------
// Gestión de categorías del Panel_Admin (Req 10.6, 10.7, 10.8)
// ---------------------------------------------------------------------------
//
// Igual que las acciones de entradas, ambas verifican el custom claim de
// administrador con `isCurrentUserAdmin()` ANTES de mutar (las Reglas de
// Firestore vuelven a validarlo). Los errores esperados (no autorizado,
// validación, nombre duplicado) se devuelven como VALOR de estado
// (`CategoryActionState`, patrón `useActionState`); solo los fallos inesperados
// de Firestore se propagan. Tras mutar se invalida la caché etiquetada con
// `updateTag` (sustituto de `revalidateTag` en este Next.js modificado).

/** Mapea un documento de `categories/{id}` al tipo de dominio `Category`. */
function mapCategoryDoc(id: string, data: Record<string, unknown>): Category {
  const name = typeof data.name === "string" ? data.name : "";
  return {
    id,
    name,
    nameLower:
      typeof data.nameLower === "string" ? data.nameLower : name.toLowerCase(),
  };
}

/**
 * Crea una categoría (Req 10.6, 10.7).
 *
 * Flujo:
 *  1. Verifica el rol de administrador. Sin privilegios NO escribe y devuelve un
 *     estado de error en español.
 *  2. Valida la longitud del nombre (1..`CATEGORY_NAME_MAX` = 50) tras recortar
 *     espacios (Req 10.6).
 *  3. Lee las categorías existentes y rechaza el nombre duplicado con
 *     `isCategoryNameTaken` (insensible a may/min), conservando la categoría
 *     existente sin cambios y devolviendo «el nombre ya existe» (Req 10.7).
 *  4. Guarda la categoría con `name` y `nameLower` (`name.toLowerCase()`) e
 *     invalida la caché de categorías.
 *
 * Contrato de `formData`: `name` (string).
 */
export async function createCategory(
  _state: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const name = String(formData.get("name") ?? "").trim();

  // Validación de longitud (Req 10.6): nombre obligatorio y máx. 50 caracteres.
  if (name.length === 0) {
    return { ok: false, error: "El nombre de la categoría es obligatorio." };
  }
  if (name.length > CATEGORY_NAME_MAX) {
    return {
      ok: false,
      error: `El nombre no puede superar los ${CATEGORY_NAME_MAX} caracteres.`,
    };
  }

  const database = db();

  // Lee las categorías existentes para comprobar la unicidad del nombre.
  const existingSnap = await database.collection("categories").get();
  const existing: Category[] = existingSnap.docs.map((doc) =>
    mapCategoryDoc(doc.id, doc.data() as Record<string, unknown>),
  );

  // Unicidad insensible a may/min (Req 10.7): si ya existe, no se crea nada.
  if (isCategoryNameTaken(existing, name)) {
    return { ok: false, error: "El nombre ya existe." };
  }

  // Guarda con `name` y `nameLower` para unicidad/búsqueda (Req 10.6).
  const categoryRef = database.collection("categories").doc();
  await categoryRef.set({
    name,
    nameLower: name.toLowerCase(),
  });

  // Invalida la caché de categorías (las lecturas estables usan esta etiqueta).
  updateTag(BLOG_CATEGORIES_TAG);

  return { ok: true, categoryId: categoryRef.id };
}

/**
 * Elimina una categoría y la DESASOCIA de cada entrada que la referencia
 * (Req 10.8).
 *
 * Flujo:
 *  1. Verifica el rol de administrador.
 *  2. Localiza las entradas cuyo `categoryIds` contiene el identificador con un
 *     filtro `array-contains` y, mediante lotes (`WriteBatch`) de hasta 500
 *     operaciones (el máximo de Firestore), retira el id de su `categoryIds`
 *     con `FieldValue.arrayRemove` y, en el último lote, elimina el documento de
 *     la categoría.
 *  3. Invalida las cachés de categorías y de entradas (las entradas cambian su
 *     `categoryIds`).
 *
 * Contrato de `formData`: `categoryId` (string).
 */
export async function deleteCategory(
  _state: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (categoryId.length === 0) {
    return { ok: false, error: "No se pudo identificar la categoría." };
  }

  const database = db();
  const categoryRef = database.collection("categories").doc(categoryId);

  // Entradas que referencian la categoría: hay que quitarla de su `categoryIds`.
  const referencingSnap = await database
    .collection("posts")
    .where("categoryIds", "array-contains", categoryId)
    .get();

  const postRefs = referencingSnap.docs.map((doc) => doc.ref);

  // Desasociación + borrado por lotes (Firestore limita cada batch a 500 ops).
  // Se reserva una operación de cada lote para no exceder el límite, y se añade
  // el borrado de la categoría al último lote.
  const batchCapacity = POST_BATCH_LIMIT;
  for (let i = 0; i < postRefs.length; i += batchCapacity) {
    const batch = database.batch();
    for (const ref of postRefs.slice(i, i + batchCapacity)) {
      // Quita el id de `categoryIds` sin tocar el resto de categorías (Req 10.8).
      batch.update(ref, {
        categoryIds: FieldValue.arrayRemove(categoryId),
        updatedAt: Timestamp.now(),
      });
    }
    await batch.commit();
  }

  // Elimina el documento de la categoría tras desasociarla de las entradas.
  await categoryRef.delete();

  // Invalida ambas cachés: categorías (se eliminó una) y entradas (cambió su
  // `categoryIds` al desasociar la categoría).
  updateTag(BLOG_CATEGORIES_TAG);
  updateTag(BLOG_POSTS_TAG);

  return { ok: true, categoryId };
}

// ---------------------------------------------------------------------------
// Gestión de usuarios del Panel_Admin (Req 9.3, 9.4)
// ---------------------------------------------------------------------------
//
// Igual que las acciones de entradas y categorías, ambas verifican el custom
// claim de administrador con `isCurrentUserAdmin()` ANTES de mutar (las Reglas
// de Firestore vuelven a validarlo); como son alcanzables por POST directo, la
// verificación es imprescindible. Los errores esperados (no autorizado, usuario
// inexistente, rol no permitido) se devuelven como VALOR de estado
// (`UserActionState`, patrón `useActionState`); solo los fallos inesperados se
// propagan al `error.tsx` más cercano.
//
// La lista de usuarios del panel se lee FRESCA en cada visita (no se cachea, ver
// `app/admin/usuarios/page.tsx`), por lo que tras mutar se invoca `refresh()` de
// `next/cache` para re-renderizar la página en el servidor y reflejar el cambio
// en la UI. `refresh()` refresca el router de cliente sin revalidar datos
// etiquetados (no usamos `updateTag` aquí porque las lecturas de usuarios no
// están etiquetadas). En este Next.js modificado `refresh()` sustituye al patrón
// de recarga manual tras una mutación.
//
// Firebase Admin SDK v14 (API MODULAR): `firebase-admin/auth` expone
// `getAuth().deleteUser(uid)` para eliminar la cuenta de Authentication, y
// `firebase-admin/firestore` (`getFirestore`) para el registro `users/{uid}`.

/** Roles permitidos para una cuenta del blog (Req 9.4). */
const ALLOWED_USER_ROLES: readonly UserRole[] = ["suscriptor", "admin"];

/** Indica si un valor es un `UserRole` permitido (Req 9.4). */
function isAllowedRole(value: string): value is UserRole {
  return (ALLOWED_USER_ROLES as readonly string[]).includes(value);
}

/**
 * Elimina un Usuario_Registrado (Req 9.3).
 *
 * Flujo:
 *  1. Verifica el rol de administrador. Sin privilegios NO elimina nada y
 *     devuelve un estado de error en español.
 *  2. Elimina el registro del usuario en Firestore (`users/{uid}`).
 *  3. Elimina su cuenta en Firebase Authentication
 *     (`getAuth().deleteUser(uid)`). Si la cuenta de Auth ya no existe
 *     (`auth/user-not-found`), se tolera el error: el objetivo (que el usuario
 *     deje de existir) ya está cumplido tras borrar el registro de Firestore.
 *  4. Refresca la página para que la lista deje de mostrar al usuario.
 *
 * Contrato de `formData`: `uid` (string) — identificador del usuario.
 */
export async function deleteUser(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const uid = String(formData.get("uid") ?? "").trim();
  if (uid.length === 0) {
    return { ok: false, error: "No se pudo identificar al usuario." };
  }

  // 2) Elimina el registro de Firestore (Req 9.3).
  await db().collection("users").doc(uid).delete();

  // 3) Elimina la cuenta de Firebase Authentication (Req 9.3).
  try {
    initFirebase();
    await getAuth().deleteUser(uid);
  } catch (err: unknown) {
    // Si la cuenta de Auth ya no existe, la operación es idempotente: el usuario
    // ya no existe en ningún sistema. Cualquier otro fallo sí se propaga.
    const code = (err as { code?: string } | null)?.code;
    if (code !== "auth/user-not-found") {
      throw err;
    }
  }

  // 4) Re-renderiza la página (la lista se lee fresca, sin caché).
  refresh();
  return { ok: true, uid };
}

/**
 * Modifica el rol de un Usuario_Registrado a un rol permitido (Req 9.4).
 *
 * Flujo:
 *  1. Verifica el rol de administrador.
 *  2. Comprueba que el `role` recibido es uno de los permitidos
 *     (`"suscriptor"` | `"admin"`). Un rol no permitido se rechaza sin escribir.
 *  3. Comprueba que el usuario existe y actualiza su campo `role` en
 *     `users/{uid}`.
 *  4. Refresca la página para reflejar el nuevo rol en la lista.
 *
 * Contrato de `formData`: `uid` (string) y `role` (`"suscriptor"` | `"admin"`).
 */
export async function updateUserRole(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: UNAUTHORIZED_MESSAGE };
  }

  const uid = String(formData.get("uid") ?? "").trim();
  if (uid.length === 0) {
    return { ok: false, error: "No se pudo identificar al usuario." };
  }

  const role = String(formData.get("role") ?? "").trim();
  if (!isAllowedRole(role)) {
    return { ok: false, error: "El rol seleccionado no es válido." };
  }

  const userRef = db().collection("users").doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) {
    return { ok: false, error: "El usuario no existe." };
  }

  // Solo se actualiza el campo `role` del registro del usuario (Req 9.4).
  await userRef.update({ role });

  refresh();
  return { ok: true, uid };
}
