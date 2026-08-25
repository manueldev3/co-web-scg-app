"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Modal,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type GuideCategory,
  type GuideCategoryInput,
} from "@/lib/firebase/guides";

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GuideCategory | null>(null);
  const [form, setForm] = useState<GuideCategoryInput>({
    name: "",
    slug: "",
    order: 0,
  });
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", order: categories.length });
    setModalOpen(true);
  };

  const openEdit = (cat: GuideCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, order: cat.order });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      message.warning("El nombre es obligatorio.");
      return;
    }
    const slug = form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { ...form, slug });
        message.success("Categoría actualizada.");
      } else {
        await createCategory({ ...form, slug });
        message.success("Categoría creada.");
      }
      setModalOpen(false);
      await loadCategories();
    } catch {
      message.error("Error al guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success("Categoría eliminada.");
      await loadCategories();
    } catch {
      message.error("Error al eliminar la categoría.");
    }
  };

  const columns: ColumnsType<GuideCategory> = [
    {
      title: "Orden",
      dataIndex: "order",
      key: "order",
      width: 80,
      align: "center",
    },
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span className="font-medium text-white">{name}</span>
      ),
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      render: (slug: string) => (
        <code className="text-xs text-gray-400">{slug}</code>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="¿Eliminar esta categoría?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
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
        <h1 className="text-2xl font-bold text-white">Categorías</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Nueva categoría
        </Button>
      </div>

      <Table<GuideCategory>
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />

      <Modal
        title={editing ? "Editar categoría" : "Nueva categoría"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nombre</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Comercio básico"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Slug{" "}
              <span className="text-xs text-gray-500">(se genera automáticamente si se deja vacío)</span>
            </label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="comercio-basico"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Orden</label>
            <InputNumber
              className="w-full"
              value={form.order}
              min={0}
              onChange={(val) => setForm({ ...form, order: val ?? 0 })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
