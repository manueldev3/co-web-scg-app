// Lógica pura del Blog (espejo de `app/mejor-ruta/route-engine.ts`).
// Sin dependencias de React/Next/Firebase: ordenación, filtrado, paginación,
// validación, selección de destacados, conmutación de «me gusta», métricas y
// presencia. Es la capa idónea para pruebas basadas en propiedades (`fast-check`).
//
// NOTA: Este módulo es el andamiaje (scaffolding) de la tarea 1.3. Solo declara
// las constantes y las firmas tipadas; las implementaciones reales llegan en las
// tareas 2.x. Los cuerpos son stubs que lanzan «not implemented».

import type {
  BlogUser,
  Category,
  Comment,
  GeoLocation,
  Like,
  Post,
  PresenceConnection,
} from "./types";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Número de entradas por página en el listado público (Req 1.8, 1.9). */
export const POSTS_PER_PAGE = 10;

/** Longitud máxima efectiva de un comentario tras recorte (Req 4.7). */
export const COMMENT_MAX = 2000;

/** Longitud máxima del título de una entrada (Req 10.2, 10.9). */
export const TITLE_MAX = 200;

/** Longitud máxima del contenido de una entrada (Req 10.2, 10.9). */
export const CONTENT_MAX = 50000;

/** Longitud máxima del nombre de una categoría (Req 10.6). */
export const CATEGORY_NAME_MAX = 50;

/** Número mínimo de categorías por entrada (Req 10.2, 10.12). */
export const CATEGORY_MIN = 1;

/** Número máximo de categorías por entrada (Req 10.2, 10.12). */
export const CATEGORY_MAX = 10;

/** Longitud mínima de contraseña en el registro (Req 3.1, 3.5). */
export const PASSWORD_MIN = 8;

/** Total de entradas destacadas en pantallas anchas (Req 11). */
export const FEATURED_TOTAL = 3;

/** Ventana de inactividad de presencia: 60 s (Req 8.4). */
export const PRESENCE_TTL_MS = 60_000;

// ---------------------------------------------------------------------------
// Tipos de resultado de validación
// ---------------------------------------------------------------------------

/** Resultado de validar el contenido de un comentario (Req 4.6, 4.7). */
export type CommentValidation =
  | { ok: true; value: string }
  | { ok: false; error: "vacio" | "excede_limite" };

/** Resultado de validar un registro de usuario (Req 3.1, 3.5). */
export type RegistrationValidation =
  | { ok: true }
  | { ok: false; errors: { email?: string; password?: string } };

/** Resultado de validar una entrada de blog (Req 10.2, 10.9, 10.12). */
export type PostValidation =
  | { ok: true }
  | { ok: false; field: "titulo" | "contenido" | "categorias" };

// ---------------------------------------------------------------------------
// Firmas (stubs tipados) — implementaciones en tareas 2.x
// ---------------------------------------------------------------------------

/** Ordenación del listado: solo publicadas, fecha desc y, en empate, título asc. */
export function orderPublishedPosts(posts: Post[]): Post[] {
  return posts
    .filter((post) => post.status === "publicada")
    .slice()
    .sort((a, b) => {
      // Fecha de publicación descendente (más reciente primero). Las entradas
      // publicadas tienen `publishedAt` definido; ante un null lo tratamos como 0.
      const aDate = a.publishedAt ?? 0;
      const bDate = b.publishedAt ?? 0;
      if (aDate !== bDate) {
        return bDate - aDate;
      }
      // Empate de fecha: título en orden alfabético ascendente.
      return a.title.localeCompare(b.title);
    });
}

/** Filtra solo publicadas que pertenecen a la categoría dada (preserva el orden). */
export function filterByCategory(posts: Post[], categoryId: string): Post[] {
  return posts.filter(
    (post) =>
      post.status === "publicada" && post.categoryIds.includes(categoryId),
  );
}

/** Particiona en páginas de tamaño fijo (<= pageSize) preservando el orden. */
export function paginate<T>(
  items: T[],
  pageSize: number,
  pageIndex: number,
): {
  items: T[];
  pageIndex: number;
  totalPages: number;
} {
  // Tamaño de página efectivo: al menos 1 para evitar divisiones inválidas.
  const size = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.ceil(items.length / size);
  // Sujeta el índice solicitado al rango válido [0, totalPages - 1]; con una
  // lista vacía no hay páginas y el índice resultante es 0.
  const lastIndex = Math.max(0, totalPages - 1);
  const clampedIndex = Math.min(Math.max(0, Math.floor(pageIndex)), lastIndex);
  const start = clampedIndex * size;
  return {
    items: items.slice(start, start + size),
    pageIndex: clampedIndex,
    totalPages,
  };
}

/** Validación de contenido de comentario: longitud efectiva 1..2000 tras recorte. */
export function validateCommentContent(raw: string): CommentValidation {
  // La longitud efectiva se mide sobre el contenido recortado (Req 4.6, 4.7).
  const value = raw.trim();
  if (value.length === 0) {
    // Cadena vacía o compuesta solo por espacios en blanco.
    return { ok: false, error: "vacio" };
  }
  if (value.length > COMMENT_MAX) {
    // Supera el límite de 2000 caracteres tras recorte.
    return { ok: false, error: "excede_limite" };
  }
  return { ok: true, value };
}

/**
 * Formato de email razonable: una parte local sin espacios, una arroba, un
 * dominio sin espacios con al menos un punto y un TLD de 2+ caracteres. Evita
 * espacios en cualquier posición. No pretende cubrir el RFC completo, sino el
 * formato práctico aceptado por Firebase Auth.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** ¿El email tiene un formato válido? (Req 3.1, 3.5). */
function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/** Validación de registro: email con formato válido y contraseña >= 8 caracteres. */
export function validateRegistration(
  email: string,
  password: string,
): RegistrationValidation {
  const errors: { email?: string; password?: string } = {};
  if (!isValidEmail(email)) {
    errors.email = "El correo electrónico no tiene un formato válido";
  }
  if (password.length < PASSWORD_MIN) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  }
  if (errors.email !== undefined || errors.password !== undefined) {
    return { ok: false, errors };
  }
  return { ok: true };
}

/** Conmutación de «me gusta». likedBy es el conjunto de usuarios que ya dieron like. */
export function toggleLike(
  likedBy: ReadonlySet<string>,
  userId: string,
): {
  likedBy: Set<string>;
  liked: boolean;
  count: number;
} {
  // No mutar el conjunto de entrada: trabajamos sobre una copia (Req 5.4-5.6).
  const next = new Set(likedBy);
  if (next.has(userId)) {
    // El usuario ya tenía like: lo eliminamos y queda desactivado.
    next.delete(userId);
    return { likedBy: next, liked: false, count: next.size };
  }
  // El usuario no tenía like: lo añadimos (un Set garantiza unicidad).
  next.add(userId);
  return { likedBy: next, liked: true, count: next.size };
}

/** Selección de destacados (Req 11): más reciente + top por comentarios, sin repetir. */
export function selectFeatured(posts: Post[], count: number): Post[] {
  // Solo se consideran entradas publicadas (Req 11.2, 11.9).
  const published = posts.filter((post) => post.status === "publicada");

  // Tamaño del resultado: el mínimo entre `count` y las publicadas disponibles.
  const resultSize = Math.min(Math.max(0, Math.floor(count)), published.length);
  if (resultSize === 0) {
    return [];
  }

  // Primer elemento: la entrada publicada más reciente (fecha desc; título asc
  // como desempate determinista, igual que en `orderPublishedPosts`).
  const byRecency = published.slice().sort((a, b) => {
    const aDate = a.publishedAt ?? 0;
    const bDate = b.publishedAt ?? 0;
    if (aDate !== bDate) {
      return bDate - aDate;
    }
    return a.title.localeCompare(b.title);
  });

  const mostRecent = byRecency[0];
  const result: Post[] = [mostRecent];
  const used = new Set<string>([mostRecent.id]);

  // Elementos restantes: mayor número de comentarios; desempate por fecha de
  // publicación más reciente y, en último término, por título ascendente. Se
  // excluye la entrada ya seleccionada para no repetir ninguna (Req 11.4, 11.5).
  const byComments = published
    .filter((post) => !used.has(post.id))
    .sort((a, b) => {
      if (b.commentCount !== a.commentCount) {
        return b.commentCount - a.commentCount;
      }
      const aDate = a.publishedAt ?? 0;
      const bDate = b.publishedAt ?? 0;
      if (aDate !== bDate) {
        return bDate - aDate;
      }
      return a.title.localeCompare(b.title);
    });

  for (const post of byComments) {
    if (result.length >= resultSize) {
      break;
    }
    result.push(post);
    used.add(post.id);
  }

  return result;
}

/** Número de destacados según ancho de viewport (Req 11.6-11.8). */
export function featuredCountForWidth(width: number): 1 | 2 | 3 {
  // Anchas (escritorio): 3; medianas (tablet): 2; estrechas (móvil): 1.
  if (width >= 1024) {
    return 3;
  }
  if (width >= 768) {
    return 2;
  }
  return 1;
}

/** Búsqueda de usuarios por email, insensible a mayúsculas (Req 9.5). */
export function searchUsersByEmail(
  users: BlogUser[],
  term: string,
): BlogUser[] {
  // Insensible a may/min: comparamos en minúsculas. Un término vacío está
  // contenido en cualquier email, por lo que devuelve todos los usuarios.
  const needle = term.toLowerCase();
  return users.filter((user) => user.email.toLowerCase().includes(needle));
}

/** Validación de entrada de blog (Req 10.2, 10.9, 10.12). */
export function validatePost(
  title: string,
  content: string,
  categoryIds: string[],
): PostValidation {
  // Se reporta el PRIMER campo inválido en orden: titulo, contenido, categorias.
  if (title.length < 1 || title.length > TITLE_MAX) {
    return { ok: false, field: "titulo" };
  }
  if (content.length < 1 || content.length > CONTENT_MAX) {
    return { ok: false, field: "contenido" };
  }
  if (categoryIds.length < CATEGORY_MIN || categoryIds.length > CATEGORY_MAX) {
    return { ok: false, field: "categorias" };
  }
  return { ok: true };
}

/** ¿El nombre de categoría ya existe? (insensible a may/min, Req 10.7). */
export function isCategoryNameTaken(
  existing: Category[],
  name: string,
): boolean {
  // Coincidencia exacta ignorando diferencias de mayúsculas y minúsculas.
  const candidate = name.toLowerCase();
  return existing.some((category) => category.name.toLowerCase() === candidate);
}

/** Métricas del dashboard a partir de los datos (Req 7.1-7.4). */
export function computeDashboardMetrics(
  posts: Post[],
  comments: Comment[],
  likes: Like[],
): {
  totalPosts: number;
  postsWithComments: number;
  totalComments: number;
  totalLikes: number;
} {
  // Conjunto de identificadores de entrada que tienen al menos un comentario.
  const postIdsWithComments = new Set(
    comments.map((comment) => comment.postId),
  );
  // Solo cuentan las entradas existentes con al menos un comentario asociado.
  const postsWithComments = posts.filter((post) =>
    postIdsWithComments.has(post.id),
  ).length;

  return {
    totalPosts: posts.length,
    postsWithComments,
    totalComments: comments.length,
    totalLikes: likes.length,
  };
}

/** Conexiones de presencia vigentes según ventana de inactividad (Req 8.4). */
export function activeConnections(
  conns: PresenceConnection[],
  nowMs: number,
  ttlMs: number,
): PresenceConnection[] {
  // Una conexión está vigente si su antigüedad (now - lastSeen) no supera el
  // ttl. Las que la superan se consideran caducadas y quedan excluidas.
  return conns.filter((conn) => nowMs - conn.lastSeen <= ttlMs);
}

/** ¿Coordenadas mapeables? lat ∈ [-90,90], lng ∈ [-180,180] (Req 8.6, 8.7). */
export function isMappableLocation(
  loc: GeoLocation | null | undefined,
): boolean {
  // Sin ubicación no es mapeable. Las coordenadas fuera de rango (o NaN, que
  // falla cualquier comparación) tampoco lo son.
  if (loc === null || loc === undefined) {
    return false;
  }
  return loc.lat >= -90 && loc.lat <= 90 && loc.lng >= -180 && loc.lng <= 180;
}

/** ¿El enlace «Blog» de la cabecera está activo? (Req 12.3). */
export function isBlogLinkActive(pathname: string): boolean {
  // Activo en la propia raíz `/blog` o en cualquier subruta `/blog/...`.
  return pathname === "/blog" || pathname.startsWith("/blog/");
}
