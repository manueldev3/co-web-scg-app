"use client";

import { useState } from "react";
import { Button, Input } from "antd";
import { BookOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildWikiSearchHref } from "../wiki/utils";

/**
 * Home_Wiki_Section — sección destacada del Home que promociona la wiki.
 *
 * Es un componente cliente (`"use client"`) porque necesita estado local del
 * campo de búsqueda y navegación imperativa al enviar la búsqueda.
 *
 * Renderiza (Req 7.2, 7.3, 7.4, 7.5, 7.6):
 * - Un título y una descripción que identifican la wiki como espacio de
 *   información del universo de Star Citizen (Req 7.2).
 * - Un campo de búsqueda (`Input.Search`) que, al enviar, navega a
 *   `/wiki?q=<texto>` mediante {@link buildWikiSearchHref} usando
 *   `useRouter().push` (Req 7.3, 7.4).
 * - Un enlace de acceso directo a la Wiki_Landing (`/wiki`) (Req 7.5).
 * - Los tokens visuales del tema oscuro del Home (Req 7.6).
 *
 * La inserción de esta sección en `app/page.tsx` se realiza en la tarea 11.4,
 * sin eliminar ni modificar el hero, las herramientas ni el footer (Req 7.1).
 */
const HomeWikiSection: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Al enviar la búsqueda navegamos a la wiki llevando el texto introducido
  // (Req 7.4). buildWikiSearchHref codifica el texto en el parámetro `q`.
  const handleSearch = (value: string) => {
    router.push(buildWikiSearchHref(value));
  };

  return (
    <section className="px-6 lg:px-8 pb-20">
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#1e4a6e] bg-linear-to-r from-[#0a1929] to-[#0F2C3E] p-8 lg:p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F2C3E] text-2xl text-[#9ED0FA]">
          <BookOutlined />
        </div>

        {/* Título + descripción (Req 7.2) */}
        <h2 className="text-2xl lg:text-3xl font-bold text-white">
          Wiki del universo
        </h2>
        <p className="mt-3 text-gray-300 max-w-2xl mx-auto lg:text-lg">
          Consulta información de referencia del universo de Star Citizen:
          naves, fabricantes y datos técnicos extraídos de UEX Corp. Busca
          cualquier elemento y explora sus detalles.
        </p>

        {/* Campo de búsqueda que dirige a la wiki con el texto (Req 7.3, 7.4) */}
        <div className="mx-auto mt-6 max-w-xl">
          <Input.Search
            size="large"
            placeholder="Busca una nave en la wiki..."
            allowClear
            enterButton="Buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        {/* Acceso directo a la Wiki_Landing (Req 7.5) */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/wiki"
            className="inline-flex items-center rounded-md border border-[#1e4a6e] px-5 py-2 font-semibold text-[#9ED0FA] no-underline transition-colors hover:bg-[#0F2C3E]"
          >
            Explorar la wiki
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeWikiSection;
