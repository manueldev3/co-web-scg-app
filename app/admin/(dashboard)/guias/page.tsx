"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Table, Tag, Popconfirm, Space, message } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  getGuides,
  getCategories,
  deleteGuide,
  type Guide,
  type GuideCategory,
} from "@/lib/firebase/guides";

export default function AdminGuiasPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [guidesData, catsData] = await Promise.all([
      getGuides(),
      getCategories(),
    ]);
    setGuides(guidesData);
    setCategories(catsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  const handleDelete = async (id: string) => {
    try {
      await deleteGuide(id);
      message.success("Guía eliminada.");
      await loadData();
    } catch {
      message.error("Error al eliminar la guía.");
    }
  };

  const columns: ColumnsType<Guide> = [
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
      render: (title: string, record) => (
        <div>
          <span className="font-medium text-white">{record.icon} {title}</span>
          <div className="text-xs text-gray-400 mt-0.5">/guias/{record.slug}</div>
        </div>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "categoryId",
      key: "categoryId",
      width: 160,
      render: (id: string) => (
        <span className="text-gray-300">{categoryName(id)}</span>
      ),
    },
    {
      title: "Estado",
      dataIndex: "published",
      key: "published",
      width: 120,
      align: "center",
      render: (published: boolean) =>
        published ? (
          <Tag icon={<EyeOutlined />} color="success">
            Publicada
          </Tag>
        ) : (
          <Tag icon={<EyeInvisibleOutlined />} color="default">
            Borrador
          </Tag>
        ),
    },
    {
      title: "Lectura",
      dataIndex: "readTime",
      key: "readTime",
      width: 90,
      align: "center",
      render: (time: string) => (
        <span className="text-xs text-gray-400">{time}</span>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Link href={`/admin/guias/${record.id}/editar`}>
            <Button type="text" size="small" icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="¿Eliminar esta guía?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Guías</h1>
        <Link href="/admin/guias/nueva">
          <Button type="primary" icon={<PlusOutlined />}>
            Nueva guía
          </Button>
        </Link>
      </div>

      <Table<Guide>
        columns={columns}
        dataSource={guides}
        rowKey="id"
        loading={loading}
        pagination={guides.length > 10 ? { pageSize: 10 } : false}
        size="small"
      />
    </div>
  );
}
