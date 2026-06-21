// UI de «recurso no encontrado» del detalle del Blog (Req 2.6, 2.7).
//
// Se renderiza cuando `app/blog/[slug]/page.tsx` invoca `notFound()` porque el
// slug no corresponde a ninguna entrada o la entrada está en `borrador`.
// Convención de Next.js 16: archivo `not-found.tsx` en el segmento de ruta
// (ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`).
// Por defecto es un Server Component y no recibe props.

import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
      <p className="mb-2 text-6xl font-bold text-[#1e4a6e]">404</p>
      <h1 className="mb-3 text-2xl font-bold text-white tracking-wide">
        Entrada no encontrada
      </h1>
      <p className="mb-8 max-w-md text-base text-[#82919E]">
        La entrada que buscas no existe o todavía no está publicada.
      </p>
      <Link
        href="/blog"
        className="rounded-md border border-[#1e4a6e] px-5 py-2.5 text-[#9ED0FA] transition-colors hover:bg-[#1e4a6e] hover:text-white"
      >
        Volver al blog
      </Link>
    </div>
  );
}
