"use client";

import { useMemo } from "react";
import { InputNumber, Radio, Segmented, Select, Switch } from "antd";
import type {
  MarketData,
  MultiselectFilter,
  ProfitMode,
  RouteFilters,
  SelectionMode,
} from "./types";

/**
 * Props for {@link FiltersSidebar}.
 *
 * This is a controlled component: it holds no internal filter state. The parent
 * (RouteFinder, task 8.3) owns the canonical {@link RouteFilters} state and passes
 * it down via `filters`, receiving every change through `onChange`.
 *
 * @property filters  The current filter state to render (controlled value).
 * @property onChange Called with the complete, updated {@link RouteFilters} whenever
 *                    the user changes any control. The parent should replace its state
 *                    with the value provided.
 * @property market   The normalized {@link MarketData} used to populate the commodity,
 *                    commodity-type, faction and security options.
 */
export interface FiltersSidebarProps {
  filters: RouteFilters;
  onChange: (filters: RouteFilters) => void;
  market: MarketData;
}

/** Standard Star Citizen container sizes, in SCU. */
const BOX_SIZES_SCU = [1, 2, 4, 8, 16, 24, 32];

type SelectOption = { label: string; value: number };

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  filters,
  onChange,
  market,
}) => {
  // Merge a partial change into the current filters and bubble it up.
  const update = (partial: Partial<RouteFilters>) => {
    onChange({ ...filters, ...partial });
  };

  // Update a single multiselect filter (mode and/or values).
  const updateMultiselect = (
    key: "commodityTypes" | "commodities" | "factions",
    partial: Partial<MultiselectFilter>,
  ) => {
    update({ [key]: { ...filters[key], ...partial } } as Partial<RouteFilters>);
  };

  // Commodities → { label: name, value: id }, sorted by name.
  const commodityOptions = useMemo<SelectOption[]>(
    () =>
      (market.commodities ?? [])
        .map((c) => ({ label: c.name, value: c.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [market.commodities],
  );

  // Commodity types → distinct id_parent values, labeled by the parent
  // commodity's name when available (Req 5.1).
  const commodityTypeOptions = useMemo<SelectOption[]>(() => {
    const nameById = new Map<number, string>();
    for (const c of market.commodities ?? []) {
      nameById.set(c.id, c.name);
    }
    const typeIds = new Set<number>();
    for (const c of market.commodities ?? []) {
      if (c.id_parent != null) typeIds.add(c.id_parent);
    }
    return Array.from(typeIds)
      .map((id) => ({ label: nameById.get(id) ?? `Tipo ${id}`, value: id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [market.commodities]);

  // Factions → distinct faction ids from terminal metadata (the bulk prices
  // endpoint does not carry faction data; terminals do). Labeled by faction
  // name when available.
  const factionOptions = useMemo<SelectOption[]>(() => {
    const nameById = new Map<number, string>();
    for (const t of market.terminals ?? []) {
      if (t.factionId && t.factionId > 0) {
        nameById.set(t.factionId, t.factionName ?? `Facción ${t.factionId}`);
      }
    }
    return Array.from(nameById.entries())
      .map(([id, label]) => ({ value: id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [market.terminals]);

  // Minimum-security options → distinct security levels present in terminals.
  const securityOptions = useMemo<SelectOption[]>(() => {
    const levels = new Set<number>();
    for (const t of market.terminals ?? []) {
      if (t.securityLevel != null) levels.add(t.securityLevel);
    }
    return Array.from(levels)
      .sort((a, b) => a - b)
      .map((level) => ({ label: `Nivel ${level}`, value: level }));
  }, [market.terminals]);

  const labelClass = "block text-sm font-medium text-[#9ED0FA] mb-2";
  const sectionClass = "mb-6";

  const renderMultiselect = (
    title: string,
    key: "commodityTypes" | "commodities" | "factions",
    options: SelectOption[],
    placeholder: string,
  ) => {
    const value = filters[key];
    return (
      <div className={sectionClass}>
        <label className={labelClass}>{title}</label>
        <Segmented<SelectionMode>
          className="mb-2"
          block
          value={value.mode}
          onChange={(mode) => updateMultiselect(key, { mode })}
          options={[
            { label: "Evitar", value: "avoid" },
            { label: "Solo", value: "only" },
          ]}
        />
        <Select<number[]>
          className="w-full"
          mode="multiple"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={placeholder}
          value={value.values}
          options={options}
          onChange={(values) => updateMultiselect(key, { values })}
        />
      </div>
    );
  };

  const toggleRow = (
    title: string,
    checked: boolean,
    onToggle: (checked: boolean) => void,
  ) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-200">{title}</span>
      <Switch checked={checked} onChange={onToggle} />
    </div>
  );

  return (
    <aside className="w-full rounded-lg border border-[#143A52] bg-[#071421] p-4 text-white">
      <h2 className="mb-4 text-lg font-semibold text-[#9ED0FA]">Filtros</h2>

      {/* Profit mode (Req 4.1) */}
      <div className={sectionClass}>
        <label className={labelClass}>Modo de ganancia</label>
        <Radio.Group
          value={filters.profitMode}
          onChange={(e) => update({ profitMode: e.target.value as ProfitMode })}
        >
          <Radio value="over_time" className="text-gray-200!">
            Ganancia por tiempo
          </Radio>
          <Radio value="pure_profit" className="text-gray-200!">
            Ganancia pura
          </Radio>
        </Radio.Group>
      </div>

      {/* Max stops (Req 4.2) */}
      <div className={sectionClass}>
        <label className={labelClass}>Máximo de paradas</label>
        <InputNumber
          className="w-full"
          min={1}
          step={1}
          precision={0}
          placeholder="Sin límite"
          value={filters.maxStops}
          onChange={(value) =>
            update({ maxStops: value == null ? null : Number(value) })
          }
        />
      </div>

      {/* Include/exclude multiselects (Req 5.1, 5.2) */}
      {renderMultiselect(
        "Tipos de mercancía",
        "commodityTypes",
        commodityTypeOptions,
        "Selecciona tipos de mercancía",
      )}
      {renderMultiselect(
        "Mercancías",
        "commodities",
        commodityOptions,
        "Selecciona mercancías",
      )}
      {renderMultiselect(
        "Facciones",
        "factions",
        factionOptions,
        "Selecciona facciones",
      )}

      {/* Minimum security (Req 6.1) */}
      <div className={sectionClass}>
        <label className={labelClass}>Seguridad mínima</label>
        <Select<number | null>
          className="w-full"
          allowClear
          placeholder="Sin mínimo"
          value={filters.minSecurityLevel}
          options={securityOptions}
          onChange={(value) =>
            update({ minSecurityLevel: value == null ? null : value })
          }
        />
      </div>

      {/* Supported box size (Req 6.3) */}
      <div className={sectionClass}>
        <label className={labelClass}>Tamaño de caja (SCU)</label>
        <Select<number | null>
          className="w-full"
          allowClear
          placeholder="Cualquiera"
          value={filters.boxSizeScu}
          options={BOX_SIZES_SCU.map((size) => ({
            label: `${size} SCU`,
            value: size,
          }))}
          onChange={(value) =>
            update({ boxSizeScu: value == null ? null : value })
          }
        />
      </div>

      {/* Toggles (Req 4.4, 6.5) */}
      <div className="border-t border-[#143A52] pt-3">
        {toggleRow(
          "Permitir temporizadores de espera",
          filters.allowWaitTimers,
          (checked) => update({ allowWaitTimers: checked }),
        )}
        {toggleRow("Carga automática", filters.autoLoading, (checked) =>
          update({ autoLoading: checked }),
        )}
        {toggleRow("Filtros inteligentes", filters.smartFilters, (checked) =>
          update({ smartFilters: checked }),
        )}
        {toggleRow("Vista expandida", filters.expandedView, (checked) =>
          update({ expandedView: checked }),
        )}
        {toggleRow(
          "Evitar ubicaciones ocultas",
          filters.avoidHiddenLocations,
          (checked) => update({ avoidHiddenLocations: checked }),
        )}
      </div>
    </aside>
  );
};

export default FiltersSidebar;
