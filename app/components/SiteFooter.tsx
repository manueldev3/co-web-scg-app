import Link from "next/link";

// Static Server Component: no "use client", no client interactivity.
// Rendered by the root layout so it appears on every page (Requirement 9.1).
export default function SiteFooter() {
  return (
    <footer className="bg-[#0F2C3E] border-t border-gray-700 text-[#82919E] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Disclaimer (Requirement 9.2) */}
        <section aria-label="Aviso legal" className="space-y-2">
          <h2 className="text-[#BCBEC0] text-sm font-semibold uppercase tracking-wide">
            Aviso
          </h2>
          <p className="text-sm leading-relaxed">
            SCG es una herramienta no oficial para Star Citizen y no está
            afiliada, asociada, autorizada ni respaldada por Cloud Imperium
            Games. Todas las marcas, nombres y contenidos de Star Citizen son
            propiedad de sus respectivos dueños.
          </p>
        </section>

        {/* Links section (Requirement 9.3) */}
        <nav aria-label="Enlaces" className="space-y-2">
          <h2 className="text-[#BCBEC0] text-sm font-semibold uppercase tracking-wide">
            Enlaces
          </h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/" className="hover:text-[#9ED0FA] no-underline">
                Inicio
              </Link>
            </li>
            <li>
              <Link
                href="/mercancia"
                className="hover:text-[#9ED0FA] no-underline"
              >
                Mercancía
              </Link>
            </li>
            <li>
              <Link
                href="/mejor-ruta"
                className="hover:text-[#9ED0FA] no-underline"
              >
                Mejor Ruta
              </Link>
            </li>
            <li>
              <Link
                href="/organizador-de-carga"
                className="hover:text-[#9ED0FA] no-underline"
              >
                Organizador de carga
              </Link>
            </li>
          </ul>
        </nav>

        {/* Contact section (Requirement 9.3) */}
        <section aria-label="Contacto" className="space-y-2">
          <h2 className="text-[#BCBEC0] text-sm font-semibold uppercase tracking-wide">
            Contacto
          </h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="mailto:manueldev3@gmail.com"
                className="hover:text-[#9ED0FA] no-underline"
              >
                manueldev3@gmail.com
              </Link>
            </li>
            <li>
              <Link
                href="https://scg.manueldeveloper.com/app"
                className="hover:text-[#9ED0FA] no-underline"
              >
                SCG App
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <div className="border-t border-gray-700">
        <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-center">
          © {new Date().getFullYear()} SCG. Guía de Star Citizen. Herramienta no
          oficial, sin afiliación con Cloud Imperium Games. Hecho con ❤️ por{" "}
          <Link
            href="https://manueldeveloper.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
          >
            Manuel Fernández
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
