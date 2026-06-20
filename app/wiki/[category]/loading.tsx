export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-white">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#1e4a6e] border-t-[#9ED0FA]" />
      <p className="text-center text-gray-400">Cargando elementos...</p>
    </div>
  );
}
