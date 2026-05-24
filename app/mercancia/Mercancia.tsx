"use client";

import { SearchOutlined, CloseCircleFilled } from "@ant-design/icons";
import { AutoComplete, Input } from "antd";
import type { AutoCompleteProps } from "antd";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommodityOption } from "./types";

interface Props {
  commoditiesList: CommodityOption[];
}

const Mercancia = ({ commoditiesList }: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const currentSlug = useMemo(() => {
    const segments = pathname.split("/");
    return segments.length > 2 ? segments[2] : undefined;
  }, [pathname]);

  const [inputValue, setInputValue] = useState<string | null>(null);

  const searchValue = useMemo(() => {
    if (inputValue !== null) return inputValue;
    if (currentSlug && commoditiesList.length > 0) {
      const match = commoditiesList.find((item) => item.slug === currentSlug);
      return match ? match.name : "";
    }
    return "";
  }, [currentSlug, commoditiesList, inputValue]);

  const options = useMemo<AutoCompleteProps["options"]>(() => {
    if (!searchValue) return [];

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
  }, [commoditiesList, searchValue]);

  const onSelect = (value: string) => {
    const commodity = commoditiesList.find((item) => item.name === value);
    if (commodity) {
      setInputValue(value);
      router.push(`/mercancia/${commodity.slug}`);
    }
  };

  const onClear = () => {
    setInputValue("");
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
            onChange={(value) => setInputValue(value)}
          >
            <Input
              size="large"
              placeholder="Buscar mercancía por nombre..."
              prefix={<SearchOutlined className="text-[#4a9eda]" />}
              suffix={
                <CloseCircleFilled
                  onClick={onClear}
                  className="text-gray-500 hover:text-[#9ED0FA] cursor-pointer transition-colors"
                  style={{ visibility: searchValue ? "visible" : "hidden" }}
                />
              }
            />
          </AutoComplete>
        </div>
      </div>
    </div>
  );
};

export default Mercancia;
