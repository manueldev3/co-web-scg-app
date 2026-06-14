"use client";

import { useMemo, useState } from "react";
import { Alert, Button, InputNumber, Select } from "antd";
import {
  RocketOutlined,
  WalletOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { MarketData, RouteFilters, TradeRoute } from "./types";
import { computeRoutes, defaultFilters, validateInputs } from "./route-engine";
import FiltersSidebar from "./FiltersSidebar";
import RouteResults from "./RouteResults";

/**
 * Props for {@link RouteFinder}.
 *
 * The server page (`app/mejor-ruta/page.tsx`, task 9.1) fetches the UEX market
 * data and passes the normalized {@link MarketData} as the single `market`
 * prop. RouteFinder owns all interactive state from here on.
 */
export interface RouteFinderProps {
  /** Normalized market data fetched server-side by the route page. */
  market: MarketData;
}

/** Status of the route computation lifecycle. */
type Status = "idle" | "computing" | "done" | "error";

/** Spanish error shown when critical market datasets failed to load (Req 8.2). */
const MARKET_DATA_ERROR = "No se pudieron cargar los datos de mercado.";
const MARKET_DATA_ERROR_DETAIL =
  "No pudimos obtener los precios y naves desde la API de UEX Corp en este momento. " +
  "Suele ser temporal: vuelve a intentarlo en unos minutos. Si el problema persiste, " +
  "es posible que el servicio de UEX esté caído o haya cambiado.";

/**
 * RouteFinder — the integrating client component for the "Mejor Ruta" tool.
 *
 * Owns the ship selection, the initial investment, and the full
 * {@link RouteFilters} state (seeded from {@link defaultFilters}). It renders
 * the ship `Select`, the investment `InputNumber`, the Submit/Reset controls,
 * the {@link FiltersSidebar}, and the {@link RouteResults}.
 *
 * On Submit it runs {@link validateInputs}; invalid input shows field-level
 * messages and does NOT trigger a computation (Req 2.5, 2.6). Valid input
 * resolves the selected ship's cargo capacity, runs {@link computeRoutes}, and
 * renders the ranked routes (Req 2.1, 2.2, 2.3, 7.2, 7.3). Reset restores the
 * default filters and clears the ship and investment (Req 2.4).
 *
 * If critical datasets are empty (no prices or no ships) it shows the
 * market-data error message (Req 8.2).
 */
const RouteFinder: React.FC<RouteFinderProps> = ({ market }) => {
  // Critical datasets must be present to compute any route (Req 8.2).
  const marketDataError =
    (market.prices?.length ?? 0) === 0 || (market.vehicles?.length ?? 0) === 0;

  const [shipId, setShipId] = useState<number | null>(null);
  const [investment, setInvestment] = useState<number | null>(null);
  const [filters, setFilters] = useState<RouteFilters>(() => defaultFilters());
  const [routes, setRoutes] = useState<TradeRoute[]>([]);
  const [status, setStatus] = useState<Status>(() =>
    marketDataError ? "error" : "idle",
  );
  // Field-level validation messages (Req 2.5, 2.6).
  const [errors, setErrors] = useState<{ ship?: string; investment?: string }>(
    {},
  );

  // Ship options from the vehicles dataset: label = name, value = id (Req 2.1).
  const shipOptions = useMemo(
    () =>
      (market.vehicles ?? [])
        .map((v) => ({ label: v.name, value: v.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [market.vehicles],
  );

  const handleSubmit = () => {
    // Validate before computing; do nothing else on failure (Req 2.5, 2.6).
    const validation = validateInputs(shipId, investment);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    // Resolve the selected ship's cargo capacity; treat null scu as 0.
    const vehicle = (market.vehicles ?? []).find((v) => v.id === shipId);
    const shipCargoScu = vehicle?.scu ?? 0;

    setStatus("computing");
    const result = computeRoutes({
      prices: market.prices,
      terminals: market.terminals,
      shipCargoScu,
      investment: investment as number,
      filters,
      commodities: market.commodities,
    });
    setRoutes(result);
    setStatus("done");
  };

  const handleReset = () => {
    // Restore defaults and clear ship/investment + results (Req 2.4).
    setShipId(null);
    setInvestment(null);
    setFilters(defaultFilters());
    setRoutes([]);
    setErrors({});
    setStatus("idle");
  };

  return (
    <div className="min-h-screen bg-[#040d16] text-white">
      {/* Header bar (matches the Mercancía page conventions) */}
      <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide">
            MEJOR RUTA
          </h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {marketDataError ? (
          <Alert
            type="error"
            showIcon
            title={MARKET_DATA_ERROR}
            description={
              <div className="flex flex-col gap-3">
                <span>{MARKET_DATA_ERROR_DETAIL}</span>
                <a
                  href="/mejor-ruta"
                  className="self-start rounded-md border border-red-400/40 px-3 py-1 text-sm text-red-200 hover:bg-red-400/10 no-underline"
                >
                  Reintentar
                </a>
              </div>
            }
            className="mb-6"
          />
        ) : (
          <>
            {/* Ship + investment inputs and Submit/Reset controls */}
            <div className="mb-6 rounded-lg border border-[#143A52] bg-[#071421] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                {/* Ship selector (Req 2.1) */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#9ED0FA] mb-2">
                    <RocketOutlined className="mr-1" />
                    Nave
                  </label>
                  <Select<number>
                    className="w-full"
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    placeholder="Selecciona una nave"
                    value={shipId}
                    options={shipOptions}
                    status={errors.ship ? "error" : undefined}
                    onChange={(value) => {
                      setShipId(value ?? null);
                      if (errors.ship) {
                        setErrors((prev) => ({ ...prev, ship: undefined }));
                      }
                    }}
                  />
                  {errors.ship && (
                    <span className="mt-1 block text-xs text-red-400">
                      {errors.ship}
                    </span>
                  )}
                </div>

                {/* Initial investment input (Req 2.2) */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#9ED0FA] mb-2">
                    <WalletOutlined className="mr-1" />
                    Inversión inicial (UEC)
                  </label>
                  <InputNumber
                    className="w-full"
                    style={{ width: "100%" }}
                    min={0}
                    step={1000}
                    placeholder="Ingresa tu capital en UEC"
                    value={investment}
                    status={errors.investment ? "error" : undefined}
                    formatter={(value) => {
                      const s =
                        value === undefined || value === null ? "" : `${value}`;
                      return s === ""
                        ? ""
                        : s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    }}
                    parser={(value) =>
                      value ? Number(value.replace(/,/g, "")) : (null as never)
                    }
                    onChange={(value) => {
                      setInvestment(value == null ? null : Number(value));
                      if (errors.investment) {
                        setErrors((prev) => ({
                          ...prev,
                          investment: undefined,
                        }));
                      }
                    }}
                  />
                  {errors.investment && (
                    <span className="mt-1 block text-xs text-red-400">
                      {errors.investment}
                    </span>
                  )}
                </div>

                {/* Submit / Reset controls (Req 2.3) */}
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSubmit}
                  >
                    Buscar rutas
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    Reiniciar
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters sidebar + results */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
              <FiltersSidebar
                filters={filters}
                onChange={setFilters}
                market={market}
              />
              <RouteResults
                routes={routes}
                computing={status === "computing"}
                expandedView={filters.expandedView}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RouteFinder;
