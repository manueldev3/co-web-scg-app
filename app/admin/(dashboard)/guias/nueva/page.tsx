"use client";

import { useEffect, useState } from "react";
import { Spin } from "antd";
import { getCategories, type GuideCategory } from "@/lib/firebase/guides";
import GuideEditor from "../components/GuideEditor";

export default function NuevaGuiaPage() {
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return <GuideEditor categories={categories} />;
}
