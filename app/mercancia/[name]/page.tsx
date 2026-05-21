"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { separateRecords } from "../utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - module exists, IDE resolution issue with [name] folder
import DetalleMercancia from "../DetalleMercancia";
import type { ApiPriceRecord, TerminalPriceRecord } from "../types";

interface PageState {
  loading: boolean;
  error: string | null;
  commodityName: string;
  sellers: TerminalPriceRecord[];
  buyers: TerminalPriceRecord[];
}

export default function CommodityDetailPage() {
  const params = useParams<{ name: string }>();
  const slug = params.name;
  const [state, setState] = useState<PageState>({
    loading: true,
    error: null,
    commodityName: "",
    sellers: [],
    buyers: [],
  });

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();
    const commodityNameQuery = slug.replace(/-/g, " ");

    fetch(
      `https://api.uexcorp.space/2.0/commodities_prices?commodity_name=${encodeURIComponent(commodityNameQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_UEX_API_TOKEN}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        const records: ApiPriceRecord[] = data.data || [];

        if (records.length === 0) {
          setState({
            loading: false,
            error: "No se encontraron datos para esta mercancía",
            commodityName: "",
            sellers: [],
            buyers: [],
          });
          return;
        }

        const result = separateRecords(records);
        setState({
          loading: false,
          error: null,
          commodityName: records[0].commodity_name,
          sellers: result.sellers,
          buyers: result.buyers,
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({
          loading: false,
          error: "Error de conexión. Intenta de nuevo.",
          commodityName: "",
          sellers: [],
          buyers: [],
        });
      });

    return () => controller.abort();
  }, [slug]);

  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1e4a6e] border-t-[#9ED0FA] mb-4" />
        <p className="text-gray-400 text-center">Cargando precios...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-gray-500 text-center text-lg">{state.error}</p>
      </div>
    );
  }

  return (
    <DetalleMercancia
      commodityName={state.commodityName}
      sellers={state.sellers}
      buyers={state.buyers}
    />
  );
}
