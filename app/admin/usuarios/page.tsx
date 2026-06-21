import { Suspense } from "react";
import {
  getFirestore,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import initFirebase from "@/lib/firebase/admin";
import UsersManagerClient from "@/app/admin/usuarios/UsersManagerClient";
import type { BlogUser, UserRole } from "@/app/blog/types";

// Gestión de Usuarios (suscriptores) del Panel_Admin (`/admin/usuarios`).
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Documentación consultada en `node_modules/next/dist/docs/`:
//
// 1. `01-app/01-getting-started/05-server-and-client-components.md`: esta página
//    es un **Server Component**. Lee la lista de usuarios con el Admin SDK
//    (`firebase-admin/firestore`, solo servidor) y entrega el resultado
//    serializable (`BlogUser[]`) al Client Component `UsersManagerClient`, que
//    gestiona la búsqueda y los controles (eliminar / cambiar rol). El Admin SDK
//    NUNCA llega al bundle del cliente.
//
// 2. `01-app/02-guides/instant-navigation.md` (streaming con `<Suspense>`): la
//    lectura de usuarios se aísla en un componente servidor asíncrono envuelto
//    en `<Suspense>` para transmitir un indicador de carga mientras se consulta
//    Firestore.
//
// 3. La lista de usuarios NO se cachea (se lee fresca en cada visita) para que
//    refleje altas/bajas y cambios de rol recientes. Las Server Actions
//    `deleteUser` / `updateUserRole` (en `lib/blog/actions.ts`) invocan
//    `refresh()` tras mutar, lo que re-renderiza esta página en el servidor y
//    actualiza la lista sin recarga manual. El layout de `/admin`
//    (`app/admin/layout.tsx`) ya exporta `unstable_instant = false` y verifica el
//    claim de administrador (Req 6.4, 6.8), de modo que esta vista solo se
//    renderiza para administradores.
//
// Reparto de responsabilidades respecto a los requisitos:
//   - Req 9.1: lista de usuarios con correo, rol y fecha de registro.
//   - Req 9.2: mensaje en español cuando no existe ningún usuario.
//   - Req 9.3: control para eliminar un usuario (Firestore + Auth) → `deleteUser`.
//   - Req 9.4: control para cambiar el rol → `updateUserRole`.
//   - Req 9.5: búsqueda por correo insensible a may/min (`searchUsersByEmail`).

/** Paleta del tema oscuro del panel (coincide con el resto de vistas admin). */
const CARD_BG = "bg-[#0F2C3E]";
const ACCENT = "text-[#9ED0FA]";

/** Inicializa el Admin SDK (idempotente) y devuelve la instancia de Firestore. */
function db() {
  initFirebase();
  return getFirestore();
}

/** Convierte un valor de Firestore (Timestamp/Date/número) a epoch ms (0 si no). */
function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return 0;
}

/** Normaliza el rol leído de Firestore a un `UserRole` válido. */
function toUserRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "suscriptor";
}

/** Mapea un documento de `users/{uid}` al tipo de dominio `BlogUser`. */
function mapUser(doc: QueryDocumentSnapshot): BlogUser {
  const data = doc.data() as Record<string, unknown>;
  return {
    uid: doc.id,
    email: typeof data.email === "string" ? data.email : "",
    role: toUserRole(data.role),
    createdAt: toMillis(data.createdAt),
  };
}

/** Lee la lista completa de usuarios registrados (Req 9.1). Sin caché. */
async function fetchUsers(): Promise<BlogUser[]> {
  const snapshot = await db().collection("users").get();
  return snapshot.docs.map(mapUser);
}

/**
 * Componente servidor asíncrono que lee la lista de usuarios de Firestore y
 * monta el Client Component de gestión. Si la lectura falla, muestra un mensaje
 * de error en español sin renderizar una lista parcial.
 */
async function UsersPanel() {
  let users: BlogUser[];
  try {
    users = await fetchUsers();
  } catch {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-200"
      >
        <p className="font-semibold text-red-100">
          No se pudieron cargar los usuarios
        </p>
        <p className="mt-1">
          No fue posible obtener la lista de usuarios desde el almacén de datos.
          Vuelve a intentarlo más tarde.
        </p>
      </div>
    );
  }

  return <UsersManagerClient users={users} />;
}

/**
 * Página de gestión de Usuarios del Panel_Admin. Server Component que compone la
 * lectura de usuarios tras un límite `<Suspense>` para transmitir un indicador
 * de carga mientras se consulta Firestore.
 */
export default function AdminUsersPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className={`mb-1 text-2xl font-bold ${ACCENT}`}>
          Gestión de usuarios
        </h2>
        <p className="mb-0 text-sm text-gray-400">
          Suscriptores del Blog: consulta, búsqueda, cambio de rol y
          eliminación.
        </p>
      </div>

      <Suspense
        fallback={
          <div className={`rounded-lg ${CARD_BG} p-6 text-gray-300 shadow-xl`}>
            <span aria-label="Cargando usuarios">Cargando usuarios…</span>
          </div>
        }
      >
        <UsersPanel />
      </Suspense>
    </div>
  );
}
