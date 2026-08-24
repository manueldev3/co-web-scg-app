import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contacto | SCG - Guía de Star Citizen",
  description:
    "Ponte en contacto con el equipo de SCG. Envíanos sugerencias, reporta errores o simplemente saluda. Estamos aquí para mejorar tu experiencia de comercio en Star Citizen.",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Cabecera */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#9ED0FA] tracking-wide">
            Contacto
          </h1>
          <p className="mt-2 text-gray-300 max-w-2xl">
            ¿Tienes preguntas, sugerencias o quieres reportar un error?
            Escríbenos.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Introducción */}
        <section className="space-y-4">
          <p className="text-[#BCBEC0] leading-relaxed">
            SCG es un proyecto comunitario y tu feedback es fundamental para
            seguir mejorando. Ya sea que hayas encontrado un error en los datos,
            tengas una idea para una nueva funcionalidad o simplemente quieras
            saber más sobre el proyecto, estaremos encantados de leerte.
          </p>
        </section>

        {/* Canales de contacto */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Cómo contactarnos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="rounded-xl border border-[#143A52] bg-[#071421] p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F2C3E] text-xl text-[#9ED0FA]">
                  &#9993;
                </div>
                <h3 className="font-semibold text-white">Correo electrónico</h3>
              </div>
              <p className="text-sm text-[#BCBEC0]">
                Para consultas generales, sugerencias, reportes de errores o
                colaboraciones.
              </p>
              <Link
                href="mailto:manueldev3@gmail.com"
                className="inline-block text-[#9ED0FA] hover:text-[#bde0ff] no-underline text-sm font-medium"
              >
                manueldev3@gmail.com
              </Link>
            </div>

            {/* Web del desarrollador */}
            <div className="rounded-xl border border-[#143A52] bg-[#071421] p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F2C3E] text-xl text-[#9ED0FA]">
                  &#127760;
                </div>
                <h3 className="font-semibold text-white">Web del desarrollador</h3>
              </div>
              <p className="text-sm text-[#BCBEC0]">
                Conoce más sobre Manuel Fernández, el creador de SCG, y otros
                proyectos.
              </p>
              <Link
                href="https://manueldeveloper.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[#9ED0FA] hover:text-[#bde0ff] no-underline text-sm font-medium"
              >
                manueldeveloper.com
              </Link>
            </div>
          </div>
        </section>

        {/* Temas frecuentes */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            ¿Sobre qué puedes escribirnos?
          </h2>
          <div className="rounded-xl border border-[#143A52] bg-[#071421] p-6">
            <ul className="space-y-3 text-[#BCBEC0] text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#9ED0FA]">▸</span>
                <span>
                  <span className="font-medium text-white">
                    Errores en los datos:
                  </span>{" "}
                  si notas que un precio, una terminal o una nave no coincide con
                  lo que ves en el juego, cuéntanos para investigarlo.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#9ED0FA]">▸</span>
                <span>
                  <span className="font-medium text-white">
                    Sugerencias de funcionalidades:
                  </span>{" "}
                  ¿Echas en falta alguna herramienta o filtro? Queremos saberlo.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#9ED0FA]">▸</span>
                <span>
                  <span className="font-medium text-white">
                    Problemas técnicos:
                  </span>{" "}
                  si algo no carga, se ve mal o no funciona como esperas,
                  reporta el problema indicando tu navegador y dispositivo.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#9ED0FA]">▸</span>
                <span>
                  <span className="font-medium text-white">
                    Colaboraciones:
                  </span>{" "}
                  si eres creador de contenido de Star Citizen o tienes un
                  proyecto relacionado, hablemos.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-[#9ED0FA]">▸</span>
                <span>
                  <span className="font-medium text-white">
                    Consultas legales o de privacidad:
                  </span>{" "}
                  cualquier duda relacionada con nuestros{" "}
                  <Link
                    href="/terminos-y-condiciones"
                    className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
                  >
                    Términos y Condiciones
                  </Link>{" "}
                  o{" "}
                  <Link
                    href="/politica-de-privacidad"
                    className="text-[#9ED0FA] hover:text-[#bde0ff] no-underline"
                  >
                    Política de Privacidad
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Tiempo de respuesta */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Tiempo de respuesta
          </h2>
          <p className="text-[#BCBEC0] leading-relaxed">
            SCG es un proyecto personal, así que el tiempo de respuesta puede
            variar. Generalmente respondemos en un plazo de 1 a 3 días
            laborables. Si tu consulta es urgente, indícalo en el asunto del
            correo para priorizarla.
          </p>
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
