"use client";

// Formulario de inicio de sesión de Administrador (`/admin/login`).
//
// Plataforma (Next.js 16 modificado) — docs consultadas en node_modules:
// - docs/01-app/01-getting-started/07-mutating-data.md: las Server Actions se
//   invocan desde Client Components importándolas de un módulo `"use server"`.
//   `adminLogin` redirige a `/admin` en caso de éxito (la redirección se propaga
//   al router del cliente); solo retorna cuando deniega el acceso.
// - docs/01-app/02-guides/authentication.md: la captura de credenciales se hace
//   en un Client Component; la verificación de credenciales y la emisión de la
//   cookie de sesión ocurren en el servidor.
//
// Este es un formulario de cliente simple (email + contraseña) que se renderiza
// de inmediato, muy por debajo del límite de 3 s (Req 6.1). El layout de
// `/admin` (`app/admin/layout.tsx`) exime esta ruta del guard de sesión para
// que sea accesible a visitantes no autenticados.
//
// Flujo (Req 6.2, 6.3, 6.4):
//   1. El usuario envía email + contraseña.
//   2. El SDK de cliente (`signInWithEmailAndPassword`) valida las credenciales
//      y, si son correctas, devuelve un ID token (que incluye los custom claims).
//   3. El ID token se envía a la Server Action `adminLogin`, que exige el claim
//      `admin === true` antes de conceder acceso y emitir la cookie de sesión.
//   - Credenciales inválidas (el SDK lanza) → mensaje «credenciales incorrectas».
//   - Credenciales válidas sin claim admin → mensaje «acceso no autorizado»
//     devuelto por `adminLogin`, sin conceder acceso.

import { useState, useTransition } from "react";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import { adminLogin } from "@/lib/blog/auth-actions";
import { initialAdminLoginState } from "@/lib/blog/auth-action-types";

const { Title, Paragraph } = Typography;

/** Mensaje de credenciales incorrectas en el cliente (coincide con Req 6.3). */
const CREDENCIALES_INCORRECTAS = "Las credenciales son incorrectas";

/** Valores del formulario de inicio de sesión de administrador. */
interface AdminLoginFormValues {
  email: string;
  password: string;
}

/**
 * Página de inicio de sesión del Panel_Admin. Renderiza un formulario oscuro en
 * español (Ant Design v6 + Tailwind v4) y orquesta el flujo de autenticación de
 * dos pasos (SDK de cliente → Server Action).
 */
export default function AdminLoginPage() {
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFinish(values: AdminLoginFormValues) {
    setErrorMsg(null);

    startTransition(async () => {
      // Paso 1: validar credenciales con el SDK de cliente y obtener el ID token.
      let idToken = "";
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          values.email.trim(),
          values.password,
        );
        idToken = await credential.user.getIdToken();
      } catch {
        // El SDK lanza cuando el correo o la contraseña no son correctos (Req 6.3).
        setErrorMsg(CREDENCIALES_INCORRECTAS);
        return;
      }

      // Paso 2: la Server Action verifica el claim admin, emite la cookie y
      // redirige a `/admin` si procede (Req 6.2). Solo retorna si deniega acceso.
      const formData = new FormData();
      formData.set("idToken", idToken);
      const result = await adminLogin(initialAdminLoginState, formData);

      if (result && !result.ok) {
        // Credenciales válidas pero sin claim admin (Req 6.4) u otro fallo.
        setErrorMsg(result.error ?? CREDENCIALES_INCORRECTAS);
      }
    });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card
        variant="borderless"
        className="w-full max-w-md bg-[#0F2C3E] shadow-xl"
      >
        <div className="mb-6 text-center">
          <Title level={3} className="mb-1!">
            Panel de administración
          </Title>
          <Paragraph type="secondary" className="mb-0!">
            Inicia sesión para acceder al panel.
          </Paragraph>
        </div>

        {errorMsg && (
          <Alert
            type="error"
            showIcon
            message={errorMsg}
            className="mb-4"
            role="alert"
          />
        )}

        <Form<AdminLoginFormValues>
          layout="vertical"
          requiredMark={false}
          onFinish={handleFinish}
          disabled={pending}
        >
          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[
              {
                required: true,
                message: "Introduce tu correo electrónico",
              },
              {
                type: "email",
                message: "El correo electrónico no tiene un formato válido",
              },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              type="email"
            />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[{ required: true, message: "Introduce tu contraseña" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Contraseña"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className="mb-0!">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={pending}
            >
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
