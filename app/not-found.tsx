import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#040d16] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-[#9ED0FA]">404</h1>
        <h2 className="text-xl font-semibold text-white">
          Página no encontrada
        </h2>
        <p className="text-gray-400 max-w-md">
          La página que buscas no existe o fue movida. Verifica la URL o vuelve
          al inicio.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-block rounded-md bg-[#4a9eda] px-5 py-2 font-semibold text-[#0A1D29] no-underline transition-colors hover:bg-[#9ED0FA]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
