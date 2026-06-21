/**
 * Instant loading UI del segmento de listado del Blog (`/blog`).
 *
 * Según los guías del Next.js modificado (convención de `loading.tsx`), este
 * archivo es un Server Component que envuelve la página en un `<Suspense>`; su
 * contenido se transmite de inmediato mientras `page.tsx` espera la lectura de
 * Firestore. Imita el estilo de esqueleto/encabezado de
 * `app/mejor-ruta/loading.tsx` para que el armazón aparezca al instante.
 *
 * _Requirements: 1.1 (estado de carga del listado)_
 */
export default function Loading() {
  // Número de tarjetas-esqueleto: coincide aproximadamente con una página llena.
  const placeholders = Array.from({ length: 6 });

  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera estable, idéntica a la del listado real. */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            BLOG
          </h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ul className="flex flex-col gap-4">
          {placeholders.map((_, index) => (
            <li
              key={index}
              className="rounded-lg border border-[#1e4a6e] bg-[#0a1929] p-5"
            >
              <div className="animate-pulse">
                {/* Título */}
                <div className="h-5 w-2/3 rounded bg-[#143a52]" />
                {/* Fecha */}
                <div className="mt-3 h-3 w-32 rounded bg-[#143a52]/70" />
                {/* Categorías */}
                <div className="mt-4 flex gap-2">
                  <div className="h-4 w-16 rounded bg-[#143a52]/70" />
                  <div className="h-4 w-20 rounded bg-[#143a52]/70" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
