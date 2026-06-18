import Link from "next/link";
import { DetailSection, WikiDetail } from "../../types";

interface DetailViewProps {
  detail: WikiDetail;
}

/**
 * Presentación del Detalle_Elemento (Server Component).
 *
 * Conserva el encabezado (título + subtítulo, Req 1.6) y el control de
 * regreso al Listado_Categoria (Req 1.7). Itera las Seccion_Detalle en el
 * orden en que aparecen (Req 1.3) y despacha cada una a su sub-renderer según
 * el `kind` (Req 1.4, 1.5). La página no conoce las categorías: solo recorre
 * `detail.sections` y delega el render por tipo.
 *
 * No usa "use client": es puramente presentacional y no requiere
 * interactividad de cliente.
 */
export default function DetailView({ detail }: DetailViewProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 text-[#BCBEC0]">
      {/* Regreso al Listado_Categoria (Req 1.7) */}
      <Link
        href={`/wiki/${detail.categoryId}`}
        className="inline-flex items-center gap-1 text-sm text-[#9ED0FA] hover:text-[#bde0ff] no-underline mb-6"
      >
        <span aria-hidden="true">←</span> Volver al listado
      </Link>

      {/* Título + subtítulo (Req 1.6) */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
          {detail.title}
        </h1>
        <p className="mt-1 text-base text-[#82919E]">{detail.subtitle}</p>
      </header>

      {/* Secciones componibles en orden (Req 1.3, 1.4, 1.5) */}
      {detail.sections.map((section, index) => (
        <SectionRenderer key={`${section.kind}-${index}`} section={section} />
      ))}
    </div>
  );
}

/**
 * Despacha una Seccion_Detalle al sub-renderer correspondiente a su
 * Tipo_Bloque (Req 1.4, 1.5). El `switch` sobre la unión discriminada es
 * exhaustivo: añadir un `kind` nuevo a la unión obliga a añadir su caso aquí.
 */
function SectionRenderer({ section }: { section: DetailSection }) {
  switch (section.kind) {
    case "fields":
      return <FieldsSection section={section} />;
    case "gallery":
      return <GallerySection section={section} />;
    case "prices":
      return <PricesSection section={section} />;
    case "links":
      return <LinksSection section={section} />;
    case "description":
      return <DescriptionSection section={section} />;
  }
}

/**
 * Bloque_Descripcion — muestra el Texto_Descripcion como párrafos de texto
 * plano (Req 1.4, 1.5). Cada párrafo se renderiza como un `<p>` con el texto
 * como nodo hijo de React, que React escapa por defecto; NO se usa
 * `dangerouslySetInnerHTML`, de modo que el contenido nunca se interpreta como
 * marcado ejecutable. La presentación es independiente de la categoría: solo
 * recibe los párrafos ya resueltos (Req 5.4).
 */
function DescriptionSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "description" }>;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Descripción</h2>
      <div className="space-y-3 text-sm leading-relaxed text-[#BCBEC0]">
        {section.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

/**
 * Bloque_Grupo_Campos — título de grupo (`label`) + `<dl>` de pares
 * etiqueta/valor. Los valores `string[]` (p. ej. `container_sizes`) se
 * renderizan como lista ordenada, reutilizando la presentación previa. El
 * marcador de dato faltante ya viene aplicado en los valores.
 */
function FieldsSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "fields" }>;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">{section.label}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {section.fields.map((field) => (
          <div
            key={field.label}
            className="border-b border-[#13344a] pb-3 last:border-b-0"
          >
            <dt className="text-xs uppercase tracking-wide text-[#82919E]">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm text-white">
              {Array.isArray(field.value) ? (
                <ol className="list-decimal list-inside space-y-0.5">
                  {field.value.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ol>
              ) : (
                field.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Bloque_Galeria — imagen principal + miniaturas. Usa el elemento `<img>`
 * nativo con `loading="lazy"` (decisión de diseño: las URLs de UEX apuntan a
 * hosts remotos arbitrarios y `next.config.ts` no declara
 * `images.remotePatterns`, por lo que NO se usa `next/image`). El `alt` se
 * deriva de `altBase` (nombre de la Nave) (Req 3.1, 3.5).
 */
function GallerySection({
  section,
}: {
  section: Extract<DetailSection, { kind: "gallery" }>;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Galería</h2>
      {section.mainImage && (
        <img
          src={section.mainImage}
          alt={section.altBase}
          loading="lazy"
          className="w-full max-w-2xl rounded-lg border border-[#13344a] mb-4"
        />
      )}
      {section.images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {section.images.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`${section.altBase} — imagen ${index + 1}`}
              loading="lazy"
              className="h-24 w-auto rounded-md border border-[#13344a]"
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Bloque_Precios — encabezado según la operación (compra/alquiler) + tabla de
 * ubicaciones y precios en aUEC (Req 4.2, 4.3, 4.9). El importe se formatea
 * con separadores de miles en español y el sufijo "aUEC".
 */
function PricesSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "prices" }>;
}) {
  const heading = section.operation === "buy" ? "Comprar" : "Alquilar";
  const locationHeading =
    section.operation === "buy" ? "Comprar en" : "Alquilar en";

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">{heading}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[#82919E]">
              <th className="border-b border-[#1e4a6e] pb-2 pr-4 font-medium">
                {locationHeading}
              </th>
              <th className="border-b border-[#1e4a6e] pb-2 font-medium">
                Precio
              </th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, index) => (
              <tr key={`${row.locationName}-${index}`}>
                <td className="border-b border-[#13344a] py-2 pr-4 text-white">
                  {row.locationName}
                </td>
                <td className="border-b border-[#13344a] py-2 text-white">
                  {`${row.price.toLocaleString("es")} aUEC`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Bloque_Enlaces — cada Enlace_Externo se abre en una pestaña nueva con
 * `target="_blank"` y `rel="noopener noreferrer"` (Req 5.3), mostrando su
 * etiqueta de tipo (Req 5.2).
 */
function LinksSection({
  section,
}: {
  section: Extract<DetailSection, { kind: "links" }>;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">
        Enlaces oficiales
      </h2>
      <ul className="flex flex-wrap gap-3">
        {section.links.map((link) => (
          <li key={link.type}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-[#1e4a6e] bg-[#0F2C3E] px-3 py-1 text-xs font-medium text-[#9ED0FA] no-underline hover:text-[#bde0ff]"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
