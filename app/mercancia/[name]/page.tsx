"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { separateRecords } from "../utils";
import { ApiPriceRecord, TerminalPriceRecord } from "../types";
import DetalleMercancia from "../DetalleMercancia";

export default function CommodityDetailPage() {
  const params = useParams<{ name: string }>();
  const slug = params.name;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commodityName, setCommodityName] = useState("");
  const [sellers, setSellers] = useState<TerminalPriceRecord[]>([]);
  const [buyers, setBuyers] = useState<TerminalPriceRecord[]>([]);

  useEffect(() => {
    if (!slug) return;

    const commodityNameQuery = slug.replace(/-/g, " ");

    setLoading(true);
    setError(null);

    fetch(
      `https://api.uexcorp.space/2.0/commodities_prices?commodity_name=${encodeURIComponent(commodityNameQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_UEX_API_TOKEN}`,
          Accept: "application/json",
        },
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        const records: ApiPriceRecord[] = data.data || [];

        if (records.length === 0) {
          setError("No se encontraron datos para esta mercancía");
          setLoading(false);
          return;
        }

        const { sellers, buyers } = separateRecords(records);
        setCommodityName(records[0].commodity_name);
        setSellers(sellers);
        setBuyers(buyers);
        setLoading(false);
      })
      .catch(() => {
        setError("Error de conexión. Intenta de nuevo.");
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1e4a6e] border-t-[#9ED0FA] mb-4" />
        <p className="text-gray-400 text-center">Cargando precios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-gray-500 text-center text-lg">{error}</p>
      </div>
    );
  }

  return (
    <DetalleMercancia
      commodityName={commodityName}
      sellers={sellers}
      buyers={buyers}
    />
  );
}
