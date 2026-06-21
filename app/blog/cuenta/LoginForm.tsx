"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Input, Typography } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import { loginUser } from "@/lib/blog/auth-actions";
import {
  initialLoginState,
  type LoginActionState,
} from "@/lib/blog/auth-action-types";

const { Text } = Typography;

/**
 * Mensaje GENÉRICO de credenciales inválidas (Req 3.3): no revela si falló el
 * correo o la contraseña. Se usa cuando el SDK de cliente rechaza el inicio de
 * sesión (`signInWithEmailAndPassword`), antes incluso de llamar al servidor.
 * Coincide con el mensaje que devuelve la Server Action `loginUser`.
 */
const GENERIC_LOGIN_ERROR =
  "El correo electrónico o la contraseña no son correctos";

/**
 * Acción de cliente para `useActionState` que orquesta el inicio de sesión en
 * dos pasos, según el contrato de `lib/blog/auth-actions.ts`:
 *
 *  1. El SDK de cliente de Firebase (`signInWithEmailAndPassword`) comprueba las
 *     credenciales y, si son válidas, entrega un ID token. Así el servidor nunca
 *     ve la contraseña (Req 3.2). Si el SDK rechaza (credenciales incorrectas o
 *     fallo de red), devolvemos el mensaje genérico en español sin distinguir el
 *     campo y conservando el estado no autenticado (Req 3.3, 3.9).
 *  2. El ID token se entrega a la Server Action `loginUser`, que lo verifica y
 *     emite la cookie de sesión `HttpOnly`.
 *
 * `loginUser` espera el ID token en el campo `idToken` del `FormData`.
 */
async function loginWithCredentials(
  prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let idToken: string;
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    idToken = await credential.user.getIdToken();
  } catch {
    // Credenciales incorrectas o fallo del SDK de cliente (Req 3.3, 3.9): no se
    // revela el campo que falló y se mantiene el estado no autenticado.
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  // Paso 2: el servidor verifica el ID token y emite la cookie de sesión.
  const serverFormData = new FormData();
  serverFormData.set("idToken", idToken);
  return loginUser(prevState, serverFormData);
}

/**
 * Formulario de inicio de sesión de Usuario_Registrado (Client Component).
 *
 * Plataforma (Next.js 16 modificado): `useActionState`
 * (`docs/01-app/01-getting-started/07-mutating-data.md`, «Showing a pending
 * state») gestiona el estado de la acción y la bandera `pending`. La acción es
 * de cliente porque debe llamar primero al SDK de cliente de Firebase para
 * obtener el ID token antes de invocar la Server Action `loginUser`.
 *
 * Tras un inicio de sesión correcto se llama a `router.refresh()`: la cookie de
 * sesión establecida por el servidor persiste el estado autenticado entre
 * recargas (Req 3.7) y el refresco re-renderiza los Server Components para
 * reflejarlo.
 *
 * @see Requirements 3.2, 3.3, 3.7, 3.9
 */
export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    loginWithCredentials,
    initialLoginState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="login-email"
          className="text-sm font-medium text-[#9ED0FA]"
        >
          Correo electrónico
        </label>
        <Input
          id="login-email"
          name="email"
          type="email"
          size="large"
          autoComplete="email"
          prefix={<MailOutlined className="text-[#4a6a80]" />}
          placeholder="tucorreo@ejemplo.com"
          status={state.error ? "error" : undefined}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-[#9ED0FA]"
        >
          Contraseña
        </label>
        <Input.Password
          id="login-password"
          name="password"
          size="large"
          autoComplete="current-password"
          prefix={<LockOutlined className="text-[#4a6a80]" />}
          placeholder="Tu contraseña"
          status={state.error ? "error" : undefined}
        />
      </div>

      {/* Mensaje genérico de credenciales / fallo de comunicación — Req 3.3, 3.9 */}
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
        Iniciar sesión
      </Button>
    </form>
  );
}
