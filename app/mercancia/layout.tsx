import Mercancia from "./Mercancia";
import { CommodityOption } from "./types";

export const dynamic = "force-dynamic";

export default async function MercanciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await fetch("https://api.uexcorp.space/2.0/commodities");
  const jsonData = await result.json();

  const commoditiesList: CommodityOption[] = jsonData.data.map(
    (item: { id: number; name: string }) => ({
      id: item.id,
      name: item.name,
      slug: item.name.toLowerCase().replace(/\s+/g, "-"),
    }),
  );

  return (
    <>
      <Mercancia commoditiesList={commoditiesList} />
      {children}
    </>
  );
}
