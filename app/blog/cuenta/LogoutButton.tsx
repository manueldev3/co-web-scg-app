"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase/config";
import { logoutUser } from "@/lib/blog/auth-actions";

/**
 * Control de cierre de sesión (Client Component).
 *
 * Invoca la Server Action `logoutUser`, que elimina la cookie de sesión y
 * restablece el estado a no autenticado (Req 3.6). Además se cierra la sesión
 * del SDK de cliente de Firebase (`signOut`) para limpiar el estado de auth que
 * `signInWithEmailAndPassword` haya podido persistir en el navegador.
 *
 * Tras cerrar sesión se llama a `router.refresh()` para que los Server
 * Components vuelvan a leer la (ahora ausente) cookie y muestren el estado no
 * autenticado.
 *
 * Plataforma (Next.js 16 modificado): la mutación se ejecuta dentro de
 * `startTransition` (la Server Action se invoca como event handler, según
 * `docs/01-app/01-getting-started/07-mutating-data.md`, «Event Handlers»).
 *
 * @see Requirements 3.6
 */
export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      // 1. El servidor elimina la cookie de sesión (Req 3.6).
      await logoutUser();
      // 2. Limpiamos el estado del SDK de cliente (no debe bloquear el cierre).
      try {
        await signOut(auth);
      } catch {
        // El cierre de sesión del servidor ya se completó; ignoramos el fallo
        // del SDK de cliente para no dejar al usuario en un estado ambiguo.
      }
      // 3. Re-render del árbol de servidor para reflejar el estado no autenticado.
      router.refresh();
    });
  };

  return (
    <Button
      type="default"
      size="large"
      icon={<LogoutOutlined />}
      loading={pending}
      onClick={handleLogout}
    >
      Cerrar sesión
    </Button>
  );
}
