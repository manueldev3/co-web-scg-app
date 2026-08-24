import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre Nosotros | SCG - Guía de Star Citizen",
  description:
    "Conoce SCG, la guía de comercio para Star Citizen. Quiénes somos, nuestra misión, las herramientas que ofrecemos y cómo ayudamos a pilotos de carga a maximizar sus ganancias.",
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#9ED0FA] tracking-wide">
            Sobre SCG
          </h1>
          <p className="mt-2 text-gray-300 max-w-2xl">
            La guía de comercio lucrativo para pilotos de Star Citizen
          </p>
        </div>
      </div>

      <article className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Misión */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-[#9ED0FA]">&#127760;</span>
            Nuestra misión
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            SCG (Star Citizen Guide) nació con un objetivo claro: ofrecer a los
            pilotos de carga de Star Citizen las herramientas que necesitan para
            comerciar de forma inteligente y rentable. En un universo donde los
            precios cambian, las rutas varían y la logística es compleja, tener
            información actualizada y bien organizada marca la diferencia entre
            un viaje lucrativo y una pérdida de tiempo.
          </p>
          <p className="text-[#BCBEC0] leading-relaxed">
            Creemos que todo piloto, ya sea veterano o recién llegado al
            comercio, merece acceso libre y gratuito a herramientas de calidad
            que le permitan planificar sus operaciones con confianza. Por eso
            SCG es completamente gratuito, sin necesidad de registro y sin
            límites de uso.
          </p>
        </section>

        {/* Qué ofrecemos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-[#9ED0FA]">&#10084;</span>
            Qué ofrecemos
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            SCG es un conjunto de herramientas especializadas en el comercio
            dentro de Star Citizen. Cada una aborda un aspecto distinto del
            flujo de trabajo de un piloto de carga:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="rounded-xl border border-[#143A52] bg-[#071421] p-5 space-y-2">
              <span className="text-2xl text-[#9ED0FA]">&#128200;</span>
              <h3 className="font-semibold text-white">Mercancía</h3>
              <p className="text-sm text-[#BCBEC0]">
                Consulta precios de compra y venta en tiempo real en todas las
                terminales del universo. Descubre dónde comprar barato y dónde
                vender caro.
              </p>
            </div>
            <div className="rounded-xl border border-[#143A52] bg-[#071421] p-5 space-y-2">
              <span className="text-2xl text-[#9ED0FA]">&#128268;</span>
              <h3 className="font-semibold text-white">Mejor Ruta</h3>
              <p className="text-sm text-[#BCBEC0]">
                Calcula automáticamente las rutas de comercio más rentables
                según tu nave, tu inversión y tus preferencias de filtrado.
              </p>
            </div>
            <div className="rounded-xl border border-[#143A52] bg-[#071421] p-5 space-y-2">
              <span className="text-2xl text-[#9ED0FA]">&#128230;</span>
              <h3 className="font-semibold text-white">Organizador de carga</h3>
              <p className="text-sm text-[#BCBEC0]">
                Distribuye la carga de tu bodega entre múltiples destinos para
                aprovechar al máximo cada SCU disponible.
              </p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-[#9ED0FA]">&#128101;</span>
            De dónde vienen los datos
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            Toda la información de mercado que muestra SCG (precios,
            existencias, terminales y naves) proviene de la{" "}
            <Link
              href="https://uexcorp.space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              API pública de UEX Corp
            </Link>
            , una fuente de datos mantenida por la comunidad de jugadores de
            Star Citizen. Estos datos son aportados de forma colaborativa
            («crowdsourced») y se actualizan con frecuencia, aunque pueden no
            coincidir exactamente con los valores en los servidores en vivo del
            juego.
          </p>
          <p className="text-[#BCBEC0] leading-relaxed">
            SCG procesa esos datos con algoritmos propios para ofrecer cálculos
            de rutas, comparaciones de precios y recomendaciones que van más
            allá de lo que cualquier jugador podría hacer manualmente. Nuestro
            motor de rutas evalúa miles de combinaciones de compra/venta para
            encontrar las más rentables según las restricciones de cada piloto.
          </p>
        </section>

        {/* Quién hay detrás */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Quién hay detrás de SCG
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            SCG es un proyecto personal creado y mantenido por{" "}
            <Link
              href="https://manueldeveloper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              Manuel Fernández
            </Link>
            , desarrollador web y piloto de Star Citizen. Lo que empezó como una
            necesidad propia — querer calcular la mejor ruta de comercio sin
            hojas de cálculo complicadas — se convirtió en una herramienta
            abierta para toda la comunidad hispanohablante de Star Citizen.
          </p>
          <p className="text-[#BCBEC0] leading-relaxed">
            El proyecto se desarrolla de forma independiente y se financia
            mediante publicidad, lo que permite mantenerlo gratuito y sin
            necesidad de suscripciones o pagos por parte de los usuarios.
          </p>
        </section>

        {/* Comunidad */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Para la comunidad
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            Star Citizen es un juego complejo, especialmente en lo que respecta
            al comercio. Los precios fluctúan, las terminales tienen distintas
            existencias, las naves tienen diferentes capacidades y las rutas más
            rentables cambian constantemente. SCG existe para simplificar esa
            complejidad y permitir que cualquier piloto, sin importar su
            experiencia, pueda tomar decisiones informadas.
          </p>
          <p className="text-[#BCBEC0] leading-relaxed">
            Si tienes sugerencias, encuentras errores o simplemente quieres
            saludar, no dudes en{" "}
            <Link
              href="/contacto"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              escribirnos
            </Link>
            . Este proyecto crece gracias al feedback de la comunidad.
          </p>
        </section>

        {/* Aviso legal */}
        <section className="space-y-3 border-t border-gray-700 pt-6">
          <p className="text-xs text-[#82919E]">
            SCG es una herramienta no oficial para Star Citizen y no está
            afiliada, asociada, autorizada ni respaldada por Cloud Imperium
            Games. Todas las marcas, nombres y contenidos de Star Citizen son
            propiedad de sus respectivos dueños.
          </p>
        </section>
      </article>
    </div>
  );
}
