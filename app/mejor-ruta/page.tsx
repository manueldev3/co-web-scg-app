import RouteFinder from "./RouteFinder";
import { fetchMarketData } from "./uex-api";

/**
 * `/mejor-ruta` route entry — a Server Component.
 *
 * Per the modified Next.js guides in `node_modules/next/dist/docs/`
 * (`05-server-and-client-components.md`, `06-fetching-data.md`), pages are
 * Server Components by default and fetch data with `async`/`await`. Reading the
 * UEX market data here keeps the network calls server-side (smaller client
 * bundle, no secrets shipped) and lets the sibling `loading.tsx` stream an
 * instant loading state while this server fetch resolves.
 *
 * The normalized {@link MarketData} is passed as the single `market` prop to
 * the `"use client"` {@link RouteFinder}, which owns all interactivity.
 *
 * _Requirements: 8.1, 8.2, 7.3, 10.1_
 */
export default async function MejorRutaPage() {
  const market = await fetchMarketData();

  return <RouteFinder market={market} />;
}
