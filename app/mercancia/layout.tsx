import Mercancia from "./Mercancia";
import { CommodityOption } from "./types";

export const dynamic = "force-dynamic";

export default async function MercanciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let commoditiesList: CommodityOption[] = [];

  try {
    const result = await fetch("https://api.uexcorp.space/2.0/commodities", {
      next: { revalidate: 300 },
      headers: {
        Authorization: `Bearer ${process.env.UEX_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    if (result.ok) {
      const jsonData = await result.json();
      commoditiesList = (jsonData.data || []).map(
        (item: { id: number; name: string }) => ({
          id: item.id,
          name: item.name,
          slug: item.name.toLowerCase().replace(/\s+/g, "-"),
        }),
      );
    }
  } catch {
    // API unavailable — continue with empty list
  }

  return (
    <>
      <Mercancia commoditiesList={commoditiesList} />
      {children}
    </>
  );
}
