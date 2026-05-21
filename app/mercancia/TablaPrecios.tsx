"use client";

import { Card, Table, Tag, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ShopOutlined,
  DollarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { TerminalPriceRecord } from "./types";
import { formatPrice, formatStock } from "./utils";

interface TablaPreciosProps {
  title: string;
  records: TerminalPriceRecord[];
  type: "sellers" | "buyers";
  emptyMessage: string;
}

export default function TablaPrecios({
  title,
  records,
  type,
  emptyMessage,
}: TablaPreciosProps) {
  const isSellers = type === "sellers";

  const columns: ColumnsType<TerminalPriceRecord> = [
    {
      title: "Terminal",
      dataIndex: "terminalName",
      key: "terminalName",
      ellipsis: true,
      render: (name: string) => (
        <span className="font-medium text-gray-100">{name}</span>
      ),
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <EnvironmentOutlined />
          Ubicación
        </span>
      ),
      dataIndex: "location",
      key: "location",
      ellipsis: true,
      responsive: ["lg"],
      render: (location: string) => (
        <span className="text-gray-400 text-xs">{location || "—"}</span>
      ),
    },
    {
      title: isSellers ? "Precio Compra" : "Precio Venta",
      key: "price",
      align: "right",
      width: 160,
      render: (_, record) => (
        <Tag
          color={isSellers ? "cyan" : "geekblue"}
          className="font-mono text-xs m-0"
        >
          {formatPrice(record.price)}
        </Tag>
      ),
    },
    {
      title: isSellers ? "Stock (SCU)" : "Demanda (SCU)",
      key: "stock",
      align: "right",
      width: 150,
      responsive: ["sm"],
      render: (_, record) => (
        <span className="text-gray-300 font-mono text-xs">
          {formatStock(record.stockAvailable, record.stockMax)}
        </span>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <div className="flex items-center gap-2 py-1">
          {isSellers ? (
            <ShopOutlined className="text-cyan-400" />
          ) : (
            <DollarOutlined className="text-blue-400" />
          )}
          <span className="text-gray-100 font-semibold">{title}</span>
          <Tag className="ml-auto">{records.length}</Tag>
        </div>
      }
    >
      <Table<TerminalPriceRecord>
        columns={columns}
        dataSource={records}
        rowKey="id"
        pagination={
          records.length > 10 ? { pageSize: 10, size: "small" } : false
        }
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500">{emptyMessage}</span>
              }
            />
          ),
        }}
        size="small"
        scroll={{ x: 400 }}
      />
    </Card>
  );
}
