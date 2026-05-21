import Mercancia from "./Mercancia";
import { CommodityOption } from "./types";
import { fetchCommodities } from "./uex-api";

export default async function MercanciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const commodities = await fetchCommodities();

  const commoditiesList: CommodityOption[] = commodities.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  return (
    <>
      <Mercancia commoditiesList={commoditiesList} />
      {children}
    </>
  );
}
