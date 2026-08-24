"use client";

import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#061220] text-white px-4 py-16">
      <h1 className="text-3xl font-bold text-[#9ED0FA] mb-4">
        Algo salió mal
      </h1>
      <p className="text-[#BCBEC0] mb-8 text-center max-w-md">
        Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#9ED0FA] text-[#061220] rounded font-medium hover:bg-[#7BBDE8] transition-colors"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-[#9ED0FA] text-[#9ED0FA] rounded hover:bg-[#9ED0FA]/10 transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
