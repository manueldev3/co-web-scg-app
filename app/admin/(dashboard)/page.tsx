"use client";

import { useEffect, useState } from "react";
import { Card, Statistic } from "antd";
import { BookOutlined, AppstoreOutlined, EyeOutlined } from "@ant-design/icons";
import { getGuides, getCategories } from "@/lib/firebase/guides";

export default function AdminDashboardPage() {
  const [guidesCount, setGuidesCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);

  useEffect(() => {
    async function load() {
      const [guides, categories] = await Promise.all([
        getGuides(),
        getCategories(),
      ]);
      setGuidesCount(guides.length);
      setPublishedCount(guides.filter((g) => g.published).length);
      setCategoriesCount(categories.length);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <Statistic
            title={<span className="text-gray-400">Total de guías</span>}
            value={guidesCount}
            prefix={<BookOutlined className="text-[#9ED0FA]" />}
          />
        </Card>
        <Card>
          <Statistic
            title={<span className="text-gray-400">Publicadas</span>}
            value={publishedCount}
            prefix={<EyeOutlined className="text-green-400" />}
          />
        </Card>
        <Card>
          <Statistic
            title={<span className="text-gray-400">Categorías</span>}
            value={categoriesCount}
            prefix={<AppstoreOutlined className="text-amber-400" />}
          />
        </Card>
      </div>
    </div>
  );
}
