"use server";

// Server Actions de cuentas del Blog (registro, inicio y cierre de sesión).
//
// Plataforma (Next.js 16 modificado) — docs consultadas en node_modules:
// - docs/01-app/01-getting-started/07-mutating-data.md: las Server Actions son
//   funciones `"use server"` alcanzables por POST directo, por lo que SIEMPRE
//   verifican auth/autorización en su interior; las cookies se gestionan con la
//   API asíncrona `cookies()` de `next/headers` (`await cookies()`), y al
//   set/delete una cookie Next vuelve a renderizar la ruta para reflejar el
//   nuevo estado de sesión en la UI.
// - docs/01-app/02-guides/authentication.md: patrón `useActionState` con
//   validación en servidor y retorno temprano de errores como VALORES (no
//   excepciones); la sesión se persiste en una cookie `HttpOnly`/`Secure`/
//   `SameSite` establecida en el servidor.
//
// RESTRICCIÓN: un archivo `"use server"` solo puede EXPORTAR funciones
// asíncronas. Por eso los tipos y estados iniciales compartidos viven en
// `auth-action-types.ts` (sin directiva) y aquí solo se exportan las acciones.
//
// Enfoque de creación de cuenta (decisión documentada):
//   Se usa el **Admin SDK** (`getAuth().createUser`) de forma server-autoritativa
//   en lugar del SDK de cliente + intercambio de token. Motivos:
//   1. La validación de campos (`validateRegistration`) y la traducción de
//      errores de Firebase al español (Req 3.4, 3.9) ocurren en el servidor.
//   2. El registro del usuario en Firestore con rol `suscriptor` (Req 3.8) se
//      escribe con privilegios de administrador, sin depender de las Reglas.
//   Para establecer la sesión tras crear la cuenta, el servidor obtiene un ID
//   token mediante el endpoint REST de Identity Toolkit (signInWithPassword) y
//   lo intercambia por una cookie de sesión con `createSessionCookie`.
//
//   El **inicio de sesión** (`loginUser`), en cambio, sí delega la comprobación
//   de credenciales en el SDK de cliente: la UI (tarea 6.3) llama a
//   `signInWithEmailAndPassword`, obtiene el ID token y lo envía a esta acción,
//   que lo verifica y emite la cookie de sesión. Así el servidor nunca ve la
//   contraseña en el login y puede devolver un mensaje genérico (Req 3.3).
//
// Contrato de `formData` (para la UI de la tarea 6.3):
//   registerUser → campos: `email` (string), `password` (string).
//   loginUser    → campo:  `idToken` (string) obtenido por el cliente con
//                  `signInWithEmailAndPassword` antes de invocar la acción.
//   logoutUser   → sin parámetros.
//   adminLogin   → campo:  `idToken` (string) obtenido por el cliente con
//                  `signInWithEmailAndPassword`. La acción verifica el token y
//                  exige el custom claim `admin === true` (Req 6.2, 6.3, 6.4).
//   adminLogout  → sin parámetros (Req 6.7).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import initFirebase from "@/lib/firebase/admin";
import { validateRegistration } from "@/app/blog/blog-engine";
import { SESSION_COOKIE_NAME, verifyIdToken } from "@/lib/blog/session";
import type {
  AdminLoginActionState,
  LoginActionState,
  RegisterActionState,
} from "@/lib/blog/auth-action-types";

/**
 * Duración de la cookie de sesión: 14 días (máximo admitido por Firebase para
 * `createSessionCookie`). Mantiene la sesión entre recargas (Req 3.7).
 */
const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000;

/** Mensaje genérico de credenciales inválidas (Req 3.3: no revela el campo). */
const GENERIC_LOGIN_ERROR =
  "El correo electrónico o la contraseña no son correctos";

/** Mensaje de fallo de comunicación con Firebase (Req 3.9). */
const COMMS_ERROR =
  "No se pudo completar la operación. Inténtalo de nuevo más tarde";

/**
 * Intercambia un ID token verificado por una cookie de sesión de Firebase y la
 * establece en la respuesta con atributos seguros. La cookie usa el nombre
 * `__session` (ver `session.ts`) para ser compatible con el hosting de Firebase.
 */
async function establishSessionCookie(idToken: string): Promise<void> {
  initFirebase();
  const sessionCookie = await getAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN_MS,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_EXPIRES_IN_MS / 1000),
  });
}

/**
 * Obtiene un ID token para un par (email, contraseña) recién creado usando el
 * endpoint REST de Identity Toolkit. Necesario porque el Admin SDK crea la
 * cuenta pero no emite ID tokens; el ID token es imprescindible para
 * `createSessionCookie`. Devuelve `null` si no hay API key o la petición falla.
 */
async function signInForIdToken(
  email: string,
  password: string,
): Promise<string | null> {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.FIREBASE_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );
    if (!response.ok) return null;
    const data: { idToken?: string } = await response.json();
    return data.idToken ?? null;
  } catch {
    return null;
  }
}

/** Extrae el `code` de un error del Admin SDK de forma segura. */
function errorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    return String((err as { code: unknown }).code);
  }
  return "";
}

/**
 * Traduce los códigos de error de creación de cuenta de Firebase a mensajes en
 * español (Req 3.4, 3.9). El Admin SDK usa `auth/email-already-exists`; el SDK
 * de cliente usa `auth/email-already-in-use`. Se contemplan ambos.
 */
function translateRegisterError(err: unknown): string {
  switch (errorCode(err)) {
    case "auth/email-already-exists":
    case "auth/email-already-in-use":
      return "El correo ya está en uso";
    case "auth/invalid-email":
      return "El correo electrónico no tiene un formato válido";
    case "auth/invalid-password":
    case "auth/weak-password":
      return "La contraseña debe tener al menos 8 caracteres";
    default:
      return COMMS_ERROR;
  }
}

/**
 * Registra un nuevo Usuario_Registrado (suscriptor).
 *
 * Flujo: valida campos → crea la cuenta en Firebase Auth (Admin SDK) → guarda
 * el registro `users/{uid}` en Firestore con rol `suscriptor` → establece la
 * cookie de sesión. Los errores esperados se devuelven como valores.
 *
 * @returns Estado `useActionState`: `{ ok: true }` o errores por campo/general.
 * @see Requirements 3.1, 3.4, 3.5, 3.8, 3.9
 */
export async function registerUser(
  _state: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // 1. Validación de formato/longitud en el servidor (Req 3.1, 3.5).
  const validation = validateRegistration(email, password);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  try {
    initFirebase();

    // 2. Crear la cuenta en Firebase Authentication (Admin SDK).
    let uid: string;
    try {
      const userRecord = await getAuth().createUser({ email, password });
      uid = userRecord.uid;
    } catch (err) {
      // Errores esperados de Firebase (p. ej. correo en uso) → español.
      return { ok: false, error: translateRegisterError(err) };
    }

    // 3. Crear el registro de usuario en Firestore con rol `suscriptor`.
    await getFirestore().collection("users").doc(uid).set({
      uid,
      email,
      role: "suscriptor",
      createdAt: Date.now(),
    });

    // 4. Establecer la sesión: obtener ID token y emitir la cookie de sesión.
    const idToken = await signInForIdToken(email, password);
    if (idToken) {
      await establishSessionCookie(idToken);
    }

    return { ok: true };
  } catch {
    // Fallo inesperado de comunicación con Firebase (Req 3.9): se conserva el
    // estado no autenticado y se informa en español.
    return { ok: false, error: COMMS_ERROR };
  }
}

/**
 * Inicia la sesión de un Usuario_Registrado a partir del ID token que la UI ha
 * obtenido con `signInWithEmailAndPassword` (SDK de cliente).
 *
 * Verifica el ID token y, si es válido, emite la cookie de sesión. Ante
 * credenciales inválidas devuelve un mensaje GENÉRICO que no revela si falló el
 * correo o la contraseña (Req 3.3), conservando el estado no autenticado.
 *
 * @returns Estado `useActionState`: `{ ok: true }` o `{ ok: false, error }`.
 * @see Requirements 3.2, 3.3, 3.9
 */
export async function loginUser(
  _state: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const idToken = String(formData.get("idToken") ?? "");

  // Sin token (o token no verificable) → mensaje genérico (Req 3.3).
  if (!idToken) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const user = await verifyIdToken(idToken);
  if (!user) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  try {
    // Emitir la cookie de sesión (verifica de nuevo el ID token internamente).
    await establishSessionCookie(idToken);
    return { ok: true };
  } catch {
    // Fallo de comunicación al emitir la sesión (Req 3.9).
    return { ok: false, error: COMMS_ERROR };
  }
}

/**
 * Cierra la sesión del usuario eliminando la cookie de sesión, restableciendo
 * el estado a no autenticado (Req 3.6).
 */
export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Mensaje de credenciales de administrador incorrectas (Req 6.3). No revela si
 * el fallo corresponde al correo o a la contraseña.
 */
const ADMIN_INVALID_CREDENTIALS = "Las credenciales son incorrectas";

/**
 * Mensaje de acceso no autorizado (Req 6.4): las credenciales son válidas pero
 * la cuenta no posee el custom claim `admin === true`.
 */
const ADMIN_UNAUTHORIZED =
  "No tienes autorización para acceder al panel de administración";

/**
 * Inicia la sesión de un Administrador en la ruta oculta `/admin`.
 *
 * A diferencia de {@link loginUser}, esta acción NO solo verifica el ID token:
 * además exige que el custom claim `admin` sea exactamente `true` antes de
 * conceder acceso. La UI (`app/admin/login/page.tsx`) obtiene el ID token con
 * `signInWithEmailAndPassword` (SDK de cliente) y lo envía aquí.
 *
 * Flujo y reglas:
 * - ID token ausente o no verificable → mensaje de credenciales incorrectas,
 *   sin conceder acceso ni establecer sesión (Req 6.3).
 * - ID token válido pero SIN claim `admin === true` → mensaje de acceso no
 *   autorizado; NO se establece ninguna cookie de sesión de administrador ni se
 *   concede acceso al Panel_Admin (Req 6.4).
 * - ID token válido CON claim `admin === true` → se establece la cookie de
 *   sesión y se redirige a `/admin`, concediendo acceso (Req 6.2).
 *
 * @returns Estado `useActionState` con el mensaje de error en español cuando se
 *   deniega el acceso. En el caso de éxito la función redirige y no retorna.
 * @see Requirements 6.2, 6.3, 6.4
 */
export async function adminLogin(
  _state: AdminLoginActionState,
  formData: FormData,
): Promise<AdminLoginActionState> {
  const idToken = String(formData.get("idToken") ?? "");

  // Sin ID token (la UI no pudo autenticar las credenciales) → genérico (Req 6.3).
  if (!idToken) {
    return { ok: false, error: ADMIN_INVALID_CREDENTIALS };
  }

  // Verificar el ID token; si no es verificable, credenciales incorrectas (Req 6.3).
  const user = await verifyIdToken(idToken);
  if (!user) {
    return { ok: false, error: ADMIN_INVALID_CREDENTIALS };
  }

  // Credenciales válidas pero sin privilegios de administrador (Req 6.4):
  // se deniega el acceso y NO se establece ninguna sesión de administrador.
  if (!user.admin) {
    return { ok: false, error: ADMIN_UNAUTHORIZED };
  }

  try {
    // Administrador verificado: emitir la cookie de sesión (Req 6.2).
    await establishSessionCookie(idToken);
  } catch {
    // Fallo de comunicación al emitir la sesión.
    return { ok: false, error: COMMS_ERROR };
  }

  // Acceso concedido: redirigir al Panel_Admin (Req 6.2). `redirect` lanza una
  // excepción de control de flujo, por lo que no se ejecuta nada tras esta línea.
  redirect("/admin");
}

/**
 * Cierra la sesión del Administrador eliminando la cookie de sesión y
 * redirigiendo al formulario de inicio de sesión de administrador (Req 6.7).
 */
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}
