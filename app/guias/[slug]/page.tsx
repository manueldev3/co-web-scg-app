"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Spin } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getGuideBySlug, type Guide } from "@/lib/firebase/guides";

export default function GuiaSlugPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getGuideBySlug(slug);
        if (!data || !data.published) {
          setError("not-found");
        } else {
          setGuide(data);
        }
      } catch (err) {
        console.error("Error fetching guide:", err);
        setError("fetch-error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040d16]">
        <Spin size="large" />
      </div>
    );
  }

  if (error === "not-found" || !guide) {
    return (
      <div className="min-h-screen bg-[#040d16] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-[#9ED0FA]">404</h1>
          <h2 className="text-xl font-semibold text-white">
            Guía no encontrada
          </h2>
          <p className="text-gray-400 max-w-md">
            La guía que buscas no existe o aún no ha sido publicada.
          </p>
          <div className="pt-4">
            <Link
              href="/guias"
              className="inline-block rounded-md bg-[#4a9eda] px-5 py-2 font-semibold text-[#0A1D29] no-underline transition-colors hover:bg-[#9ED0FA]"
            >
              Ver todas las guías
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error === "fetch-error") {
    return (
      <div className="min-h-screen bg-[#040d16] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-white">
            Error al cargar la guía
          </h2>
          <p className="text-gray-400 max-w-md">
            No pudimos cargar esta guía en este momento. Intenta de nuevo en
            unos minutos.
          </p>
          <div className="pt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-block rounded-md bg-[#4a9eda] px-5 py-2 font-semibold text-[#0A1D29] cursor-pointer transition-colors hover:bg-[#9ED0FA]"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {guide.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span>{guide.readTime} de lectura</span>
            {guide.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <div className="flex flex-wrap gap-1.5">
                  {guide.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#0F2C3E] px-2 py-0.5 text-xs text-[#9ED0FA]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {guide.coverImage && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <img
            src={guide.coverImage}
            alt={guide.title}
            className="w-full rounded-xl border border-[#1e4a6e] object-cover max-h-80"
          />
        </div>
      )}

      {/* Markdown content */}
      <article className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-headings:font-semibold prose-p:text-[#BCBEC0] prose-p:leading-relaxed prose-a:text-[#9ED0FA] prose-a:no-underline hover:prose-a:text-[#bde0ff] prose-strong:text-white prose-li:text-[#BCBEC0] prose-code:text-[#9ED0FA] prose-code:bg-[#0F2C3E] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#071421] prose-pre:border prose-pre:border-[#1e4a6e] prose-img:rounded-xl prose-img:border prose-img:border-[#1e4a6e] prose-blockquote:border-[#9ED0FA] prose-blockquote:text-gray-300 prose-hr:border-[#1e4a6e]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {guide.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* Footer CTA */}
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 pb-16">
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
        <p className="text-xs text-[#82919E] mt-8 text-center">
          SCG es una herramienta no oficial y no está afiliada, asociada,
          autorizada ni respaldada por Cloud Imperium Games.
        </p>
      </div>
    </div>
  );
}
