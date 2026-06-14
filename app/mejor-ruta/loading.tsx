/**
 * Instant loading UI for the `/mejor-ruta` route segment.
 *
 * Per the modified Next.js guides (`03-api-reference/.../loading.md` and
 * `06-fetching-data.md`), this `loading.tsx` is a Server Component by default
 * and wraps the page in a `<Suspense>` boundary, streaming this fallback the
 * moment the user navigates while `page.tsx` awaits the server-side market
 * fetch. It mirrors the spinner style of `app/mercancia/[name]/loading.tsx`
 * and previews the "MEJOR RUTA" header so the shell appears immediately.
 *
 * _Requirements: 7.3, 10.1_
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Header preview matches the RouteFinder header bar for a stable shell */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            MEJOR RUTA
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1e4a6e] border-t-[#9ED0FA] mb-4" />
        <p className="text-gray-400 text-center">
          Cargando datos de mercado...
        </p>
      </div>
    </div>
  );
}
