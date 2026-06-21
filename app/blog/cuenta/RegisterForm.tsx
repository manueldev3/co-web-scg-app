"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Typography } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

import { registerUser } from "@/lib/blog/auth-actions";
import { initialRegisterState } from "@/lib/blog/auth-action-types";

const { Text } = Typography;

/**
 * Formulario de registro de Usuario_Registrado (Client Component).
 *
 * Plataforma (Next.js 16 modificado) — docs consultadas en
 * `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
 * («Showing a pending state») y `02-guides/authentication.md` («Sign-up and
 * login functionality»): se captura el formulario con un `<form action={…}>`
 * que invoca una Server Action, y se usa `useActionState` para validar en el
 * servidor y recibir los errores como VALORES de estado (no excepciones).
 *
 * Contrato con `registerUser` (ver `lib/blog/auth-actions.ts`): la acción lee
 * los campos `email` y `password` del `FormData`. Devuelve un
 * `RegisterActionState` con:
 *  - `errors.email` / `errors.password`: errores de validación por campo en
 *    español (Req 3.5).
 *  - `error`: mensaje general en español (correo en uso, fallo de Firebase)
 *    (Req 3.4, 3.9).
 *  - `ok === true`: la cuenta se creó y la cookie de sesión quedó establecida.
 *
 * Persistencia de sesión (Req 3.7): la propia Server Action establece la cookie
 * de sesión `HttpOnly`; tras `ok` se llama a `router.refresh()` para que los
 * Server Components vuelvan a leer la cookie y reflejen el estado autenticado,
 * que se conserva entre recargas gracias a esa cookie.
 *
 * @see Requirements 3.1, 3.5, 3.4, 3.9, 3.7
 */
export default function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialRegisterState,
  );

  // Al crearse la cuenta y establecerse la sesión, refrescamos para que el
  // árbol de servidor refleje el estado autenticado (Req 3.2, 3.7).
  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="register-email"
          className="text-sm font-medium text-[#9ED0FA]"
        >
          Correo electrónico
        </label>
        <Input
          id="register-email"
          name="email"
          type="email"
          size="large"
          autoComplete="email"
          prefix={<MailOutlined className="text-[#4a6a80]" />}
          placeholder="tucorreo@ejemplo.com"
          status={state.errors?.email ? "error" : undefined}
          aria-invalid={state.errors?.email ? true : undefined}
        />
        {state.errors?.email && (
          <Text type="danger" className="text-sm">
            {state.errors.email}
          </Text>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="register-password"
          className="text-sm font-medium text-[#9ED0FA]"
        >
          Contraseña
        </label>
        <Input.Password
          id="register-password"
          name="password"
          size="large"
          autoComplete="new-password"
          prefix={<LockOutlined className="text-[#4a6a80]" />}
          placeholder="Al menos 8 caracteres"
          status={state.errors?.password ? "error" : undefined}
          aria-invalid={state.errors?.password ? true : undefined}
        />
        {state.errors?.password && (
          <Text type="danger" className="text-sm">
            {state.errors.password}
          </Text>
        )}
      </div>

      {/* Error general (correo ya en uso, fallo de comunicación) — Req 3.4, 3.9 */}
      {state.error && (
        <Alert
          type="error"
          showIcon
          message={state.error}
          className="border-none"
        />
      )}

      <Button
        type="primary"
        htmlType="submit"
        size="large"
        loading={pending}
        block
      >
        Crear cuenta
      </Button>
    </form>
  );
}
