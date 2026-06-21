// Tipos y estados iniciales de las Server Actions de cuentas del Blog.
//
// Este módulo NO lleva la directiva `"use server"`: un archivo `"use server"`
// solo puede exportar funciones asíncronas, por lo que los tipos compartidos y
// los estados iniciales (valores de tiempo de ejecución) viven aquí para poder
// importarse tanto desde las Server Actions (`auth-actions.ts`) como desde los
// Client Components que las consumen con `useActionState` (tarea 6.3).

/**
 * Estado de la acción de registro (patrón `useActionState`).
 *
 * - `ok === true`: la cuenta se creó, se guardó el registro de usuario en
 *   Firestore con rol `suscriptor` y se estableció la sesión.
 * - `errors`: errores de validación por campo (formato de email / longitud de
 *   contraseña), en español, listos para mostrar junto a cada input (Req 3.5).
 * - `error`: mensaje general en español ante errores de Firebase o de
 *   comunicación (p. ej. correo ya en uso, fallo del SDK) (Req 3.4, 3.9).
 */
export interface RegisterActionState {
  ok: boolean;
  /** Errores de validación por campo en español (Req 3.5). */
  errors?: { email?: string; password?: string };
  /** Mensaje de error general en español (Req 3.4, 3.9). */
  error?: string;
}

/** Estado inicial recomendado para `useActionState(registerUser, …)`. */
export const initialRegisterState: RegisterActionState = { ok: false };

/**
 * Estado de la acción de inicio de sesión (patrón `useActionState`).
 *
 * - `ok === true`: la sesión se estableció (cookie de sesión emitida).
 * - `error`: mensaje GENÉRICO en español que no revela si falló el correo o la
 *   contraseña (Req 3.3), o mensaje de fallo de comunicación (Req 3.9).
 */
export interface LoginActionState {
  ok: boolean;
  /** Mensaje de error en español cuando `ok === false`. */
  error?: string;
}

/** Estado inicial recomendado para `useActionState(loginUser, …)`. */
export const initialLoginState: LoginActionState = { ok: false };

/**
 * Estado de la acción de inicio de sesión de administrador (patrón
 * `useActionState`).
 *
 * - `ok === true`: el ID token se verificó, el custom claim `admin` es
 *   exactamente `true` y se estableció la cookie de sesión de administrador.
 *   En la práctica `adminLogin` redirige a `/admin` en este caso, por lo que el
 *   estado `ok: true` rara vez llega al cliente.
 * - `error`: mensaje en español cuando `ok === false`. Distingue dos casos:
 *   - Credenciales incorrectas (token ausente/no verificable) (Req 6.3).
 *   - Acceso no autorizado: credenciales válidas pero sin claim `admin` (Req 6.4).
 *     En este caso NO se establece ninguna sesión de administrador.
 */
export interface AdminLoginActionState {
  ok: boolean;
  /** Mensaje de error en español cuando `ok === false`. */
  error?: string;
}

/** Estado inicial recomendado para `useActionState(adminLogin, …)`. */
export const initialAdminLoginState: AdminLoginActionState = { ok: false };
