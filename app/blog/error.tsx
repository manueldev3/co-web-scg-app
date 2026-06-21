"use client"; // Las fronteras de error DEBEN ser Client Components.

import { useEffect } from "react";
import { Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

/**
 * Frontera de error del segmento de listado del Blog (`/blog`).
 *
 * Cubre el Req 1.12: si la recuperación de las entradas desde el almacén de
 * datos falla (p. ej. `getPublishedPosts` lanza en `page.tsx`), Next.js
 * reemplaza TODO el segmento por este componente, de modo que nunca se muestra
 * un listado parcial. Aquí se muestra un mensaje de error en español y un botón
 * para reintentar la carga.
 *
 * --- Restricción de plataforma (Next.js 16 modificado) ---
 * Según `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md`,
 * en esta versión modificada de Next.js el componente `error.tsx` recibe las
 * props `error` y `unstable_retry` (NO `reset`). `unstable_retry` es una
 * función `() => void` que reintenta la obtención de datos y vuelve a renderizar
 * el segmento. Cita literal de la documentación:
 *
 *   export default function ErrorPage({ error, unstable_retry }: {
 *     error: Error & { digest?: string }
 *     unstable_retry: () => void
 *   }) { ... <button onClick={() => unstable_retry()}>Try again</button> ... }
 */
export default function BlogListError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Registrar el error para diagnóstico (no se expone el detalle al usuario).
    console.error("Error al cargar el listado del Blog:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera estable, igual que en el listado y en la carga. */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            BLOG
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7f3b3b]">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-200">
          No se pudo cargar el contenido
        </h2>
        <p className="mb-6 max-w-md text-gray-400">
          Ha ocurrido un problema al obtener las entradas del Blog. No se ha
          mostrado ninguna entrada para evitar un listado incompleto. Inténtalo
          de nuevo en unos instantes.
        </p>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => unstable_retry()}
        >
          Reintentar
        </Button>
      </div>
    </div>
  );
}
