const MercanciaPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-full border-2 border-[#1e4a6e] flex items-center justify-center mb-6">
        <span className="text-3xl">🔍</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-300 mb-2">
        Busca una mercancía
      </h2>
      <p className="text-gray-500 max-w-md">
        Usa el buscador para encontrar los mejores precios de compra y venta en
        las terminales del universo de Star Citizen.
      </p>
    </div>
  );
};

export default MercanciaPage;
