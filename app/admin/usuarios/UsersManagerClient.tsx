"use client";

// Gestión de usuarios (Panel_Admin) — subcomponente de cliente.
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Documentación consultada en `node_modules/next/dist/docs/`:
//
// - `01-app/01-getting-started/05-server-and-client-components.md`: este es un
//   **Client Component** (`"use client"`) porque mantiene estado (término de
//   búsqueda, rol optimista) y maneja eventos. Recibe del Server Component
//   (`app/admin/usuarios/page.tsx`) la lista ya leída en el servidor como prop
//   serializable (`BlogUser[]`); NO importa el Admin SDK ni lee Firestore.
//
// - `01-app/01-getting-started/07-mutating-data.md`: las Server Actions
//   `deleteUser` / `updateUserRole` se importan del módulo `"use server"`
//   (`lib/blog/actions.ts`) y se invocan desde manejadores de eventos dentro de
//   `useTransition`. Cada acción verifica el claim de administrador en el
//   servidor y, tras mutar, llama a `refresh()` para re-renderizar la página y
//   actualizar la lista (la lectura de usuarios no está cacheada).
//
// Reparto de responsabilidades respecto a los requisitos:
//   - Req 9.1: tabla con correo, rol y fecha de registro.
//   - Req 9.2: mensaje en español cuando no hay usuarios.
//   - Req 9.3: botón con confirmación (`Popconfirm`) que invoca `deleteUser`.
//   - Req 9.4: selector de rol (`Select`) que invoca `updateUserRole`.
//   - Req 9.5: búsqueda por correo insensible a may/min con `searchUsersByEmail`.

import { useMemo, useState, useTransition } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";

import { searchUsersByEmail } from "@/app/blog/blog-engine";
import { deleteUser, updateUserRole } from "@/lib/blog/actions";
import { initialUserState } from "@/lib/blog/action-types";
import type { BlogUser, UserRole } from "@/app/blog/types";

const { Text } = Typography;

/** Paleta del tema oscuro del panel (coincide con el resto de vistas admin). */
const CARD_BG = "bg-[#0F2C3E]";

/** Opciones de rol permitidas (Req 9.4). */
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "suscriptor", label: "Suscriptor" },
  { value: "admin", label: "Administrador" },
];

/** Formatea una fecha de registro (epoch ms) en español; «—» si no consta. */
function formatDate(createdAt: number): string {
  if (!createdAt) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

// ---------------------------------------------------------------------------
// Selector de rol por fila (Req 9.4)
// ---------------------------------------------------------------------------

/**
 * Selector de rol de un usuario. Aplica el cambio de forma optimista y lo
 * confirma con la Server Action `updateUserRole`; si falla, revierte al rol
 * previo y muestra el error en español.
 */
function RoleSelect({ user }: { user: BlogUser }) {
  const { message } = App.useApp();
  const [role, setRole] = useState<UserRole>(user.role);
  const [pending, startTransition] = useTransition();

  function handleChange(next: UserRole) {
    if (next === role) return;
    const previous = role;
    setRole(next); // actualización optimista

    startTransition(async () => {
      const formData = new FormData();
      formData.set("uid", user.uid);
      formData.set("role", next);
      const result = await updateUserRole(initialUserState, formData);

      if (!result.ok) {
        setRole(previous); // rollback ante error
        message.error(result.error ?? "No se pudo cambiar el rol.");
        return;
      }
      message.success("Rol actualizado.");
    });
  }

  return (
    <Select<UserRole>
      value={role}
      onChange={handleChange}
      loading={pending}
      disabled={pending}
      options={ROLE_OPTIONS}
      style={{ minWidth: 150 }}
      aria-label={`Rol de ${user.email}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Acción de eliminación por fila (Req 9.3)
// ---------------------------------------------------------------------------

/**
 * Botón de eliminación de un usuario con confirmación previa (`Popconfirm`).
 * Invoca la Server Action `deleteUser`, que borra el registro de Firestore y la
 * cuenta de Firebase Authentication, y refresca la lista al completarse.
 */
function DeleteUserButton({ user }: { user: BlogUser }) {
  const { message } = App.useApp();
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("uid", user.uid);
      const result = await deleteUser(initialUserState, formData);

      if (!result.ok) {
        message.error(result.error ?? "No se pudo eliminar el usuario.");
        return;
      }
      message.success("Usuario eliminado.");
    });
  }

  return (
    <Popconfirm
      title="Eliminar usuario"
      description={`¿Seguro que quieres eliminar a ${user.email}? Esta acción no se puede deshacer.`}
      okText="Eliminar"
      cancelText="Cancelar"
      okButtonProps={{ danger: true, loading: pending }}
      onConfirm={handleConfirm}
    >
      <Button
        danger
        icon={<DeleteOutlined />}
        loading={pending}
        aria-label={`Eliminar a ${user.email}`}
      >
        Eliminar
      </Button>
    </Popconfirm>
  );
}

// ---------------------------------------------------------------------------
// Tabla principal
// ---------------------------------------------------------------------------

/** Props de {@link UsersManagerClient}. */
export interface UsersManagerClientProps {
  /** Lista de usuarios leída en el servidor (Server Component padre). */
  users: BlogUser[];
}

/**
 * Contenido de la gestión de usuarios: buscador + tabla con controles de rol y
 * eliminación. Se separa del componente exportado para poder envolverlo en el
 * contexto `App` de Ant Design (necesario para `message`).
 */
function UsersManager({ users }: UsersManagerClientProps) {
  const [term, setTerm] = useState("");

  // Búsqueda por correo insensible a may/min (Req 9.5).
  const filteredUsers = useMemo(
    () => searchUsersByEmail(users, term.trim()),
    [users, term],
  );

  const columns: TableColumnsType<BlogUser> = [
    {
      title: "Correo electrónico",
      dataIndex: "email",
      key: "email",
      render: (email: string) => <Text className="text-white">{email}</Text>,
    },
    {
      title: "Rol",
      key: "role",
      render: (_: unknown, user: BlogUser) => <RoleSelect user={user} />,
    },
    {
      title: "Fecha de registro",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: number) => (
        <Text type="secondary">{formatDate(createdAt)}</Text>
      ),
    },
    {
      title: "Acciones",
      key: "actions",
      align: "right",
      render: (_: unknown, user: BlogUser) => <DeleteUserButton user={user} />,
    },
  ];

  return (
    <Card variant="borderless" className={`${CARD_BG} shadow-xl`}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Input
          allowClear
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          prefix={<SearchOutlined />}
          placeholder="Buscar por correo electrónico"
          aria-label="Buscar usuarios por correo electrónico"
          className="max-w-sm"
        />
        <Tag color="blue" aria-hidden>
          {filteredUsers.length}{" "}
          {filteredUsers.length === 1 ? "usuario" : "usuarios"}
        </Tag>
      </div>

      <Table<BlogUser>
        rowKey="uid"
        columns={columns}
        dataSource={filteredUsers}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        locale={{
          // Req 9.2: mensaje en español cuando no hay usuarios; también se usa
          // cuando la búsqueda no produce coincidencias.
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                users.length === 0
                  ? "No hay usuarios registrados."
                  : "No se encontraron usuarios con ese correo electrónico."
              }
            />
          ),
        }}
      />
    </Card>
  );
}

/**
 * Componente exportado: envuelve la gestión de usuarios en el contexto `App` de
 * Ant Design para disponer de `message` (avisos de éxito/error) con el tema
 * activo, sin depender de la API estática.
 */
export default function UsersManagerClient({ users }: UsersManagerClientProps) {
  return (
    <App>
      <UsersManager users={users} />
    </App>
  );
}
