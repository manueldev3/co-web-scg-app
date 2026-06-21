"use client";

// Gestión de Entradas y Categorías (Panel_Admin) — subcomponente de cliente.
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Documentación consultada en `node_modules/next/dist/docs/`:
//
// - `01-app/01-getting-started/05-server-and-client-components.md`: este es un
//   **Client Component** (`"use client"`) porque mantiene estado (modales,
//   selección de categorías) y maneja eventos. Recibe del Server Component
//   (`app/admin/entradas/page.tsx`) las entradas y categorías ya leídas en el
//   servidor como props serializables (`Post[]`, `Category[]`); NO importa el
//   Admin SDK ni lee Firestore.
//
// - `01-app/01-getting-started/07-mutating-data.md`: las mutaciones usan Server
//   Actions del módulo `"use server"` (`lib/blog/actions.ts`). Los formularios
//   de creación/edición de entrada y de creación de categoría se enlazan con
//   `useActionState` sobre un `<form action={formAction}>` nativo, que recoge un
//   `FormData` de los controles con `name`. Como Ant Design `Select` no emite un
//   control de formulario nativo, las categorías seleccionadas se envían con
//   `<input type="hidden" name="categoryIds">` repetidos (el contrato de
//   `createPost`/`updatePost` lee `formData.getAll("categoryIds")`). Cada acción
//   verifica el claim de administrador en el servidor e invalida la caché del
//   contenido público con `updateTag`; además, tras una mutación correcta el
//   cliente llama a `router.refresh()` para re-renderizar la página (la lista del
//   panel se lee fresca, sin caché) y reflejar el cambio sin recarga manual.
//
// Reparto de responsabilidades respecto a los requisitos:
//   - Req 10.1: tabla de entradas ordenada por fecha desc con título, estado,
//     fecha y categorías.
//   - Req 10.2, 10.9, 10.12: formulario de creación (estado `borrador`) con
//     validación de campos en español (`fieldError`/`error`).
//   - Req 10.3: formulario de edición que conserva el estado de publicación.
//   - Req 10.4: acción de publicar.
//   - Req 10.5: acción de eliminar (cascada en el servidor).
//   - Req 10.6, 10.7: creación de categoría con error «el nombre ya existe».
//   - Req 10.8: eliminación de categoría.
//   - Req 10.11: mensaje en español cuando no hay entradas.

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  createCategory,
  createPost,
  deleteCategory,
  deletePost,
  publishPost,
  updatePost,
} from "@/lib/blog/actions";
import {
  initialCategoryState,
  initialPostState,
} from "@/lib/blog/action-types";
import {
  CATEGORY_MAX,
  CATEGORY_NAME_MAX,
  CONTENT_MAX,
  TITLE_MAX,
} from "@/app/blog/blog-engine";
import type { Category, Post, PublicationStatus } from "@/app/blog/types";

const { Text, Title } = Typography;

/** Paleta del tema oscuro del panel (coincide con el resto de vistas admin). */
const CARD_BG = "bg-[#0F2C3E]";

/** Etiqueta y color de cada estado de publicación (Req 10.1). */
const STATUS_META: Record<PublicationStatus, { label: string; color: string }> =
  {
    publicada: { label: "Publicada", color: "green" },
    borrador: { label: "Borrador", color: "gold" },
  };

/** Fecha representativa de una entrada para mostrar/ordenar (Req 10.1). */
function entryDate(post: Post): number {
  return post.publishedAt ?? post.updatedAt ?? post.createdAt;
}

/** Formatea una fecha (epoch ms) en español; «—» si no consta. */
function formatDate(value: number): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// ---------------------------------------------------------------------------
// Modal de creación / edición de entrada (Req 10.2, 10.3, 10.9, 10.12)
// ---------------------------------------------------------------------------

/** Modo del modal de entrada. */
type PostFormMode = "create" | "edit";

/** Props del modal de formulario de entrada. */
interface PostFormModalProps {
  mode: PostFormMode;
  /** Entrada a editar (solo en modo `edit`). */
  post: Post | null;
  /** Categorías disponibles para asociar. */
  categories: Category[];
  /** Se invoca al cerrar el modal (cancelar o tras guardar correctamente). */
  onClose: () => void;
}

/**
 * Formulario de creación/edición de una entrada enlazado con `useActionState`.
 *
 * Se monta SOLO mientras el modal está abierto, de modo que cada apertura parte
 * de un estado de acción limpio. En modo `create` invoca `createPost` (la
 * entrada se guarda como `borrador`, Req 10.2); en modo `edit` invoca
 * `updatePost` conservando el estado de publicación (Req 10.3). La validación
 * del servidor devuelve `fieldError` (`titulo`/`contenido`/`categorias`) y un
 * mensaje en español en `error`, que se reflejan en el campo correspondiente y
 * en un aviso (Req 10.9, 10.12).
 */
function PostFormModal({
  mode,
  post,
  categories,
  onClose,
}: PostFormModalProps) {
  const { message } = App.useApp();
  const router = useRouter();

  const action = mode === "create" ? createPost : updatePost;
  const [state, formAction, pending] = useActionState(action, initialPostState);

  // Categorías seleccionadas (controladas): Ant Design `Select` no emite un
  // control de formulario nativo, así que se envían como inputs ocultos.
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    post?.categoryIds ?? [],
  );

  // Tras guardar correctamente: avisar, refrescar la página (lista no cacheada)
  // y cerrar el modal (Req 10.2-10.3).
  useEffect(() => {
    if (state.ok) {
      message.success(
        mode === "create" ? "Entrada creada." : "Cambios guardados.",
      );
      router.refresh();
      onClose();
    }
  }, [state.ok, mode, message, router, onClose]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const titleStatus = state.fieldError === "titulo" ? "error" : undefined;
  const contentStatus = state.fieldError === "contenido" ? "error" : undefined;
  const categoriesStatus =
    state.fieldError === "categorias" ? "error" : undefined;

  return (
    <Modal
      open
      title={mode === "create" ? "Nueva entrada" : "Editar entrada"}
      onCancel={onClose}
      footer={null}
      maskClosable={!pending}
      destroyOnHidden
    >
      <form action={formAction} className="flex flex-col gap-4 pt-2">
        {/* Identificador de la entrada en edición (contrato de `updatePost`). */}
        {mode === "edit" && post && (
          <input type="hidden" name="postId" value={post.id} />
        )}

        {/* Categorías seleccionadas como campo repetido `categoryIds`. */}
        {selectedCategoryIds.map((id) => (
          <input key={id} type="hidden" name="categoryIds" value={id} />
        ))}

        {!state.ok && state.error && (
          <Alert type="error" showIcon role="alert" message={state.error} />
        )}

        <label className="flex flex-col gap-1">
          <Text className="text-white">Título</Text>
          <Input
            name="title"
            size="large"
            defaultValue={post?.title ?? ""}
            maxLength={TITLE_MAX}
            showCount
            status={titleStatus}
            placeholder="Título de la entrada"
            aria-label="Título de la entrada"
          />
        </label>

        <label className="flex flex-col gap-1">
          <Text className="text-white">Contenido</Text>
          <Input.TextArea
            name="content"
            defaultValue={post?.content ?? ""}
            maxLength={CONTENT_MAX}
            showCount
            autoSize={{ minRows: 6, maxRows: 16 }}
            status={contentStatus}
            placeholder="Contenido de la entrada"
            aria-label="Contenido de la entrada"
          />
        </label>

        <label className="flex flex-col gap-1">
          <Text className="text-white">Categorías (de 1 a {CATEGORY_MAX})</Text>
          <Select
            mode="multiple"
            value={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            options={categoryOptions}
            maxCount={CATEGORY_MAX}
            status={categoriesStatus}
            placeholder="Selecciona al menos una categoría"
            aria-label="Categorías de la entrada"
            notFoundContent="No hay categorías. Crea una primero."
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={pending}>
            {mode === "create" ? "Crear borrador" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Acciones por fila: publicar (Req 10.4) y eliminar (Req 10.5)
// ---------------------------------------------------------------------------

/**
 * Botón para publicar una entrada en estado `borrador`. Invoca `publishPost`
 * (establece `publicada` + fecha actual) dentro de una transición y refresca la
 * lista al completarse.
 */
function PublishButton({ post }: { post: Post }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", post.id);
      const result = await publishPost(initialPostState, formData);
      if (!result.ok) {
        message.error(result.error ?? "No se pudo publicar la entrada.");
        return;
      }
      message.success("Entrada publicada.");
      router.refresh();
    });
  }

  return (
    <Popconfirm
      title="Publicar entrada"
      description={`¿Publicar «${post.title}»? Será visible para el público.`}
      okText="Publicar"
      cancelText="Cancelar"
      okButtonProps={{ loading: pending }}
      onConfirm={handleConfirm}
    >
      <Button
        icon={<CloudUploadOutlined />}
        loading={pending}
        aria-label={`Publicar ${post.title}`}
      >
        Publicar
      </Button>
    </Popconfirm>
  );
}

/**
 * Botón para eliminar una entrada con confirmación previa (`Popconfirm`).
 * Invoca `deletePost`, que borra la entrada y, en cascada, sus comentarios y
 * «me gusta» en el servidor, y refresca la lista al completarse.
 */
function DeletePostButton({ post }: { post: Post }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", post.id);
      const result = await deletePost(initialPostState, formData);
      if (!result.ok) {
        message.error(result.error ?? "No se pudo eliminar la entrada.");
        return;
      }
      message.success("Entrada eliminada.");
      router.refresh();
    });
  }

  return (
    <Popconfirm
      title="Eliminar entrada"
      description={`¿Eliminar «${post.title}»? Se borrarán también sus comentarios y «me gusta». Esta acción no se puede deshacer.`}
      okText="Eliminar"
      cancelText="Cancelar"
      okButtonProps={{ danger: true, loading: pending }}
      onConfirm={handleConfirm}
    >
      <Button
        danger
        icon={<DeleteOutlined />}
        loading={pending}
        aria-label={`Eliminar ${post.title}`}
      >
        Eliminar
      </Button>
    </Popconfirm>
  );
}

// ---------------------------------------------------------------------------
// Gestión de categorías (Req 10.6, 10.7, 10.8)
// ---------------------------------------------------------------------------

/**
 * Tarjeta de gestión de categorías: formulario de creación (`useActionState`
 * sobre `createCategory`, que rechaza nombres duplicados con «El nombre ya
 * existe.», Req 10.7) y lista de categorías existentes con eliminación
 * (`deleteCategory`, que las desasocia de las entradas, Req 10.8).
 */
function CategoryManager({ categories }: { categories: Category[] }) {
  const { message } = App.useApp();
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    createCategory,
    initialCategoryState,
  );

  // Clave para remontar el formulario y limpiar el campo tras crear una categoría.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state.ok) {
      message.success("Categoría creada.");
      router.refresh();
      setFormKey((k) => k + 1);
    }
  }, [state.ok, message, router]);

  return (
    <Card
      variant="borderless"
      className={`${CARD_BG} shadow-xl`}
      title={<span className="text-[#9ED0FA]">Categorías</span>}
    >
      <form
        key={formKey}
        action={formAction}
        className="mb-4 flex flex-col gap-2"
      >
        {!state.ok && state.error && (
          <Alert type="error" showIcon role="alert" message={state.error} />
        )}
        <Space.Compact className="w-full">
          <Input
            name="name"
            maxLength={CATEGORY_NAME_MAX}
            status={!state.ok && state.error ? "error" : undefined}
            placeholder="Nombre de la categoría"
            aria-label="Nombre de la nueva categoría"
          />
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlusOutlined />}
            loading={pending}
          >
            Añadir
          </Button>
        </Space.Compact>
      </form>

      {categories.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Aún no hay categorías."
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <DeletableCategoryTag key={category.id} category={category} />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Etiqueta de categoría con confirmación de eliminación. Invoca `deleteCategory`
 * dentro de una transición y refresca la página al completarse (Req 10.8).
 */
function DeletableCategoryTag({ category }: { category: Category }) {
  const { message } = App.useApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("categoryId", category.id);
      const result = await deleteCategory(initialCategoryState, formData);
      if (!result.ok) {
        message.error(result.error ?? "No se pudo eliminar la categoría.");
        return;
      }
      message.success("Categoría eliminada.");
      router.refresh();
    });
  }

  return (
    <Popconfirm
      title="Eliminar categoría"
      description={`¿Eliminar «${category.name}»? Se desasociará de las entradas que la usan.`}
      okText="Eliminar"
      cancelText="Cancelar"
      okButtonProps={{ danger: true, loading: pending }}
      onConfirm={handleConfirm}
    >
      <Tag
        color="blue"
        className="cursor-pointer px-3 py-1 text-sm"
        aria-label={`Eliminar categoría ${category.name}`}
      >
        {category.name} {pending ? "…" : "×"}
      </Tag>
    </Popconfirm>
  );
}

// ---------------------------------------------------------------------------
// Tabla principal de entradas
// ---------------------------------------------------------------------------

/** Estado del modal de entrada (cerrado o abierto en modo crear/editar). */
type ModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; post: Post };

/** Props de {@link EntradasManagerClient}. */
export interface EntradasManagerClientProps {
  /** Entradas (incluidos borradores) leídas en el servidor, ya ordenadas. */
  posts: Post[];
  /** Categorías leídas en el servidor. */
  categories: Category[];
}

/**
 * Contenido de la gestión de entradas: cabecera con acción de crear, tabla de
 * entradas y tarjeta de categorías. Se separa del componente exportado para
 * poder envolverlo en el contexto `App` de Ant Design (necesario para
 * `message`).
 */
function EntradasManager({ posts, categories }: EntradasManagerClientProps) {
  const [modal, setModal] = useState<ModalState>({ open: false });

  // Índice id → nombre de categoría para mostrar las etiquetas de cada entrada.
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) map.set(category.id, category.name);
    return map;
  }, [categories]);

  function closeModal() {
    setModal({ open: false });
  }

  const columns: TableColumnsType<Post> = [
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
      render: (title: string) => <Text className="text-white">{title}</Text>,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status: PublicationStatus) => {
        const meta = STATUS_META[status];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Fecha",
      key: "date",
      render: (_: unknown, post: Post) => (
        <Text type="secondary">{formatDate(entryDate(post))}</Text>
      ),
    },
    {
      title: "Categorías",
      key: "categories",
      render: (_: unknown, post: Post) => {
        if (post.categoryIds.length === 0) {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Space size={[0, 4]} wrap>
            {post.categoryIds.map((id) => (
              <Tag key={id} color="blue">
                {categoryNameById.get(id) ?? id}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      align: "right",
      render: (_: unknown, post: Post) => (
        <Space wrap>
          <Button
            icon={<EditOutlined />}
            onClick={() => setModal({ open: true, mode: "edit", post })}
            aria-label={`Editar ${post.title}`}
          >
            Editar
          </Button>
          {post.status === "borrador" && <PublishButton post={post} />}
          <DeletePostButton post={post} />
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card variant="borderless" className={`${CARD_BG} shadow-xl`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <Title level={4} className="mb-0! text-white">
            Entradas
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, mode: "create" })}
          >
            Nueva entrada
          </Button>
        </div>

        <Table<Post>
          rowKey="id"
          columns={columns}
          dataSource={posts}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          locale={{
            // Req 10.11: mensaje en español cuando no hay entradas.
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay entradas. Crea la primera con «Nueva entrada»."
              />
            ),
          }}
        />
      </Card>

      <CategoryManager categories={categories} />

      {modal.open && (
        <PostFormModal
          key={modal.mode === "edit" ? `edit-${modal.post.id}` : "create"}
          mode={modal.mode}
          post={modal.mode === "edit" ? modal.post : null}
          categories={categories}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

/**
 * Componente exportado: envuelve la gestión de entradas en el contexto `App` de
 * Ant Design para disponer de `message` (avisos de éxito/error) con el tema
 * activo, sin depender de la API estática.
 */
export default function EntradasManagerClient({
  posts,
  categories,
}: EntradasManagerClientProps) {
  return (
    <App>
      <EntradasManager posts={posts} categories={categories} />
    </App>
  );
}
