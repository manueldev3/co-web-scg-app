/**
 * Estado de carga instantáneo para el segmento `/wiki`.
 *
 * Según las guías de esta versión modificada de Next.js
 * (`06-fetching-data.md` y la convención de `loading.js`), este `loading.tsx`
 * es un Server Component por defecto y Next lo envuelve automáticamente en un
 * `<Suspense>` alrededor de `page.tsx`, mostrando este fallback mientras la
 * landing resuelve la carga de los elementos buscables. Reutiliza los tokens
 * visuales oscuros del sitio y refleja la cabecera "WIKI" para una shell
 * estable, siguiendo el patrón de `app/mejor-ruta/loading.tsx`.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            WIKI
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1e4a6e] border-t-[#9ED0FA] mb-4" />
        <p className="text-gray-400 text-center">Cargando la wiki...</p>
      </div>
    </div>
  );
}
