export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1e4a6e] border-t-[#9ED0FA] mb-4" />
      <p className="text-gray-400 text-center">Cargando precios...</p>
    </div>
  );
}
