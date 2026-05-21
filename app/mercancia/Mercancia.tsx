"use client";

import { SearchOutlined, CloseCircleFilled } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import type { AutoCompleteProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommodityOption } from "./types";

const Mercancia = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [commoditiesList, setCommoditiesList] = useState<CommodityOption[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);

  const currentSlug = useMemo(() => {
    const segments = pathname.split("/");
    return segments.length > 2 ? segments[2] : undefined;
  }, [pathname]);

  // Fetch commodities list from UEX API
  useEffect(() => {
    fetch("https://api.uexcorp.space/2.0/commodities", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_UEX_API_TOKEN}`,
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const list: CommodityOption[] = (data.data || []).map(
          (item: { id: number; name: string }) => ({
            id: item.id,
            name: item.name,
            slug: item.name.toLowerCase().replace(/\s+/g, "-"),
          }),
        );
        setCommoditiesList(list);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Sync search value with URL changes
  useEffect(() => {
    if (currentSlug && commoditiesList.length > 0) {
      const match = commoditiesList.find((item) => item.slug === currentSlug);
      setSearchValue(match ? match.name : "");
    } else if (!currentSlug) {
      setSearchValue("");
    }
  }, [currentSlug, commoditiesList]);

  const options = useMemo<AutoCompleteProps["options"]>(() => {
    if (!searchValue || loading) return [];

    return commoditiesList
      .filter((item) =>
        item.name.toLowerCase().includes(searchValue.toLowerCase()),
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
  }, [commoditiesList, searchValue, loading]);

  const onSelect = (value: string) => {
    const commodity = commoditiesList.find((item) => item.name === value);
    if (commodity) {
      setSearchValue(value);
      router.push(`/mercancia/${commodity.slug}`);
    }
  };

  const onClear = () => {
    setSearchValue("");
    router.push("/mercancia");
  };

  return (
    <div className="border-b border-[#1e4a6e]/50 bg-[#0a1929]/80 backdrop-blur-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#9ED0FA] tracking-wide shrink-0">
            MERCANCÍA
          </h1>
          <AutoComplete
            className="w-full sm:flex-1"
            popupMatchSelectWidth={true}
            options={options}
            onSelect={onSelect}
            value={searchValue}
            onChange={(value) => setSearchValue(value)}
          >
            <Input
              size="large"
              placeholder={
                loading
                  ? "Cargando mercancías..."
                  : "Buscar mercancía por nombre..."
              }
              prefix={<SearchOutlined className="text-[#4a9eda]" />}
              suffix={
                <CloseCircleFilled
                  onClick={onClear}
                  className="text-gray-500 hover:text-[#9ED0FA] cursor-pointer transition-colors"
                  style={{ visibility: searchValue ? "visible" : "hidden" }}
                />
              }
              disabled={loading}
            />
          </AutoComplete>
        </div>
      </div>
    </div>
  );
};

export default Mercancia;
