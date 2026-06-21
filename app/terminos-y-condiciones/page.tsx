import type { Metadata } from "next";
import Link from "next/link";

// Página estática de contenido legal (Server Component): sin "use client" ni
// interactividad de cliente. El encabezado y el pie globales los aporta el
// layout raíz; aquí solo se renderiza el contenido de los términos.
export const metadata: Metadata = {
  title: "Términos y Condiciones | SCG - Guía de Star Citizen",
  description:
    "Condiciones de uso de SCG, herramienta no oficial de Star Citizen: carácter informativo, exactitud de los datos comunitarios de UEX Corp y limitación de responsabilidad.",
};

// Fecha de última actualización mostrada en la cabecera del documento.
const LAST_UPDATED = "21 de junio de 2026";

export default function TerminosYCondicionesPage() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera del documento */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            Términos y Condiciones
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Última actualización: {LAST_UPDATED}
          </p>
        </div>
      </div>

      <article className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-sm leading-relaxed text-[#BCBEC0]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            1. Aceptación de los términos
          </h2>
          <p>
            SCG («el Sitio») es una herramienta gratuita y no oficial de
            consulta y cálculo para el videojuego Star Citizen. Al acceder y
            utilizar el Sitio aceptas estos Términos y Condiciones. Si no estás
            de acuerdo con ellos, te pedimos que no utilices el Sitio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            2. Descripción del servicio
          </h2>
          <p>
            SCG ofrece herramientas de referencia y apoyo para jugadores de Star
            Citizen, entre ellas el cálculo de rutas de comercio, la consulta de
            mercancías y terminales, un organizador de carga y una wiki de
            consulta. El Sitio se ofrece con fines informativos y de
            entretenimiento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            3. Carácter no oficial
          </h2>
          <p>
            SCG es una herramienta no oficial y no está afiliada, asociada,
            autorizada ni respaldada por Cloud Imperium Games (CIG) ni por
            Roberts Space Industries. Todas las marcas, nombres, logotipos y
            contenidos relacionados con Star Citizen y Squadron 42 son propiedad
            de sus respectivos dueños. Su uso en el Sitio se realiza con fines
            meramente identificativos e informativos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            4. Exactitud de la información
          </h2>
          <p>
            Los datos de juego que muestra SCG (precios, mercancías, terminales,
            naves y rutas) proceden de la API pública de UEX Corp, una fuente
            comunitaria («crowdsourced»). Por su naturaleza, esta información
            puede estar incompleta, desactualizada o no coincidir con los
            servidores en vivo del juego.
          </p>
          <p>
            SCG no garantiza la exactitud, integridad ni actualidad de los datos
            ni de los cálculos derivados (como rutas o beneficios estimados).
            Dichos resultados son orientativos y debes verificarlos dentro del
            juego antes de tomar decisiones basadas en ellos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">5. Uso permitido</h2>
          <p>Al utilizar el Sitio te comprometes a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>No utilizarlo con fines ilícitos o no autorizados.</li>
            <li>
              No intentar dañar, sobrecargar o interferir en el funcionamiento
              del Sitio ni en sus fuentes de datos.
            </li>
            <li>
              No realizar un volumen de peticiones automatizadas que afecte a la
              disponibilidad del servicio o de las APIs de terceros que utiliza.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            6. Propiedad intelectual
          </h2>
          <p>
            El código, el diseño y los textos propios del Sitio pertenecen a su
            autor. Los contenidos de Star Citizen pertenecen a Cloud Imperium
            Games, y los datos de juego son aportados por la comunidad a través
            de UEX Corp. El uso del Sitio no te concede ningún derecho sobre
            dichas marcas o contenidos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">7. Publicidad</h2>
          <p>
            El Sitio se financia mediante publicidad de terceros (Google
            AdSense). El tratamiento de cookies y datos asociado a la publicidad
            se describe en la{" "}
            <Link
              href="/politica-de-privacidad"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              Política de Privacidad
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            8. Enlaces a sitios de terceros
          </h2>
          <p>
            El Sitio puede incluir enlaces a páginas externas. SCG no controla
            ni se responsabiliza del contenido, las políticas ni las prácticas
            de esos sitios. El acceso a ellos es bajo tu propia responsabilidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            9. Limitación de responsabilidad
          </h2>
          <p>
            El Sitio se ofrece «tal cual» y «según disponibilidad», sin
            garantías de ningún tipo. En la medida permitida por la ley, el
            autor no será responsable de pérdidas o daños (incluidas pérdidas
            dentro del juego) derivados del uso, la imposibilidad de uso o la
            confianza en la información o los cálculos proporcionados por el
            Sitio.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            10. Disponibilidad del servicio
          </h2>
          <p>
            SCG es un proyecto personal y gratuito. No se garantiza su
            disponibilidad continua: el servicio puede modificarse, suspenderse
            o interrumpirse en cualquier momento, total o parcialmente, sin
            previo aviso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            11. Cuentas del Blog
          </h2>
          <p>
            El Sitio incluye un Blog en el que los usuarios pueden registrar una
            cuenta para participar mediante comentarios y «me gusta». La
            creación y el uso de una cuenta están sujetos a las siguientes
            condiciones:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              El registro puede realizarse a través de los proveedores de acceso
              habilitados en el Sitio.
            </li>
            <li>
              Debes proporcionar datos veraces y mantenerlos actualizados. No
              está permitido suplantar la identidad de otras personas ni crear
              cuentas con información falsa.
            </li>
            <li>
              Eres responsable de la actividad realizada desde tu cuenta y de
              mantener la confidencialidad de tus credenciales de acceso.
            </li>
            <li>
              El Sitio puede suspender o cancelar tu cuenta, sin previo aviso,
              si incumples estos términos, las normas de conducta o si haces un
              uso fraudulento, abusivo o ilícito de la funcionalidad del Blog.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            12. Normas de conducta en los comentarios
          </h2>
          <p>
            Al publicar comentarios en el Blog te comprometes a respetar a la
            comunidad y a no difundir contenido inadecuado. En particular, queda
            prohibido publicar comentarios que contengan:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Contenido ofensivo, insultante, difamatorio, discriminatorio o que
              incite al odio o a la violencia.
            </li>
            <li>
              Contenido ilegal o que infrinja derechos de terceros, incluidos
              los derechos de propiedad intelectual.
            </li>
            <li>
              Publicidad no autorizada, «spam», enlaces maliciosos o promociones
              ajenas al Sitio.
            </li>
            <li>
              Mensajes ajenos a la temática del Blog o que entorpezcan el normal
              desarrollo de las conversaciones.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            13. Uso de los «me gusta»
          </h2>
          <p>
            La funcionalidad de «me gusta» está pensada para que expreses de
            forma genuina tu valoración de las entradas del Blog. No está
            permitido manipular de forma artificial el número de «me gusta», por
            ejemplo mediante el uso de cuentas múltiples, automatizaciones,
            «bots» o cualquier otro medio destinado a inflar o falsear las
            valoraciones.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            14. Moderación de contenidos
          </h2>
          <p>
            El Sitio podrá moderar, ocultar o eliminar cualquier comentario que
            incumpla las normas de conducta anteriores, así como adoptar medidas
            sobre las cuentas implicadas, en cualquier momento y sin previo
            aviso al usuario. La moderación se realiza para preservar un entorno
            respetuoso y seguro para toda la comunidad.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            15. Cambios en los términos
          </h2>
          <p>
            Estos Términos y Condiciones pueden actualizarse en cualquier
            momento. El uso continuado del Sitio tras su modificación implica la
            aceptación de la versión vigente. La fecha de la última
            actualización se indica al inicio del documento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">16. Contacto</h2>
          <p>
            Para cualquier consulta sobre estos términos, escribe a{" "}
            <Link
              href="mailto:manueldev3@gmail.com"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              manueldev3@gmail.com
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3 border-t border-gray-700 pt-6">
          <p className="text-xs text-[#82919E]">
            SCG es una herramienta no oficial para Star Citizen y no está
            afiliada, asociada, autorizada ni respaldada por Cloud Imperium
            Games. Todas las marcas, nombres y contenidos de Star Citizen son
            propiedad de sus respectivos dueños.
          </p>
          <p className="text-sm">
            <Link
              href="/politica-de-privacidad"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              Ver Política de Privacidad
            </Link>
          </p>
        </section>
      </article>
    </div>
  );
}
