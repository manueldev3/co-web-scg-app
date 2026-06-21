import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/blog/session";

/**
 * Proxy (Next.js 16 modificado).
 *
 * Plataforma: desde Next.js 16 el antiguo «Middleware» se llama **Proxy** y
 * vive en un único archivo `proxy.ts` en la raíz del proyecto. Se exporta una
 * función `proxy(request)` y un objeto `config` con `matcher` para acotar las
 * rutas en las que se ejecuta.
 * Fuente: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
 *
 * Propósito (Req 6.5): comprobación **optimista** del acceso a `/admin`. Cuando
 * una petición apunta a una ruta bajo `/admin` (excepto el propio formulario de
 * inicio de sesión `/admin/login`) y no hay **indicio** de la cookie de sesión,
 * se redirige a `/admin/login`.
 *
 * IMPORTANTE: esto NO es autorización. La documentación advierte que el Proxy
 * no debe usarse como solución completa de gestión de sesión/autorización y es
 * adecuado solo para «comprobaciones optimistas». Aquí únicamente se comprueba
 * la **presencia** de la cookie, sin verificar el token. La verificación
 * autoritativa (ID token + custom claim `admin === true`) ocurre en el servidor
 * dentro de `app/admin/layout.tsx` (vía `lib/blog/session.ts` + Admin SDK).
 */

/** Ruta del formulario de inicio de sesión de administrador. */
const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Cabecera de petición con el `pathname` actual. El layout `app/admin/layout.tsx`
 * la lee (vía `headers()`) para distinguir la ruta de login del resto de vistas
 * del Panel_Admin, ya que los layouts no reciben el `pathname` por props. La
 * documentación del Proxy contempla «modifying request headers».
 */
const ADMIN_PATHNAME_HEADER = "x-admin-pathname";

/**
 * Deja pasar la petición reenviando el `pathname` actual en una cabecera de
 * petición, de modo que el guard del servidor (layout de `/admin`) pueda
 * identificar la ruta destino sin recibirla por props.
 */
function allowWithPathname(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ADMIN_PATHNAME_HEADER, request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // El propio formulario de login debe ser siempre accesible: nunca se redirige
  // a sí mismo (evita un bucle de redirecciones).
  if (pathname === ADMIN_LOGIN_PATH) {
    return allowWithPathname(request);
  }

  // Indicio optimista de sesión: presencia (no validez) de la cookie `__session`.
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!hasSessionCookie) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Hay indicio de sesión: se deja pasar. La autorización real se valida en el
  // servidor (layout de `/admin`).
  return allowWithPathname(request);
}

/**
 * Acota el Proxy a las rutas de `/admin` (incluida la base `/admin` y todas sus
 * subrutas). Fuera de `/admin` el Proxy no se ejecuta.
 * Fuente: sección «Matcher» del doc de Proxy.
 */
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
