import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cómo empezar en comercio en Star Citizen | SCG - Guías",
  description:
    "Guía completa para principiantes sobre comercio en Star Citizen. Aprende a elegir tu nave de carga, planificar tu primera ruta, gestionar tu inversión y maximizar ganancias desde el primer viaje.",
};

export default function ComoEmpezarEnComercioPage() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera del artículo */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
          <Link
            href="/guias"
            className="text-sm text-[#9ED0FA] hover:text-[#bde0ff] no-underline mb-3 inline-block"
          >
            &larr; Volver a Guías
          </Link>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide leading-tight">
            Cómo empezar en comercio en Star Citizen
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span>8 min de lectura</span>
            <span aria-hidden="true">·</span>
            <span>Nivel: Principiante</span>
            <span aria-hidden="true">·</span>
            <span>Actualizado: Agosto 2026</span>
          </div>
        </div>
      </div>

      <article className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-[#BCBEC0] leading-relaxed">
        {/* Introducción */}
        <section className="space-y-4">
          <p className="text-lg">
            El comercio es una de las formas más accesibles de ganar dinero en
            Star Citizen. No necesitas ser un as del combate ni tener la nave
            más cara del juego: con un poco de capital inicial, una nave con
            bodega y las decisiones correctas, puedes generar ingresos
            consistentes desde tu primera sesión. Esta guía te lleva paso a
            paso por todo lo que necesitas saber.
          </p>
        </section>

        {/* Índice */}
        <nav className="rounded-xl border border-[#143A52] bg-[#071421] p-5 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9ED0FA]">
            En esta guía
          </h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-[#BCBEC0]">
            <li>Qué es el comercio en Star Citizen</li>
            <li>Requisitos para empezar</li>
            <li>Elegir tu primera nave de carga</li>
            <li>Entender precios, oferta y demanda</li>
            <li>Planificar tu primera ruta</li>
            <li>Ejecutar la ruta paso a paso</li>
            <li>Gestionar tu capital</li>
            <li>Errores comunes y cómo evitarlos</li>
            <li>Siguientes pasos</li>
          </ol>
        </nav>

        {/* 1. Qué es el comercio */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            1. Qué es el comercio en Star Citizen
          </h2>
          <p>
            El comercio (o «hauling») en Star Citizen consiste en comprar
            mercancías en una terminal a precio bajo y venderlas en otra
            terminal a precio más alto. La diferencia entre lo que pagas y lo
            que recibes es tu beneficio. Es un concepto simple, pero la
            profundidad viene de las variables que influyen en la rentabilidad:
            los precios fluctúan, las terminales tienen existencias limitadas,
            tu nave tiene una capacidad máxima y tu capital determina cuánto
            puedes cargar.
          </p>
          <p>
            A diferencia del combate o la minería, el comercio requiere poca
            habilidad de pilotaje y puede realizarse en sesiones cortas o
            largas. Es ideal para jugadores que prefieren la planificación y la
            logística por encima de la acción frenética.
          </p>
        </section>

        {/* 2. Requisitos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            2. Requisitos para empezar
          </h2>
          <p>Para comenzar a comerciar necesitas tres cosas:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium text-white">Una nave con bodega de carga:</span>{" "}
              cualquier nave que tenga capacidad de carga en SCU (Standard Cargo
              Units) sirve. No necesitas empezar con algo grande.
            </li>
            <li>
              <span className="font-medium text-white">Capital inicial (aUEC):</span>{" "}
              necesitas dinero para comprar mercancía. Puedes empezar con tan
              poco como 5.000-10.000 aUEC, aunque tener más amplía tus
              opciones.
            </li>
            <li>
              <span className="font-medium text-white">Conocimiento de precios:</span>{" "}
              saber dónde comprar barato y dónde vender caro. Aquí es donde
              herramientas como{" "}
              <Link
                href="/mercancia"
                className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
              >
                nuestra sección de Mercancía
              </Link>{" "}
              y la{" "}
              <Link
                href="/mejor-ruta"
                className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
              >
                calculadora de Mejor Ruta
              </Link>{" "}
              te ahorran horas de investigación.
            </li>
          </ul>
        </section>

        {/* 3. Elegir nave */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            3. Elegir tu primera nave de carga
          </h2>
          <p>
            No necesitas una Caterpillar o un C2 Hercules para empezar. De
            hecho, las naves pequeñas tienen ventajas: son baratas de
            reemplazar si las pierdes, consumen poco combustible y son ágiles
            para entrar y salir de zonas complicadas. Aquí algunas opciones
            populares para principiantes:
          </p>
          <div className="rounded-xl border border-[#143A52] bg-[#071421] p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <h4 className="font-medium text-white">Aurora CL</h4>
                <p className="text-xs text-gray-400">
                  3 SCU · Nave starter · Ideal para aprender los fundamentos
                  con inversión mínima.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-white">Avenger Titan</h4>
                <p className="text-xs text-gray-400">
                  8 SCU · Versátil · Buen equilibrio entre combate y comercio
                  para un solo jugador.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-white">Cutlass Black</h4>
                <p className="text-xs text-gray-400">
                  46 SCU · Multirol · Salto significativo en capacidad,
                  accesible in-game.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-white">Freelancer</h4>
                <p className="text-xs text-gray-400">
                  66 SCU · Cargador dedicado · Buena defensa, gran bodega para
                  su tamaño.
                </p>
              </div>
            </div>
          </div>
          <p>
            El principio es simple: empieza con lo que tengas, genera
            beneficios, y ve ahorrando para naves de mayor capacidad cuando tu
            capital lo justifique. Una nave de 46 SCU que siempre va llena es
            más rentable que una de 600 SCU que solo puedes llenar a la mitad.
          </p>
        </section>

        {/* 4. Entender precios */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            4. Entender precios, oferta y demanda
          </h2>
          <p>
            Cada terminal de comercio en Star Citizen tiene su propia tabla de
            precios. Los conceptos clave son:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium text-white">Precio de compra:</span>{" "}
              lo que tú pagas por cada SCU de una mercancía en una terminal.
              Quieres que sea lo más bajo posible.
            </li>
            <li>
              <span className="font-medium text-white">Precio de venta:</span>{" "}
              lo que una terminal te paga por SCU cuando vendes. Quieres que sea
              lo más alto posible.
            </li>
            <li>
              <span className="font-medium text-white">Oferta (SCU disponibles):</span>{" "}
              cuántas unidades puedes comprar en una terminal. Si la oferta es
              menor que tu bodega, no podrás llenarla por completo.
            </li>
            <li>
              <span className="font-medium text-white">Demanda:</span>{" "}
              cuántas unidades está dispuesta a comprar una terminal. Si la
              demanda es baja, puede que no puedas vender toda tu carga de
              golpe.
            </li>
          </ul>
          <p>
            La rentabilidad de una ruta depende de la diferencia entre el
            precio de compra y el de venta, multiplicada por la cantidad de SCU
            que puedes transportar. Nuestra{" "}
            <Link
              href="/mejor-ruta"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              calculadora de rutas
            </Link>{" "}
            hace exactamente este cálculo por ti, considerando tu nave y tu
            inversión disponible.
          </p>
        </section>

        {/* 5. Planificar primera ruta */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            5. Planificar tu primera ruta
          </h2>
          <p>
            Para tu primera ruta comercial, recomendamos seguir estos pasos:
          </p>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              <span className="font-medium text-white">
                Determina tu presupuesto:
              </span>{" "}
              ¿Cuántos aUEC puedes invertir? No inviertas todo: guarda un
              margen para combustible y posibles pérdidas.
            </li>
            <li>
              <span className="font-medium text-white">
                Usa la calculadora:
              </span>{" "}
              ve a{" "}
              <Link
                href="/mejor-ruta"
                className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
              >
                Mejor Ruta
              </Link>
              , selecciona tu nave e introduce tu inversión. El sistema te
              mostrará las rutas más rentables ordenadas por beneficio.
            </li>
            <li>
              <span className="font-medium text-white">
                Elige una ruta segura:
              </span>{" "}
              para empezar, prioriza rutas en zonas de alta seguridad (sistemas
              monitorizados) donde el riesgo de piratería es menor.
            </li>
            <li>
              <span className="font-medium text-white">
                Anota la información:
              </span>{" "}
              qué mercancía, dónde comprar, dónde vender y cuántas unidades
              cargar. Ten todo claro antes de despegar.
            </li>
          </ol>
        </section>

        {/* 6. Ejecutar la ruta */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            6. Ejecutar la ruta paso a paso
          </h2>
          <p>Una vez que tienes tu ruta planificada:</p>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              <span className="font-medium text-white">Viaja a la terminal de compra:</span>{" "}
              usa el Quantum Drive para llegar a la estación o puesto donde
              comprarás la mercancía.
            </li>
            <li>
              <span className="font-medium text-white">Compra la mercancía:</span>{" "}
              dirígete al kiosco de comercio en la terminal. Selecciona la
              mercancía, ajusta la cantidad según tu plan y confirma la compra.
            </li>
            <li>
              <span className="font-medium text-white">Viaja a la terminal de venta:</span>{" "}
              con la carga en tu bodega, haz Quantum hasta la terminal de
              destino. Mantente alerta durante el viaje.
            </li>
            <li>
              <span className="font-medium text-white">Vende la mercancía:</span>{" "}
              en el kiosco de la terminal destino, selecciona la mercancía de
              tu bodega, elige la cantidad y confirma la venta.
            </li>
            <li>
              <span className="font-medium text-white">Repite:</span>{" "}
              con el beneficio obtenido, puedes reinvertir y hacer la misma
              ruta de nuevo o buscar una nueva.
            </li>
          </ol>
        </section>

        {/* 7. Gestionar capital */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            7. Gestionar tu capital
          </h2>
          <p>
            La gestión del dinero es tan importante como elegir una buena ruta.
            Algunas reglas de oro:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium text-white">
                Nunca inviertas el 100% de tu dinero:
              </span>{" "}
              guarda al menos un 20-30% como reserva. Si pierdes la carga por
              un bug, un pirata o un crash, necesitas poder recuperarte.
            </li>
            <li>
              <span className="font-medium text-white">
                Reinvierte los beneficios:
              </span>{" "}
              a medida que ganas, aumenta gradualmente tu inversión por viaje.
              El crecimiento es exponencial si eres consistente.
            </li>
            <li>
              <span className="font-medium text-white">
                Diversifica cuando puedas:
              </span>{" "}
              si tu bodega es grande, considera cargar dos o tres mercancías
              distintas para reducir el riesgo de que una sola ruta falle.
            </li>
            <li>
              <span className="font-medium text-white">
                Conoce tu punto de equilibrio:
              </span>{" "}
              si tu nave de carga costó 1.000.000 aUEC en la tienda del juego,
              calcula cuántos viajes necesitas para «recuperar» esa inversión
              con tus beneficios. Eso te dará perspectiva.
            </li>
          </ul>
        </section>

        {/* 8. Errores comunes */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            8. Errores comunes y cómo evitarlos
          </h2>
          <div className="rounded-xl border border-[#143A52] bg-[#071421] p-5 space-y-4">
            <div className="space-y-1">
              <h4 className="font-medium text-white">
                Invertir todo el dinero de golpe
              </h4>
              <p className="text-sm">
                Un solo viaje fallido te deja sin nada. Siempre mantén una
                reserva.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-white">
                Ignorar la oferta y la demanda
              </h4>
              <p className="text-sm">
                Que una ruta sea muy rentable en teoría no sirve si la terminal
                no tiene stock suficiente o si la demanda es tan baja que no
                puedes vender todo.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-white">
                Comerciar en zonas de baja seguridad sin preparación
              </h4>
              <p className="text-sm">
                Las mejores ganancias suelen estar en zonas peligrosas, pero si
                estás empezando, una emboscada puede arruinarte la sesión.
                Empieza en zonas seguras.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-white">
                No verificar precios en el juego
              </h4>
              <p className="text-sm">
                Los datos de UEX Corp son comunitarios y pueden tener ligeras
                diferencias con el servidor en vivo. Siempre comprueba el
                precio real en el kiosco antes de comprar.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-white">
                Usar una nave demasiado grande para tu capital
              </h4>
              <p className="text-sm">
                Una nave de 600 SCU que solo puedes llenar al 10% es menos
                rentable por viaje que una de 46 SCU que va siempre llena.
                Ajusta tu nave a tu presupuesto.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Siguientes pasos */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            9. Siguientes pasos
          </h2>
          <p>
            Una vez que domines los fundamentos y tengas un flujo de ingresos
            constante, puedes explorar estrategias más avanzadas:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Rutas multi-parada para maximizar cada viaje
            </li>
            <li>
              Comercio de mercancías de alto valor con márgenes mayores pero
              mayor riesgo
            </li>
            <li>
              Uso del{" "}
              <Link
                href="/organizador-de-carga"
                className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
              >
                Organizador de carga
              </Link>{" "}
              para distribuir mercancías entre múltiples destinos
            </li>
            <li>
              Comercio en grupo con escolta para zonas de baja seguridad
            </li>
            <li>
              Diversificación hacia minería + comercio para generar tu propia
              mercancía
            </li>
          </ul>
          <p>
            El comercio en Star Citizen evoluciona con cada parche. Los precios
            cambian, se añaden nuevas terminales y las mecánicas se refinan.
            Mantente actualizado usando las herramientas de SCG y no dejes de
            experimentar con nuevas rutas y estrategias.
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-[#1e4a6e] bg-gradient-to-r from-[#0a1929] to-[#0F2C3E] p-6 text-center space-y-3">
          <h3 className="text-lg font-semibold text-white">
            Pon en práctica lo aprendido
          </h3>
          <p className="text-sm text-gray-300">
            Selecciona tu nave, introduce tu capital y deja que nuestra
            calculadora encuentre la ruta perfecta para ti.
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
            Los datos de precios y existencias provienen de la API pública de
            UEX Corp (fuente comunitaria) y pueden no coincidir exactamente con
            los servidores en vivo de Star Citizen. Verifica siempre los
            precios en el kiosco del juego antes de confirmar una compra.
          </p>
          <p className="text-xs text-[#82919E]">
            SCG es una herramienta no oficial y no está afiliada, asociada,
            autorizada ni respaldada por Cloud Imperium Games.
          </p>
        </section>
      </article>
    </div>
  );
}
