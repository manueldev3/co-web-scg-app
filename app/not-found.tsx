import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada | SCG",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-[#061220] text-white px-4 py-16">
      <h1 className="text-6xl font-bold text-[#9ED0FA] mb-4">404</h1>
      <p className="text-lg text-[#BCBEC0] mb-8">Página no encontrada</p>
      <nav className="flex flex-col gap-3 items-center">
        <Link href="/" className="text-[#9ED0FA] hover:underline">
          Inicio
        </Link>
        <Link href="/mercancia" className="text-[#9ED0FA] hover:underline">
          Mercancía
        </Link>
        <Link href="/mejor-ruta" className="text-[#9ED0FA] hover:underline">
          Mejor Ruta
        </Link>
        <Link href="/wiki" className="text-[#9ED0FA] hover:underline">
          Wiki
        </Link>
      </nav>
    </main>
  );
}
