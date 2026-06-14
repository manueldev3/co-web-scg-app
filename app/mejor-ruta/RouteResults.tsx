"use client";

import { Card, Table, Tag, Empty, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ShopOutlined,
  DollarOutlined,
  RiseOutlined,
  EnvironmentOutlined,
  ContainerOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  NodeIndexOutlined,
} from "@ant-design/icons";
import { TradeRoute } from "./types";
import { formatPrice, formatStock } from "../mercancia/utils";

/**
 * Props for {@link RouteResults}.
 *
 * The RouteFinder (task 8.3) wires to these names:
 * - `routes`: the ranked list of trade routes returned by the Route_Engine.
 *   An empty array renders the no-results message (Requirement 7.2).
 * - `computing`: true while a route computation is in progress; renders a
 *   loading indicator until results or the no-results message replace it
 *   (Requirement 7.3).
 * - `expandedView`: when true, the table shows the extended set of route
 *   details (Requirement 4.5).
 */
export interface RouteResultsProps {
  /** Ranked trade routes to display (already sorted by the engine). */
  routes: TradeRoute[];
  /** Whether a route computation is currently in progress. */
  computing: boolean;
  /** Whether the "Expanded view" toggle is enabled. */
  expandedView: boolean;
}

const NO_RESULTS_MESSAGE = "No se encontraron rutas";
const COMPUTING_MESSAGE = "Calculando rutas...";

export default function RouteResults({
  routes,
  computing,
  expandedView,
}: RouteResultsProps) {
  // Base columns required by Requirement 7.1: buy terminal, sell terminal,
  // commodity, quantity (SCU), capital required (UEC), and profit (UEC).
  const baseColumns: ColumnsType<TradeRoute> = [
    {
      title: (
        <span className="flex items-center gap-1">
          <ShopOutlined className="text-cyan-400" />
          Comprar en
        </span>
      ),
      dataIndex: "buyTerminalName",
      key: "buyTerminalName",
      ellipsis: true,
      render: (name: string) => (
        <span className="font-medium text-gray-100">{name}</span>
      ),
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <DollarOutlined className="text-blue-400" />
          Vender en
        </span>
      ),
      dataIndex: "sellTerminalName",
      key: "sellTerminalName",
      ellipsis: true,
      render: (name: string) => (
        <span className="font-medium text-gray-100">{name}</span>
      ),
    },
    {
      title: "Mercancía",
      dataIndex: "commodityName",
      key: "commodityName",
      ellipsis: true,
      render: (name: string) => <span className="text-gray-200">{name}</span>,
    },
    {
      title: "Cantidad (SCU)",
      key: "quantityScu",
      align: "right",
      width: 150,
      render: (_, record) => (
        <span className="text-gray-300 font-mono text-xs">
          {formatStock(record.quantityScu)}
        </span>
      ),
    },
    {
      title: "Capital (UEC)",
      key: "buyValue",
      align: "right",
      width: 170,
      render: (_, record) => (
        <Tag color="geekblue" className="font-mono text-xs m-0">
          {formatPrice(record.buyValue)}
        </Tag>
      ),
    },
    {
      title: (
        <span className="flex items-center justify-end gap-1">
          <RiseOutlined className="text-green-400" />
          Ganancia (UEC)
        </span>
      ),
      key: "profit",
      align: "right",
      width: 180,
      render: (_, record) => (
        <Tag color="green" className="font-mono text-xs m-0">
          {formatPrice(record.profit)}
        </Tag>
      ),
    },
  ];

  // Extended columns shown only when the "Expanded view" toggle is on
  // (Requirement 4.5 / 7 extended details).
  const extendedColumns: ColumnsType<TradeRoute> = [
    {
      title: (
        <span className="flex items-center justify-end gap-1">
          <DollarOutlined className="text-amber-400" />
          Venta bruta (UEC)
        </span>
      ),
      key: "sellValue",
      align: "right",
      width: 170,
      render: (_, record) => (
        <span className="text-gray-300 font-mono text-xs">
          {formatPrice(record.sellValue)}
        </span>
      ),
    },
    {
      title: (
        <span className="flex items-center justify-end gap-1">
          <NodeIndexOutlined className="text-[#9ED0FA]" />
          Paradas
        </span>
      ),
      dataIndex: "stops",
      key: "stops",
      align: "right",
      width: 110,
      render: (stops: number) => (
        <span className="text-gray-300 font-mono text-xs">{stops}</span>
      ),
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <SafetyOutlined className="text-cyan-400" />
          Seguridad
        </span>
      ),
      dataIndex: "securityLevel",
      key: "securityLevel",
      align: "right",
      width: 120,
      render: (level: number) => (
        <span className="text-gray-300 font-mono text-xs">{level}</span>
      ),
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <ContainerOutlined className="text-[#9ED0FA]" />
          Cajas (SCU)
        </span>
      ),
      key: "boxSizesScu",
      width: 160,
      render: (_, record) =>
        record.boxSizesScu.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {record.boxSizesScu.map((size) => (
              <Tag key={size} className="font-mono text-xs m-0">
                {size}
              </Tag>
            ))}
          </span>
        ) : (
          <span className="text-gray-500">—</span>
        ),
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <ClockCircleOutlined className="text-amber-400" />
          Espera
        </span>
      ),
      dataIndex: "requiresWaitTimer",
      key: "requiresWaitTimer",
      align: "center",
      width: 110,
      render: (requiresWaitTimer: boolean) =>
        requiresWaitTimer ? (
          <Tag color="orange" className="text-xs m-0">
            Sí
          </Tag>
        ) : (
          <Tag className="text-xs m-0">No</Tag>
        ),
    },
    {
      title: (
        <span className="flex items-center gap-1">
          <EnvironmentOutlined className="text-[#9ED0FA]" />
          Oculta
        </span>
      ),
      dataIndex: "includesHiddenLocation",
      key: "includesHiddenLocation",
      align: "center",
      width: 110,
      render: (includesHiddenLocation: boolean) =>
        includesHiddenLocation ? (
          <Tag color="red" className="text-xs m-0">
            Sí
          </Tag>
        ) : (
          <Tag className="text-xs m-0">No</Tag>
        ),
    },
  ];

  const columns = expandedView
    ? [...baseColumns, ...extendedColumns]
    : baseColumns;

  return (
    <Card
      size="small"
      title={
        <div className="flex items-center gap-2 py-1">
          <RiseOutlined className="text-green-400" />
          <span className="text-gray-100 font-semibold">Rutas</span>
          <Tag className="ml-auto">{routes.length}</Tag>
        </div>
      }
    >
      {computing ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Spin size="large" />
          <span className="text-gray-400">{COMPUTING_MESSAGE}</span>
        </div>
      ) : (
        <Table<TradeRoute>
          columns={columns}
          dataSource={routes}
          rowKey={(record) =>
            `${record.commodityId}-${record.buyTerminalId}-${record.sellTerminalId}`
          }
          pagination={
            routes.length > 10 ? { pageSize: 10, size: "small" } : false
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-gray-500">{NO_RESULTS_MESSAGE}</span>
                }
              />
            ),
          }}
          size="small"
          scroll={{ x: expandedView ? 1200 : 600 }}
        />
      )}
    </Card>
  );
}
