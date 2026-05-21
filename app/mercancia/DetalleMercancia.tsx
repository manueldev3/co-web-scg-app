"use client";

import { Divider, Tag } from "antd";
import { ShoppingCartOutlined, DollarOutlined } from "@ant-design/icons";
import TablaPrecios from "./TablaPrecios";
import { TerminalPriceRecord } from "./types";

interface DetalleMercanciaProps {
  commodityName: string;
  sellers: TerminalPriceRecord[];
  buyers: TerminalPriceRecord[];
}

export default function DetalleMercancia({
  commodityName,
  sellers,
  buyers,
}: DetalleMercanciaProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
          {commodityName}
        </h2>
        <div className="flex gap-2">
          <Tag icon={<ShoppingCartOutlined />} color="cyan">
            {sellers.length} vendedor{sellers.length !== 1 ? "es" : ""}
          </Tag>
          <Tag icon={<DollarOutlined />} color="blue">
            {buyers.length} comprador{buyers.length !== 1 ? "es" : ""}
          </Tag>
        </div>
      </div>

      <Divider className="border-[#1e4a6e] my-4" />

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TablaPrecios
          title="Vendido por"
          records={sellers}
          type="sellers"
          emptyMessage="No hay terminales que vendan esta mercancía"
        />
        <TablaPrecios
          title="Comprado por"
          records={buyers}
          type="buyers"
          emptyMessage="No hay terminales que compren esta mercancía"
        />
      </div>
    </div>
  );
}
