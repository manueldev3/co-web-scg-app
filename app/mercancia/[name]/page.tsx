import { separateRecords } from "../utils";
import { ApiPriceRecord } from "../types";
import DetalleMercancia from "../DetalleMercancia";

export default async function CommodityDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const commodityNameQuery = name.replace(/-/g, " ");

  try {
    const result = await fetch(
      `https://api.uexcorp.space/2.0/commodities_prices?commodity_name=${encodeURIComponent(commodityNameQuery)}`,
    );

    if (!result.ok) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-gray-500 text-center text-lg">
            No se encontraron datos para esta mercancía
          </p>
        </div>
      );
    }

    const jsonData = await result.json();
    const records: ApiPriceRecord[] = jsonData.data || [];

    if (records.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-gray-500 text-center text-lg">
            No se encontraron datos para esta mercancía
          </p>
        </div>
      );
    }

    const { sellers, buyers } = separateRecords(records);
    const commodityName = records[0].commodity_name;

    return (
      <DetalleMercancia
        commodityName={commodityName}
        sellers={sellers}
        buyers={buyers}
      />
    );
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-gray-500 text-center text-lg">
          Error de conexión. Intenta de nuevo.
        </p>
      </div>
    );
  }
}
