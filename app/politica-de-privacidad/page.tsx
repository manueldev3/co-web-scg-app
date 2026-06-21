import type { Metadata } from "next";
import Link from "next/link";

// Página estática de contenido legal (Server Component): sin "use client" ni
// interactividad de cliente. El encabezado y el pie globales los aporta el
// layout raíz; aquí solo se renderiza el contenido de la política.
export const metadata: Metadata = {
  title: "Política de Privacidad | SCG - Guía de Star Citizen",
  description:
    "Cómo SCG, herramienta no oficial de Star Citizen, trata la información: cuentas del Blog con Firebase, comentarios y «me gusta», cookies, publicidad de Google AdSense, datos comunitarios de UEX Corp y tus derechos.",
};

// Fecha de última actualización mostrada en la cabecera del documento.
const LAST_UPDATED = "20 de junio de 2026";

export default function PoliticaDePrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera del documento */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            Política de Privacidad
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Última actualización: {LAST_UPDATED}
          </p>
        </div>
      </div>

      <article className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-sm leading-relaxed text-[#BCBEC0]">
        <section className="space-y-3">
          <p>
            SCG («el Sitio») es una herramienta gratuita y no oficial de
            consulta y cálculo para el videojuego Star Citizen. Esta Política de
            Privacidad explica qué información se trata cuando visitas el Sitio
            y con qué finalidad. Al usar SCG aceptas las prácticas descritas a
            continuación.
          </p>
          <p>
            Las herramientas principales de SCG (Mercancía, Mejor Ruta,
            Organizador de carga y Wiki) no requieren registro ni la creación de
            una cuenta, y puedes utilizarlas sin facilitar datos personales. No
            obstante, el Blog ofrece de forma opcional un sistema de cuentas que
            te permite comentar y dar «me gusta» en las publicaciones. Si
            decides crear una cuenta y participar, se tratarán los datos
            personales que se describen en esta política (ver secciones 2 y 3).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            1. Responsable del tratamiento
          </h2>
          <p>
            El Sitio es un proyecto personal mantenido por Manuel Fernández.
            Para cualquier consulta relacionada con la privacidad puedes
            escribir a{" "}
            <Link
              href="mailto:manueldev3@gmail.com"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              manueldev3@gmail.com
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            2. Información que tratamos
          </h2>
          <p>
            Las herramientas de consulta de SCG no recopilan de forma directa
            datos personales identificables (como nombre, dirección o teléfono).
            La participación opcional en el Blog mediante una cuenta sí implica
            el tratamiento de algunos datos personales. La información que puede
            tratarse es:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="text-white">
                Datos de cuenta y participación en el Blog:
              </span>{" "}
              si creas una cuenta para comentar o dar «me gusta», se tratan como
              mínimo tu correo electrónico y el contenido textual de los
              comentarios que publicas, así como el registro de los «me gusta»
              que realizas. Estos datos se gestionan a través de Firebase (ver
              sección 3).
            </li>
            <li>
              <span className="text-white">Datos técnicos de navegación:</span>{" "}
              información que tu navegador envía automáticamente (como dirección
              IP, tipo de navegador o páginas visitadas) y que pueden recopilar
              los proveedores de terceros descritos más abajo con fines
              estadísticos y publicitarios.
            </li>
            <li>
              <span className="text-white">
                Cookies y tecnologías similares:
              </span>{" "}
              pequeños archivos que se almacenan en tu dispositivo,
              principalmente por parte de nuestro proveedor de publicidad (ver
              sección 4).
            </li>
            <li>
              <span className="text-white">
                Preferencias guardadas localmente:
              </span>{" "}
              algunas herramientas pueden guardar tus ajustes en el
              almacenamiento local de tu navegador (localStorage) para mejorar
              tu experiencia. Esta información permanece en tu dispositivo y no
              se envía a un servidor propio.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            3. Cuentas, comentarios y «me gusta» del Blog (Firebase)
          </h2>
          <p>
            El Blog de SCG dispone de un sistema de cuentas opcional basado en{" "}
            <span className="text-white">Firebase Authentication</span> (un
            servicio de Google) que te permite identificarte para publicar
            comentarios y dar «me gusta» en las publicaciones. La creación de
            una cuenta no es necesaria para leer el Blog ni para usar el resto
            de herramientas del Sitio.
          </p>
          <p className="text-white">
            Datos que se tratan a través de las cuentas:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="text-white">Correo electrónico</span> asociado a
              tu cuenta, utilizado para crear y autenticar tu identidad y para
              poder atender solicitudes relacionadas con tu cuenta.
            </li>
            <li>
              <span className="text-white">
                Contenido textual de los comentarios
              </span>{" "}
              que publicas, tratado con la finalidad de mostrarlo públicamente
              en el Blog y permitir la conversación entre la comunidad.
            </li>
            <li>
              <span className="text-white">Registro de «me gusta»</span> que
              indican qué publicaciones te han gustado, tratado con la finalidad
              de contabilizar y mostrar el número de «me gusta» de cada
              publicación y evitar votos duplicados.
            </li>
          </ul>
          <p>
            <span className="text-white">Almacenamiento:</span> los datos de las
            cuentas, los comentarios y los «me gusta» se almacenan en servicios
            de Firebase (Firebase Authentication y la base de datos de
            Firebase), proporcionados por Google.
          </p>
          <p>
            <span className="text-white">
              Derecho de eliminación de la cuenta y los datos asociados:
            </span>{" "}
            como usuario registrado, tienes derecho a solicitar la eliminación
            de tu cuenta y de los datos asociados a ella, incluidos tus
            comentarios y tus «me gusta». Para ejercer este derecho puedes
            escribir a{" "}
            <Link
              href="mailto:manueldev3@gmail.com"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              manueldev3@gmail.com
            </Link>
            , indicando el correo electrónico de la cuenta que deseas eliminar.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            4. Cookies y publicidad (Google AdSense)
          </h2>
          <p>
            El Sitio se financia mediante publicidad servida por Google AdSense.
            Google y sus colaboradores pueden usar cookies para mostrar anuncios
            basados en tus visitas a este y otros sitios web.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Google, como proveedor externo, utiliza cookies para publicar
              anuncios en el Sitio.
            </li>
            <li>
              Puedes inhabilitar la publicidad personalizada visitando la
              configuración de anuncios de Google en{" "}
              <Link
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
              >
                google.com/settings/ads
              </Link>
              .
            </li>
            <li>
              Puedes obtener más información sobre cómo Google utiliza los datos
              en{" "}
              <Link
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
              >
                las políticas de Google
              </Link>
              .
            </li>
            <li>
              También puedes gestionar o bloquear las cookies desde la
              configuración de tu navegador.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            5. Datos mostrados de terceros (UEX Corp)
          </h2>
          <p>
            La información de juego que muestra SCG (precios, mercancías,
            terminales, naves y rutas) procede de la API pública de UEX Corp, un
            proyecto comunitario. Estos datos se obtienen de forma anónima y no
            implican el envío de información personal tuya a UEX. SCG no
            controla la exactitud de esos datos, que pueden no coincidir con los
            servidores en vivo del juego.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            6. Finalidad del tratamiento
          </h2>
          <p>La información se trata únicamente para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Permitir el funcionamiento de las herramientas del Sitio.</li>
            <li>
              Gestionar las cuentas del Blog y autenticar a los usuarios
              registrados (correo electrónico).
            </li>
            <li>
              Publicar y mostrar los comentarios en el Blog y permitir la
              conversación de la comunidad (contenido de los comentarios).
            </li>
            <li>
              Contabilizar y mostrar los «me gusta» de cada publicación y evitar
              votos duplicados (registro de «me gusta»).
            </li>
            <li>Mostrar publicidad que sostiene el proyecto.</li>
            <li>
              Comprender de forma agregada y anónima cómo se utiliza el Sitio.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            7. Enlaces a sitios externos
          </h2>
          <p>
            El Sitio puede contener enlaces a páginas de terceros (por ejemplo,
            recursos oficiales de Star Citizen o fuentes de datos). SCG no es
            responsable de las prácticas de privacidad ni del contenido de esos
            sitios. Te recomendamos revisar sus políticas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">8. Menores</h2>
          <p>
            El Sitio no está dirigido específicamente a menores ni recopila de
            forma consciente datos personales de ellos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">9. Tus derechos</h2>
          <p>
            Puedes controlar las cookies y la publicidad personalizada a través
            de la configuración de tu navegador y de los ajustes de Google
            indicados en la sección 4. Si tienes una cuenta en el Blog, puedes
            solicitar la eliminación de tu cuenta y de los datos asociados
            (comentarios y «me gusta») tal como se describe en la sección 3. Si
            tienes cualquier duda sobre el tratamiento de la información, puedes
            escribirnos a la dirección de contacto.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            10. Cambios en esta política
          </h2>
          <p>
            Esta Política de Privacidad puede actualizarse para reflejar cambios
            en el Sitio o en la normativa aplicable. La fecha de la última
            actualización se indica al inicio del documento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">11. Contacto</h2>
          <p>
            Para cualquier consulta sobre esta política, escribe a{" "}
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
              href="/terminos-y-condiciones"
              className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
            >
              Ver Términos y Condiciones
            </Link>
          </p>
        </section>
      </article>
    </div>
  );
}
