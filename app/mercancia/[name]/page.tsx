import { separateRecords } from "../utils";
import { fetchCommodityPrices } from "../uex-api";
import DetalleMercancia from "../DetalleMercancia";

export default async function CommodityDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const commodityName = name.replace(/-/g, " ");

  const records = await fetchCommodityPrices(commodityName);

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

  return (
    <DetalleMercancia
      commodityName={records[0].commodity_name}
      sellers={sellers}
      buyers={buyers}
    />
  );
}
