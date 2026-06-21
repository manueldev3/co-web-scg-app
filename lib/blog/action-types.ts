// Tipos y estados iniciales de las Server Actions de contenido del Blog.
//
// Este módulo NO lleva la directiva `"use server"`: un archivo `"use server"`
// solo puede exportar funciones asíncronas, por lo que los tipos compartidos y
// el estado inicial (un valor de tiempo de ejecución) viven aquí para poder
// importarse tanto desde las Server Actions (`actions.ts`) como desde los
// Client Components que las consumen con `useActionState`.

/**
 * Estado de la acción de creación de comentario (patrón `useActionState`).
 * `ok === true` indica que el comentario se guardó; en caso contrario `error`
 * contiene un mensaje en español listo para mostrar.
 */
export interface CommentActionState {
  ok: boolean;
  /** Mensaje de error en español cuando `ok === false`. */
  error?: string;
}

/** Estado inicial recomendado para `useActionState(createComment, …)`. */
export const initialCommentState: CommentActionState = { ok: false };

/**
 * Resultado de conmutar un «me gusta».
 * `ok === true` con `liked` (estado nuevo del control) y `count` (contador
 * actualizado). `ok === false` con `error` en español ante un error esperado.
 */
export interface ToggleLikeResult {
  ok: boolean;
  /** Estado del control tras la operación: `true` activado, `false` desactivado. */
  liked?: boolean;
  /** Contador de «me gusta» actualizado (entero >= 0). */
  count?: number;
  /** Mensaje de error en español cuando `ok === false`. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Gestión de entradas (Panel_Admin) — Req 10.2, 10.3, 10.4, 10.5, 10.9, 10.12
// ---------------------------------------------------------------------------

/** Campo de una entrada que puede resultar inválido al validar (Req 10.9, 10.12). */
export type PostFieldError = "titulo" | "contenido" | "categorias";

/**
 * Estado de las Server Actions de gestión de entradas (patrón `useActionState`).
 * `ok === true` indica que la operación (crear/editar/publicar/eliminar) se
 * completó; `postId` identifica la entrada afectada. En caso contrario, `error`
 * lleva un mensaje en español y, si proviene de validación, `fieldError` indica
 * el campo inválido para resaltarlo en el formulario.
 */
export interface PostActionState {
  ok: boolean;
  /** Identificador de la entrada creada/afectada cuando `ok === true`. */
  postId?: string;
  /** Mensaje de error en español cuando `ok === false`. */
  error?: string;
  /** Campo inválido cuando el error proviene de la validación (Req 10.9, 10.12). */
  fieldError?: PostFieldError;
}

/** Estado inicial recomendado para `useActionState` de las acciones de entradas. */
export const initialPostState: PostActionState = { ok: false };

// ---------------------------------------------------------------------------
// Gestión de categorías (Panel_Admin) — Req 10.6, 10.7, 10.8
// ---------------------------------------------------------------------------

/**
 * Estado de las Server Actions de gestión de categorías (patrón
 * `useActionState`). `ok === true` indica que la operación (crear/eliminar) se
 * completó; `categoryId` identifica la categoría afectada. En caso contrario,
 * `error` lleva un mensaje en español listo para mostrar (nombre vacío,
 * demasiado largo, ya existente, etc.).
 */
export interface CategoryActionState {
  ok: boolean;
  /** Identificador de la categoría creada/afectada cuando `ok === true`. */
  categoryId?: string;
  /** Mensaje de error en español cuando `ok === false`. */
  error?: string;
}

/** Estado inicial recomendado para `useActionState` de las acciones de categorías. */
export const initialCategoryState: CategoryActionState = { ok: false };

// ---------------------------------------------------------------------------
// Gestión de usuarios (Panel_Admin) — Req 9.3, 9.4
// ---------------------------------------------------------------------------

/**
 * Estado de las Server Actions de gestión de usuarios (patrón `useActionState`).
 * `ok === true` indica que la operación (eliminar usuario / cambiar rol) se
 * completó; `uid` identifica el usuario afectado. En caso contrario, `error`
 * lleva un mensaje en español listo para mostrar (no autorizado, usuario
 * inexistente, rol no permitido, etc.).
 */
export interface UserActionState {
  ok: boolean;
  /** Identificador (uid) del usuario afectado cuando `ok === true`. */
  uid?: string;
  /** Mensaje de error en español cuando `ok === false`. */
  error?: string;
}

/** Estado inicial recomendado para `useActionState` de las acciones de usuarios. */
export const initialUserState: UserActionState = { ok: false };
