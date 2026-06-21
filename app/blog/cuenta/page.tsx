import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/lib/blog/session";
import AuthPanel from "./AuthPanel";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "Tu cuenta | Blog | Guía de Star Citizen",
  description:
    "Crea una cuenta o inicia sesión para comentar y dar «me gusta» en las entradas del Blog de la Guía no oficial de Star Citizen.",
};

/**
 * Página de cuenta del Blog (Server Component): registro, inicio y cierre de
 * sesión (tarea 6.3).
 *
 * Plataforma (Next.js 16 modificado):
 * - `export const unstable_instant = false`. Esta página lee la cookie de
 *   sesión (`getCurrentUser` → `cookies()`) y resuelve datos específicos del
 *   usuario, por lo que es dinámica; la guía de navegación instantánea
 *   (`docs/01-app/02-guides/instant-navigation.md`, «Opting out with
 *   `instant = false`») exime de la validación de shell instantáneo a las rutas
 *   que leen cookies y datos de usuario. Sigue el mismo criterio que
 *   `app/admin/layout.tsx`.
 *
 * Estado autenticado entre recargas (Req 3.7): la cookie de sesión `HttpOnly`
 * que establecen las Server Actions persiste la sesión; en cada carga esta
 * página la lee con `getCurrentUser` y muestra el estado correspondiente.
 *
 * @see Requirements 3.1, 3.2, 3.3, 3.6, 3.7, 3.9
 */
// NOTA (plataforma): se omite `export const unstable_instant = false` porque ese
// export solo es válido con *Cache Components* habilitado (`nextConfig.cacheComponents`),
// que este proyecto NO activa; exportarlo rompe el build. Esta página es dinámica
// (lee la cookie de sesión) y se renderiza en cada petición de todos modos.

export default async function CuentaPage() {
  // Lee la sesión actual desde la cookie (Req 3.7). `null` si no hay sesión.
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            TU CUENTA
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Crea una cuenta o inicia sesión para comentar y dar «me gusta» en el
            Blog.
          </p>
        </div>
      </div>

      <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full max-w-md rounded-lg border border-[#1e4a6e] bg-[#0F2C3E] p-6 shadow-xl">
          {user ? (
            // Estado autenticado: sesión activa (Req 3.2, 3.7) + cierre (Req 3.6).
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-[#1e4a6e] flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <p className="text-gray-300">Has iniciado sesión como</p>
                <p className="text-lg font-semibold text-[#9ED0FA] break-all">
                  {user.email ?? "usuario"}
                </p>
              </div>
              <LogoutButton />
              <Link
                href="/blog"
                className="text-sm text-[#9ED0FA] hover:underline"
              >
                Volver al Blog
              </Link>
            </div>
          ) : (
            // Estado no autenticado: formularios de inicio de sesión y registro.
            <AuthPanel defaultTab="login" />
          )}
        </div>
      </div>
    </div>
  );
}
