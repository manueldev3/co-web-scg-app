import { getCategory } from "../../registry";
import DetailView from "./DetailView";

/**
 * Detalle_Elemento — Server Component genérico (Req 5.1, 5.6).
 *
 * Resuelve `params` (un `Promise` en esta versión de Next.js — ver
 * `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`).
 * No conoce categorías concretas: deriva todo del Registro_Categorias.
 *
 * - Categoría inexistente o inactiva → estado "no encontrado" (Req 5.6, 9.2).
 * - `loadDetail(slug)` devuelve `null` (elemento inexistente) → estado
 *   "no encontrado" (Req 5.6).
 * - Categoría activa con detalle → delega la presentación a `DetailView`
 *   (Req 5.1).
 */
export default async function WikiDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category: categoryId, slug } = await params;
  const category = getCategory(categoryId);

  if (!category || category.status !== "active") {
    return <NotFound />;
  }

  const detail = await category.loadDetail(slug);

  if (detail === null) {
    return <NotFound />;
  }

  return <DetailView detail={detail} />;
}

/**
 * Estado "no encontrado" con los tokens del tema oscuro del sitio (Req 5.6).
 */
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-[#BCBEC0]">
      <p className="text-gray-400 text-center text-lg">
        No se encontró el elemento solicitado
      </p>
    </div>
  );
}
