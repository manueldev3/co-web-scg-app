"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, message } from "antd";
import {
  getGuideById,
  getCategories,
  type Guide,
  type GuideCategory,
} from "@/lib/firebase/guides";
import GuideEditor from "../../components/GuideEditor";

export default function EditarGuiaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [guideData, catsData] = await Promise.all([
        getGuideById(id),
        getCategories(),
      ]);

      if (!guideData) {
        message.error("Guía no encontrada.");
        router.replace("/admin/guias");
        return;
      }

      setGuide(guideData);
      setCategories(catsData);
      setLoading(false);
    }
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return <GuideEditor guide={guide} categories={categories} />;
}
