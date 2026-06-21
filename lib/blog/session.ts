import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

import initFirebase from "@/lib/firebase/admin";

/**
 * Verificación de sesión del Blog (solo servidor).
 *
 * Este módulo es la única vía autoritativa para resolver, en el servidor, la
 * identidad y los privilegios del usuario actual a partir de la cookie de
 * sesión de Firebase. Se marca con `import "server-only"` para que cualquier
 * intento de importarlo desde un Client Component produzca un error de
 * compilación (los secretos del Admin SDK nunca deben llegar al cliente).
 *
 * Plataforma (Next.js 16 modificado):
 * - `cookies()` de `next/headers` es asíncrono y debe esperarse (`await`).
 *   Fuente: docs/01-app/02-guides/authentication.md (Session Management).
 * - La verificación se memoiza por petición con `cache()` de React para evitar
 *   múltiples llamadas a la API de Firebase Auth durante un mismo renderizado.
 *
 * Firebase Admin SDK v14 (modular): se usan `getAuth().verifySessionCookie` y
 * `getAuth().verifyIdToken` desde `firebase-admin/auth`.
 */

/**
 * Nombre de la cookie de sesión. Se usa `__session` porque es el único nombre
 * de cookie que algunos CDNs/hosting de Firebase reenvían al servidor, y es la
 * convención recomendada para sesiones SSR con Firebase.
 */
export const SESSION_COOKIE_NAME = "__session";

/** Usuario resuelto a partir de una sesión válida. */
export interface SessionUser {
  /** UID de Firebase Authentication. */
  uid: string;
  /** Correo electrónico asociado a la cuenta, o `null` si no está disponible. */
  email: string | null;
  /** `true` solo si el custom claim `admin` es exactamente `true`. */
  admin: boolean;
}

/** Convierte las claims decodificadas en el modelo de dominio de sesión. */
function toSessionUser(decoded: DecodedIdToken): SessionUser {
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    // El custom claim solo concede privilegios si es estrictamente `true`.
    admin: decoded.admin === true,
  };
}

/**
 * Verifica una cookie de sesión de Firebase y devuelve el usuario decodificado.
 * Devuelve `null` si la cookie falta, es inválida, ha caducado o fue revocada.
 *
 * @param sessionCookie Valor de la cookie de sesión (`createSessionCookie`).
 */
export async function verifySessionCookie(
  sessionCookie: string | undefined | null,
): Promise<SessionUser | null> {
  if (!sessionCookie) return null;
  try {
    initFirebase();
    // `checkRevoked = true` rechaza sesiones de usuarios deshabilitados o cuyos
    // tokens fueron invalidados (cierre de sesión / cambio de contraseña).
    const decoded = await getAuth().verifySessionCookie(sessionCookie, true);
    return toSessionUser(decoded);
  } catch {
    // Cualquier fallo de verificación se traduce a «sin sesión» (no autenticado).
    return null;
  }
}

/**
 * Verifica un ID token de Firebase y devuelve el usuario decodificado.
 * Devuelve `null` si el token falta, es inválido, ha caducado o fue revocado.
 *
 * Útil en el flujo de inicio de sesión, donde el cliente entrega un ID token
 * que el servidor verifica antes de emitir la cookie de sesión.
 *
 * @param idToken ID token emitido por el SDK de cliente de Firebase Auth.
 */
export async function verifyIdToken(
  idToken: string | undefined | null,
): Promise<SessionUser | null> {
  if (!idToken) return null;
  try {
    initFirebase();
    const decoded = await getAuth().verifyIdToken(idToken, true);
    return toSessionUser(decoded);
  } catch {
    return null;
  }
}

/**
 * Resuelve la sesión actual leyendo la cookie de sesión desde `next/headers`.
 * Devuelve el usuario decodificado (`uid`, `email`, `admin`) o `null` si no hay
 * sesión válida. Memoizado por petición.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionCookie(sessionCookie);
});

/**
 * `true` si existe una sesión válida (usuario autenticado), `false` en caso
 * contrario.
 */
export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

/**
 * `true` si la sesión actual pertenece a un administrador, es decir, si su
 * custom claim `admin` es exactamente `true`. `false` para visitantes,
 * suscriptores o sesiones inválidas.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.admin === true;
}
