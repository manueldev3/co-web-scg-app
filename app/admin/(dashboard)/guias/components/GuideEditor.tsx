"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Select,
  Switch,
  message,
  Upload,
  Modal,
} from "antd";
import { SaveOutlined, PictureOutlined, LinkOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import MDEditor from "@uiw/react-md-editor";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  createGuide,
  updateGuide,
  uploadGuideImage,
  type Guide,
  type GuideInput,
  type GuideCategory,
} from "@/lib/firebase/guides";

interface GuideEditorProps {
  guide?: Guide | null;
  categories: GuideCategory[];
}

export default function GuideEditor({ guide, categories }: GuideEditorProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState(guide?.title ?? "");
  const [slug, setSlug] = useState(guide?.slug ?? "");
  const [summary, setSummary] = useState(guide?.summary ?? "");
  const [content, setContent] = useState(guide?.content ?? "");
  const [categoryId, setCategoryId] = useState(guide?.categoryId ?? "");
  const [tags, setTags] = useState<string[]>(guide?.tags ?? []);
  const [icon, setIcon] = useState(guide?.icon ?? "📖");
  const [readTime, setReadTime] = useState(guide?.readTime ?? "5 min");
  const [coverImage, setCoverImage] = useState(guide?.coverImage ?? "");
  const [published, setPublished] = useState(guide?.published ?? false);
  const [saving, setSaving] = useState(false);

  // Image upload modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!guide) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      message.warning("El título es obligatorio.");
      return;
    }
    if (!categoryId) {
      message.warning("Selecciona una categoría.");
      return;
    }
    if (!content.trim()) {
      message.warning("El contenido no puede estar vacío.");
      return;
    }

    setSaving(true);
    try {
      const data: GuideInput = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        summary: summary.trim(),
        content,
        categoryId,
        tags,
        icon,
        readTime,
        coverImage: coverImage || null,
        published,
        authorId: user?.uid ?? "",
      };

      if (guide) {
        await updateGuide(guide.id, data);
        message.success("Guía actualizada.");
      } else {
        await createGuide(data);
        message.success("Guía creada.");
      }
      router.push("/admin/guias");
    } catch {
      message.error("Error al guardar la guía.");
    } finally {
      setSaving(false);
    }
  };

  // Insert image into markdown content
  const insertImage = (url: string) => {
    const imageMarkdown = `![imagen](${url})`;
    setContent((prev) => prev + "\n" + imageMarkdown + "\n");
  };

  // Upload image file to Firebase Storage
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadGuideImage(file);
      insertImage(url);
      setImageModalOpen(false);
      message.success("Imagen subida correctamente.");
    } catch {
      message.error("Error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  // Insert image by URL
  const handleUrlInsert = () => {
    if (!imageUrl.trim()) {
      message.warning("Ingresa una URL válida.");
      return;
    }
    insertImage(imageUrl.trim());
    setImageUrl("");
    setImageModalOpen(false);
  };

  const customUpload = (options: { file: UploadFile | File }) => {
    const file = options.file as File;
    handleFileUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {guide ? "Editar guía" : "Nueva guía"}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Publicar</span>
            <Switch checked={published} onChange={setPublished} />
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
          >
            Guardar
          </Button>
        </div>
      </div>

      {/* Metadata fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-lg border border-[#1e4a6e] bg-[#0a1929] p-4">
        <div className="lg:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">Título</label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título de la guía"
            size="large"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Slug</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug-de-la-guia"
            addonBefore="/guias/"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Categoría</label>
          <Select
            className="w-full"
            value={categoryId || undefined}
            onChange={setCategoryId}
            placeholder="Selecciona categoría"
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">Resumen</label>
          <Input.TextArea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Breve descripción de la guía..."
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Tags{" "}
            <span className="text-xs text-gray-500">(separados por coma)</span>
          </label>
          <Input
            value={tags.join(", ")}
            onChange={(e) =>
              setTags(
                e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Principiante, Comercio, Naves"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-300 mb-1">Icono (emoji)</label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📖"
              maxLength={4}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-300 mb-1">Tiempo de lectura</label>
            <Input
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              placeholder="5 min"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">Imagen de portada (URL)</label>
          <Input
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </div>
      </div>

      {/* Toolbar for images */}
      <div className="flex items-center gap-2">
        <Button
          icon={<PictureOutlined />}
          onClick={() => setImageModalOpen(true)}
        >
          Insertar imagen
        </Button>
        <span className="text-xs text-gray-500">
          Puedes subir directamente o pegar una URL
        </span>
      </div>

      {/* Markdown editor */}
      <div data-color-mode="dark">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val ?? "")}
          height={500}
          preview="live"
          visibleDragbar={false}
        />
      </div>

      {/* Image upload modal */}
      <Modal
        title="Insertar imagen"
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        footer={null}
      >
        <div className="space-y-4 pt-2">
          {/* Upload file */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              <PictureOutlined className="mr-1" />
              Subir desde tu dispositivo
            </label>
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={({ file }) => customUpload({ file: file as File })}
            >
              <Button loading={uploading} block>
                {uploading ? "Subiendo..." : "Seleccionar imagen"}
              </Button>
            </Upload>
          </div>

          <div className="text-center text-xs text-gray-500">— o —</div>

          {/* URL insert */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              <LinkOutlined className="mr-1" />
              Insertar por URL
            </label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                onPressEnter={handleUrlInsert}
              />
              <Button type="primary" onClick={handleUrlInsert}>
                Insertar
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
