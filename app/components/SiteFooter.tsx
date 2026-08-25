import Link from "next/link";

// SVG icons for social platforms not available in @ant-design/icons
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

// Static Server Component: no "use client", no client interactivity.
// Rendered by the root layout so it appears on every page (Requirement 9.1).
export default function SiteFooter() {
  return (
    <footer className="bg-[#0F2C3E] border-t border-gray-700 text-[#82919E] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
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
            Herramientas
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
            <li>
              <Link
                href="/wiki"
                className="hover:text-[#9ED0FA] no-underline"
              >
                Wiki
              </Link>
            </li>
            <li>
              <Link
                href="/guias"
                className="hover:text-[#9ED0FA] no-underline"
              >
                Guías
              </Link>
            </li>
          </ul>
        </nav>

        {/* Community section */}
        <section aria-label="Comunidad" className="space-y-2">
          <h2 className="text-[#BCBEC0] text-sm font-semibold uppercase tracking-wide">
            Comunidad
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="https://discord.com/invite/C5J52cKgF6"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#9ED0FA] no-underline inline-flex items-center gap-2"
              >
                <DiscordIcon />
                Discord
              </Link>
            </li>
            <li>
              <Link
                href="https://www.twitch.tv/tioatlasgamer"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#9ED0FA] no-underline inline-flex items-center gap-2"
              >
                <TwitchIcon />
                Twitch
              </Link>
            </li>
            <li>
              <Link
                href="https://www.tiktok.com/@atlas.cargo.i"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#9ED0FA] no-underline inline-flex items-center gap-2"
              >
                <TikTokIcon />
                TikTok
              </Link>
            </li>
            <li>
              <Link
                href="https://robertsspaceindustries.com/en/orgs/ACIN"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#9ED0FA] no-underline inline-flex items-center gap-2"
              >
                <RocketIcon />
                Organización ACIN
              </Link>
            </li>
            <li>
              <Link
                href="https://robertsspaceindustries.com/en/enlist?referral=STAR-5HYJ-THXD"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#9ED0FA] no-underline inline-flex items-center gap-2"
              >
                <GiftIcon />
                Código de referido
              </Link>
            </li>
          </ul>
        </section>

        {/* Contact section (Requirement 9.3) */}
        <section aria-label="Contacto" className="space-y-2">
          <h2 className="text-[#BCBEC0] text-sm font-semibold uppercase tracking-wide">
            Información
          </h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/sobre-nosotros"
                className="hover:text-[#9ED0FA] no-underline"
              >
                Sobre nosotros
              </Link>
            </li>
            <li>
              <Link
                href="/contacto"
                className="hover:text-[#9ED0FA] no-underline"
              >
                Contacto
              </Link>
            </li>
            <li>
              <Link
                href="mailto:manueldev3@gmail.com"
                className="hover:text-[#9ED0FA] no-underline"
              >
                manueldev3@gmail.com
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <div className="border-t border-gray-700">
        <nav
          aria-label="Enlaces legales"
          className="max-w-6xl mx-auto px-4 pt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs"
        >
          <Link
            href="/politica-de-privacidad"
            className="hover:text-[#9ED0FA] no-underline"
          >
            Política de Privacidad
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/terminos-y-condiciones"
            className="hover:text-[#9ED0FA] no-underline"
          >
            Términos y Condiciones
          </Link>
        </nav>
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
