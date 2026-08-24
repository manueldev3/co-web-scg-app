import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guías de Comercio | SCG - Guía de Star Citizen",
  description:
    "Guías y tutoriales de comercio para Star Citizen. Aprende a comerciar, maximizar ganancias, elegir rutas rentables y dominar la logística de carga en el universo.",
};

type Guide = {
  slug: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  readTime: string;
  tags: string[];
};

const GUIDES: Guide[] = [
  {
    slug: "como-empezar-en-comercio",
    icon: <span className="text-3xl">&#128640;</span>,
    title: "Cómo empezar en comercio en Star Citizen",
    summary:
      "Todo lo que un piloto nuevo necesita saber para dar sus primeros pasos en el comercio: desde elegir tu primera nave de carga hasta completar tu primera ruta rentable.",
    readTime: "8 min",
    tags: ["Principiante", "Comercio", "Naves"],
  },
  {
    slug: "maximizar-ganancias-por-viaje",
    icon: <span className="text-3xl">&#128176;</span>,
    title: "Cómo maximizar tus ganancias por viaje",
    summary:
      "Estrategias avanzadas para exprimir cada SCU de tu bodega: diversificación de carga, rutas multi-parada y gestión del capital para pilotos intermedios.",
    readTime: "10 min",
    tags: ["Intermedio", "Estrategia", "Rentabilidad"],
  },
  {
    slug: "seguridad-en-rutas-comerciales",
    icon: <span className="text-3xl">&#128737;</span>,
    title: "Seguridad en rutas comerciales",
    summary:
      "Cómo proteger tu inversión en las rutas de comercio: evaluación de riesgos, zonas peligrosas, escolta y buenas prácticas para minimizar pérdidas.",
    readTime: "7 min",
    tags: ["Seguridad", "PvP", "Consejos"],
  },
];

export default function GuiasPage() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#9ED0FA] tracking-wide flex items-center gap-3">
            <span>&#128214;</span>
            Guías de Comercio
          </h1>
          <p className="mt-2 text-gray-300 max-w-2xl">
            Aprende a comerciar de forma inteligente en Star Citizen. Desde los
            conceptos básicos hasta estrategias avanzadas para maximizar cada
            viaje.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Introducción editorial */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Aprende antes de despegar
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            El comercio en Star Citizen es una de las profesiones más
            gratificantes del juego, pero también una de las más complejas. Los
            precios fluctúan constantemente, cada terminal tiene sus propias
            existencias y demanda, y las rutas más rentables cambian con cada
            parche. Estas guías están escritas para ayudarte a entender los
            fundamentos, desarrollar tu intuición comercial y tomar decisiones
            informadas, ya seas un piloto nuevo o un cargador veterano.
          </p>
          <p className="text-[#BCBEC0] leading-relaxed">
            Combinamos la experiencia de juego con los datos reales de la
            comunidad (vía UEX Corp) para ofrecerte contenido práctico que
            puedes aplicar directamente en tus sesiones de juego. Las guías se
            actualizan con cada cambio importante en la economía del juego.
          </p>
        </section>

        {/* Lista de guías */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Guías disponibles
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guias/${guide.slug}`}
                className="group block rounded-xl border border-[#143A52] bg-[#071421] p-6 no-underline transition-colors hover:border-[#9ED0FA]/50 hover:bg-[#0a1929]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0F2C3E] text-[#9ED0FA] group-hover:bg-[#143A52]">
                    {guide.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold text-white group-hover:text-[#9ED0FA]">
                        {guide.title}
                      </h3>
                      <span className="shrink-0 text-xs text-gray-400 mt-1">
                        {guide.readTime}
                      </span>
                    </div>
                    <p className="text-sm text-[#BCBEC0] leading-relaxed">
                      {guide.summary}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {guide.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#0F2C3E] px-2.5 py-0.5 text-xs text-[#9ED0FA]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Próximamente */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Más guías en camino
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            Estamos trabajando en más contenido: guías sobre naves de carga
            recomendadas por presupuesto, mecánicas de oferta y demanda, cómo
            interpretar los datos de UEX Corp, y estrategias para el comercio en
            grupo. Si hay un tema que te interesa,{" "}
            <Link
              href="/contacto"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              cuéntanos
            </Link>{" "}
            y lo priorizaremos.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-[#1e4a6e] bg-gradient-to-r from-[#0a1929] to-[#0F2C3E] p-6 text-center space-y-3">
          <h3 className="text-lg font-semibold text-white">
            ¿Listo para poner en práctica lo aprendido?
          </h3>
          <p className="text-sm text-gray-300">
            Usa nuestra calculadora de rutas para encontrar la ruta más
            rentable según tu nave y capital.
          </p>
          <Link
            href="/mejor-ruta"
            className="inline-block rounded-md bg-[#4a9eda] px-5 py-2 font-semibold text-[#0A1D29] no-underline transition-colors hover:bg-[#9ED0FA]"
          >
            Calcular mi mejor ruta
          </Link>
        </section>

        {/* Aviso */}
        <section className="space-y-3 border-t border-gray-700 pt-6">
          <p className="text-xs text-[#82919E]">
            SCG es una herramienta no oficial para Star Citizen y no está
            afiliada, asociada, autorizada ni respaldada por Cloud Imperium
            Games. Todas las marcas, nombres y contenidos de Star Citizen son
            propiedad de sus respectivos dueños.
          </p>
        </section>
      </div>
    </div>
  );
}
