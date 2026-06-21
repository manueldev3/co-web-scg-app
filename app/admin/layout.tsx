import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isCurrentUserAdmin } from "@/lib/blog/session";

/**
 * Layout del Panel de administración (`/admin`) — guard de sesión admin.
 *
 * Plataforma (Next.js 16 modificado):
 *
 * - `export const unstable_instant = false`. La guía de navegación instantánea
 *   (`node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`,
 *   sección «Opting out with `instant = false`») indica textualmente:
 *   «Not every layout can be instant. A dashboard layout that reads cookies and
 *   fetches user-specific data might be too dynamic for the first entry. You can
 *   set `instant = false` on that layout to exempt it from validation».
 *   Este layout lee la cookie de sesión (`getCurrentUser` → `cookies()`) y
 *   resuelve datos específicos del usuario (el custom claim `admin`), por lo que
 *   es dinámico y se exime de la validación de shell instantáneo. La exención no
 *   impide validar navegaciones internas marcando `instant` en segmentos hijos.
 *
 * - `headers()` de `next/headers` es asíncrono y debe esperarse (`await`), igual
 *   que `cookies()` en `lib/blog/session.ts`.
 *
 * - `redirect()` se importa de `next/navigation`. Según la guía de redirecciones
 *   (`docs/01-app/02-guides/redirecting.md`), puede invocarse en Server
 *   Components y lanza internamente, por lo que no debe envolverse en `try/catch`.
 *
 * Autorización autoritativa (Req 6.4, 6.8): la comprobación real de privilegios
 * ocurre aquí, en el servidor, verificando que el custom claim `admin` sea
 * exactamente `true` mediante `isCurrentUserAdmin()` (Admin SDK, vía
 * `lib/blog/session.ts`). El `proxy.ts` solo hace una comprobación optimista de
 * la presencia de la cookie y no es autoritativo.
 *
 * Excepción del formulario de login: este layout envuelve TODAS las rutas bajo
 * `/admin`, incluido el propio `/admin/login`. El formulario de inicio de sesión
 * debe ser accesible para visitantes no autenticados; si el guard redirigiera
 * `/admin/login` a sí mismo se produciría un bucle de redirecciones. Como los
 * layouts no reciben el `pathname` por props, se determina la ruta actual a
 * partir de la cabecera de petición `x-admin-pathname`, que `proxy.ts` inyecta
 * en cada petición a `/admin` (la documentación del Proxy contempla «modifying
 * request headers»). Para la ruta de login se omite el guard y se renderiza el
 * contenido; para cualquier otra ruta de `/admin` se exige claim de admin válido.
 */

// NOTA (plataforma): el diseño contemplaba `export const unstable_instant = false`
// para eximir este layout dinámico de la validación de navegación instantánea.
// Sin embargo, ese export SOLO es válido con *Cache Components* habilitado
// (`nextConfig.cacheComponents`), que este proyecto NO activa (usa el modelo de
// `revalidate`/`unstable_cache`). Exportarlo rompe el build con
// «Route segment config "unstable_instant" requires nextConfig.cacheComponents
// to be enabled». Como sin Cache Components no hay validación de shell instantáneo
// de la que eximirse, simplemente se omite el export. La autorización dinámica de
// este layout (lectura de cookie + claim admin) sigue siendo correcta.

/** Ruta del formulario de inicio de sesión de administrador. */
const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Cabecera de petición con el `pathname` actual, inyectada por `proxy.ts`.
 * Permite que este layout (que no recibe `pathname` por props) distinga la ruta
 * de login del resto de vistas del Panel_Admin.
 */
const ADMIN_PATHNAME_HEADER = "x-admin-pathname";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get(ADMIN_PATHNAME_HEADER) ?? "";
  const isLoginRoute = pathname === ADMIN_LOGIN_PATH;

  // El formulario de login es accesible para cualquiera (Req 6.4): sin esta
  // excepción, redirigir `/admin/login` → `/admin/login` crearía un bucle.
  if (!isLoginRoute) {
    const isAdmin = await isCurrentUserAdmin();

    // Sin claim `admin === true` no se renderiza ninguna vista del Panel_Admin
    // distinta del login (Req 6.8); se redirige al formulario de inicio de
    // sesión de administrador (Req 6.4).
    if (!isAdmin) {
      redirect(ADMIN_LOGIN_PATH);
    }
  }

  return <>{children}</>;
}
