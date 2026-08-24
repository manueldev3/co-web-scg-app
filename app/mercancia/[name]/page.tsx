import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { separateRecords } from "../utils";
import { fetchCommodityPrices } from "../uex-api";
import DetalleMercancia from "../DetalleMercancia";

interface Props {
  params: Promise<{ name: string }>;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name: slug } = await params;
  const commodityName = slugToName(slug);

  const records = await fetchCommodityPrices(commodityName);
  if (records.length === 0) {
    notFound();
  }

  const displayName = records[0].commodity_name;

  return buildMetadata({
    title: `${displayName} - Precios en Star Citizen | SCG`,
    description: `Consulta precios de compra y venta de ${displayName} en todas las terminales de Star Citizen. Encuentra dónde comprar barato y vender caro.`,
    path: `/mercancia/${slug}`,
    ogType: "product",
  });
}

export default async function CommodityDetailPage({ params }: Props) {
  const { name } = await params;
  const commodityName = name.replace(/-/g, " ");

  const records = await fetchCommodityPrices(commodityName);

  if (records.length === 0) {
    notFound();
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
