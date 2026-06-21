"use client";

import { Tabs } from "antd";
import type { TabsProps } from "antd";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

/**
 * Panel de cuentas (Client Component) que agrupa el inicio de sesión y el
 * registro en pestañas. Es un Client Component porque `Tabs` de Ant Design es
 * interactivo; cada pestaña delega en su formulario correspondiente, que a su
 * vez gestiona su propia Server Action con `useActionState`.
 *
 * @param defaultTab Pestaña activa inicial: `"login"` o `"register"`.
 */
export default function AuthPanel({
  defaultTab = "login",
}: {
  defaultTab?: "login" | "register";
}) {
  const items: TabsProps["items"] = [
    {
      key: "login",
      label: "Iniciar sesión",
      children: <LoginForm />,
    },
    {
      key: "register",
      label: "Crear cuenta",
      children: <RegisterForm />,
    },
  ];

  return <Tabs defaultActiveKey={defaultTab} items={items} centered />;
}
