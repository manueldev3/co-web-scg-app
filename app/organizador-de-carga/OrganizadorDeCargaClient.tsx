"use client";

import { AutoComplete, AutoCompleteProps, Button, Input, Table } from "antd";
import { CommodityOption } from "../mercancia/types";
import { TerminalOption } from "../terminales/types";
import { useMemo, useState } from "react";
import {
  CloseCircleFilled,
  ContainerFilled,
  SearchOutlined,
} from "@ant-design/icons";
import { OptimizedDestination } from "./types";

export interface OrganizadorDeCargaProps {
  commodities: CommodityOption[];
  terminals: TerminalOption[];
}

const OrganizadorDeCargaClient: React.FC<OrganizadorDeCargaProps> = ({
  commodities,
  terminals,
}: OrganizadorDeCargaProps) => {
  const [destinations, setDestinations] = useState<OptimizedDestination[]>([]);
  const [scuCount, setScuCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [inputCommodityValue, setInputCommodityValue] = useState<string | null>(
    null,
  );
  const [inputTerminalValue, setInputTerminalValue] = useState<string | null>(
    null,
  );

  const searchCommodityValue = useMemo(() => {
    if (inputCommodityValue !== null) return inputCommodityValue;
    return "";
  }, [inputCommodityValue]);

  const searchTerminalValue = useMemo(() => {
    if (inputTerminalValue !== null) return inputTerminalValue;
    return "";
  }, [inputTerminalValue]);

  const commoditiesOptions = useMemo<AutoCompleteProps["options"]>(() => {
    if (!searchCommodityValue) return [];

    return (commodities ?? [])
      .filter((item) =>
        item.name.toLowerCase().includes(searchCommodityValue.toLowerCase()),
      )
      .map((item) => ({
        value: item.name,
        label: (
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-200">{item.name}</span>
          </div>
        ),
        key: item.id,
      }));
  }, [commodities, searchCommodityValue]);

  const terminalOptions = useMemo<AutoCompleteProps["options"]>(() => {
    if (!searchTerminalValue) return [];

    return (terminals ?? [])
      .filter((item) =>
        item.name.toLowerCase().includes(searchTerminalValue.toLowerCase()),
      )
      .map((item) => ({
        value: item.name,
        label: (
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-200">{item.name}</span>
          </div>
        ),
        key: item.id,
      }));
  }, [terminals, searchTerminalValue]);

  const commodityFilters = useMemo(
    () =>
      Array.from(
        new Set(destinations.map((destination) => destination.commodity.name)),
      )
        .sort()
        .map((name) => ({ text: name, value: name })),
    [destinations],
  );

  const terminalFilters = useMemo(
    () =>
      Array.from(
        new Set(destinations.map((destination) => destination.terminal.name)),
      )
        .sort()
        .map((name) => ({ text: name, value: name })),
    [destinations],
  );

  const scuFilters = useMemo(
    () =>
      Array.from(
        new Set(destinations.map((destination) => destination.scuCount)),
      )
        .sort((a, b) => a - b)
        .map((value) => ({ text: String(value), value: String(value) })),
    [destinations],
  );

  const onSelect = (value: string) => {
    const commodity = commodities.find((item) => item.name === value);
    if (commodity) {
      setInputCommodityValue(value);
    }
  };

  const onTerminalSelect = (value: string) => {
    setInputTerminalValue(value);
  };

  const onClear = () => {
    setInputCommodityValue(null);
  };

  const onTerminalClear = () => {
    setInputTerminalValue(null);
  };

  const onAddDestination = () => {
    if (!inputCommodityValue || !inputTerminalValue) {
      setError("Por favor, selecciona una mercancía y una terminal.");
      return;
    } else {
      setError(null);
      const commodity = commodities.find(
        (item) => item.name === inputCommodityValue,
      );
      const terminal = terminals.find(
        (item) => item.name === inputTerminalValue,
      );
      if (commodity && terminal && scuCount > 0) {
        const newDestination: OptimizedDestination = {
          commodity,
          terminal,
          scuCount,
        };
        setDestinations([...destinations, newDestination]);
        onClear();
        onTerminalClear();
        setScuCount(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1929] text-white">
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide shrink-0">
              ORGANIZADOR DE CARGA
            </h1>
            <div className="grid w-full gap-4 sm:grid-cols-9 sm:flex-1">
              <AutoComplete
                className="w-full col-span-3"
                popupMatchSelectWidth={true}
                options={commoditiesOptions}
                onSelect={onSelect}
                value={searchCommodityValue}
                onChange={(value) => setInputCommodityValue(value)}
              >
                <Input
                  className="bg-[#071421]! border-[#143A52]! text-white!"
                  size="large"
                  placeholder="Buscar mercancía por nombre..."
                  prefix={<SearchOutlined className="text-[#9ED0FA]" />}
                  suffix={
                    <CloseCircleFilled
                      onClick={onClear}
                      className="text-white/70 hover:text-[#9ED0FA] cursor-pointer transition-colors"
                      style={{
                        visibility: searchCommodityValue ? "visible" : "hidden",
                      }}
                    />
                  }
                />
              </AutoComplete>
              <AutoComplete
                className="w-full col-span-3"
                popupMatchSelectWidth={true}
                options={terminalOptions}
                onSelect={onTerminalSelect}
                value={searchTerminalValue}
                onChange={(value) => setInputTerminalValue(value)}
              >
                <Input
                  className="bg-[#071421]! border-[#143A52]! text-white!"
                  size="large"
                  placeholder="Buscar terminal por nombre..."
                  prefix={<SearchOutlined className="text-[#9ED0FA]" />}
                  suffix={
                    <CloseCircleFilled
                      onClick={onTerminalClear}
                      className="text-white/70 hover:text-[#9ED0FA] cursor-pointer transition-colors"
                      style={{
                        visibility: searchTerminalValue ? "visible" : "hidden",
                      }}
                    />
                  }
                />
              </AutoComplete>
              <Input
                className="col-span-2 bg-[#071421]! border-[#143A52]! text-white!"
                value={scuCount}
                onChange={(e) => setScuCount(Number(e.target.value))}
                size="large"
                placeholder="Introduce el número de SCU"
                prefix={<ContainerFilled className="text-[#9ED0FA]" />}
              />

              <Button
                type="primary"
                size="large"
                href=""
                className="col-span-1"
                onClick={onAddDestination}
                disabled={
                  !inputCommodityValue || !inputTerminalValue || scuCount <= 0
                }
              >
                <span className="uppercase">Agregar</span>
              </Button>
            </div>
            {error ? (
              <div className="mt-3 text-sm text-red-400">{error}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="m-6">
        <div className="flex mb-4 items-center justify-between w-full">
          <div>
            <h2 className="text-xl font-semibold text-[#9ED0FA] mb-4">
              Destinos
            </h2>
            {destinations.length === 0 ? (
              <div className="text-gray-400">
                No se han agregado destinos aún.
              </div>
            ) : null}
          </div>
          <Button
            type="primary"
            size="large"
            href=""
            onClick={() => setDestinations([])}
            disabled={destinations.length === 0}
          >
            <span className="uppercase">Limpiar Destinos</span>
          </Button>
        </div>
        <Table
          className="bg-[#071421]! text-white"
          rowClassName={() => "bg-[#071421] text-white"}
          dataSource={destinations}
          rowKey={(record, index) =>
            `${record.commodity.id}-${record.terminal.id}-${record.scuCount}-${index}`
          }
          columns={[
            {
              title: "Mercancía",
              dataIndex: "commodity",
              key: "commodity",
              filters: commodityFilters,
              filterSearch: true,
              onHeaderCell: () => ({
                style: { color: "#ffffff", background: "#071421" },
              }),
              onFilter: (value, record) =>
                record.commodity.name
                  .toLowerCase()
                  .includes(String(value).toLowerCase()),
              render: (commodity: CommodityOption) => (
                <span className="text-gray-200">{commodity.name}</span>
              ),
            },
            {
              title: "Terminal",
              dataIndex: "terminal",
              key: "terminal",
              filters: terminalFilters,
              filterSearch: true,
              onHeaderCell: () => ({
                style: { color: "#ffffff", background: "#071421" },
              }),
              onFilter: (value, record) =>
                record.terminal.name
                  .toLowerCase()
                  .includes(String(value).toLowerCase()),
              render: (terminal: TerminalOption) => (
                <span className="text-gray-200">{terminal.name}</span>
              ),
            },
            {
              title: "SCU",
              dataIndex: "scuCount",
              key: "scuCount",
              filters: scuFilters,
              onHeaderCell: () => ({
                style: { color: "#ffffff", background: "#071421" },
              }),
              onFilter: (value, record) => record.scuCount === Number(value),
              sorter: (a, b) => a.scuCount - b.scuCount,
              render: (scuCount: number) => (
                <span className="text-gray-200">{scuCount}</span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default OrganizadorDeCargaClient;
