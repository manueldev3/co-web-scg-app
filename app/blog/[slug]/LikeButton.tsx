"use client";

// Control de «me gusta» de una Entrada del Blog (Client Component, tiempo real).
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Antes de implementar este componente se consultó la documentación incluida en
// `node_modules/next/dist/docs/`. Hallazgos aplicados aquí:
//
// 1. Componente de cliente: lleva la directiva `"use client"` porque usa estado,
//    efectos y los SDK de navegador de Firebase
//    (`01-app/01-getting-started/05-server-and-client-components.md`). El SDK de
//    cliente (`firebase/auth`, `firebase/firestore`, ver `lib/firebase/config.ts`)
//    solo puede ejecutarse en el navegador; por eso toda la lógica de
//    suscripción vive dentro de `useEffect` (no se ejecuta en el render del
//    servidor).
// 2. Mutación mediante Server Action: el alta/baja del «me gusta» se realiza con
//    `toggleLikeAction` (`lib/blog/actions.ts`), una función `"use server"`
//    invocada directamente (no como `<form action>`), siguiendo el patrón de
//    «Server Functions» de `01-app/01-getting-started/07-mutating-data.md`. La
//    acción es la frontera autoritativa (verifica sesión y escribe de forma
//    transaccional); este componente solo refleja el resultado.
//
// --- Modelo de tiempo real (design.md «Modelo de tiempo real», Req 5.9) ---
// El componente se suscribe con `onSnapshot` a dos fuentes de Firestore:
//   - `posts/{postId}`: para reflejar `likeCount` en tiempo real (≤ 3 s) sin
//     recargar la página (Req 5.1, 5.9).
//   - `posts/{postId}/likes/{uid}`: para conocer si el usuario actual ya dio
//     «me gusta» (existencia del documento ⇒ estado activado, Req 5.2, 5.3).
// El estado de autenticación se observa con `onAuthStateChanged` (Req 5.7).
//
// --- Actualización optimista con rollback (Req 5.8) ---
// Al pulsar, el control cambia de estado y el contador se ajusta de inmediato
// (respuesta instantánea); a continuación se invoca `toggleLikeAction`. Si la
// operación falla (`result.ok === false`), se restauran el estado y el contador
// previos y se muestra un mensaje de error en español. Si tiene éxito, las
// suscripciones `onSnapshot` reconcilian el estado con la verdad del servidor.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Button, Tooltip } from "antd";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, firestore } from "@/lib/firebase/config";
import { toggleLikeAction } from "@/lib/blog/actions";

/**
 * Props de {@link LikeButton}.
 *
 * Contrato para la página de detalle (tarea 8.2, `app/blog/[slug]/page.tsx`),
 * que monta este control pasando los datos ya disponibles en el servidor:
 *
 * - `postId`: identificador del documento de la entrada (`post.id`). Es la clave
 *   con la que se suscribe a `posts/{postId}` y `posts/{postId}/likes/{uid}` y
 *   el argumento de `toggleLikeAction(postId)`.
 * - `initialLikeCount`: valor inicial del contador (`post.likeCount`), usado
 *   para el primer render antes de que llegue la primera instantánea en tiempo
 *   real. Se normaliza a un entero >= 0 (Req 5.1).
 * - `loginHref` (opcional): ruta a la que se invita a iniciar sesión a los
 *   visitantes no autenticados (Req 5.7). Por defecto `/blog/cuenta`, donde vive
 *   la UI pública de cuentas (tarea 6.3). La página de detalle puede
 *   sobreescribirla si la ruta cambia.
 */
export interface LikeButtonProps {
  /** Identificador del documento de la entrada (`post.id`). */
  postId: string;
  /** Contador inicial de «me gusta» (`post.likeCount`); se normaliza a entero >= 0. */
  initialLikeCount: number;
  /** Ruta de la invitación a iniciar sesión (por defecto `/blog/cuenta`). */
  loginHref?: string;
}

/** Normaliza un contador a un entero mayor o igual que 0 (Req 5.1). */
function toNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return 0;
}

/** Ruta por defecto de la UI pública de cuentas (registro / inicio de sesión). */
const DEFAULT_LOGIN_HREF = "/blog/cuenta";

export default function LikeButton({
  postId,
  initialLikeCount,
  loginHref = DEFAULT_LOGIN_HREF,
}: LikeButtonProps) {
  // Estado de autenticación: `undefined` mientras se resuelve, `null` si no hay
  // sesión, o el usuario de Firebase autenticado (Req 5.7).
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Contador de «me gusta» en tiempo real (Req 5.1, 5.9) y estado del control
  // (activado/desactivado) según el «me gusta» del usuario actual (Req 5.2, 5.3).
  const [count, setCount] = useState<number>(() =>
    toNonNegativeInt(initialLikeCount),
  );
  const [liked, setLiked] = useState<boolean>(false);

  // `pending` evita pulsaciones concurrentes mientras la acción está en curso.
  const [pending, setPending] = useState<boolean>(false);
  // Mensaje de error en español ante un fallo de la operación (Req 5.8).
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Evita actualizar el estado tras desmontar el componente.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 1) Suscripción al estado de autenticación (Req 5.7).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (mountedRef.current) {
        setUser(nextUser);
      }
    });
    return unsubscribe;
  }, []);

  // 2) Suscripción en tiempo real al `likeCount` del documento de la entrada
  //    (Req 5.1, 5.9): refleja los cambios en ≤ 3 s sin recargar la página.
  useEffect(() => {
    if (!postId) {
      return;
    }
    const postRef = doc(firestore, "posts", postId);
    const unsubscribe = onSnapshot(
      postRef,
      (snapshot) => {
        if (!mountedRef.current) {
          return;
        }
        const data = snapshot.data();
        if (data && "likeCount" in data) {
          setCount(toNonNegativeInt(data.likeCount));
        }
      },
      () => {
        // Un fallo de la suscripción no debe romper la UI: se conserva el último
        // contador conocido. El reintento lo gestiona el propio SDK.
      },
    );
    return unsubscribe;
  }, [postId]);

  // 3) Suscripción al documento de «me gusta» del usuario actual
  //    (`posts/{postId}/likes/{uid}`): su existencia determina el estado
  //    activado/desactivado del control (Req 5.2, 5.3). Sin sesión, el control
  //    se considera desactivado.
  useEffect(() => {
    if (!user || !postId) {
      setLiked(false);
      return;
    }
    const likeRef = doc(firestore, "posts", postId, "likes", user.uid);
    const unsubscribe = onSnapshot(
      likeRef,
      (snapshot) => {
        if (mountedRef.current) {
          setLiked(snapshot.exists());
        }
      },
      () => {
        // Ante un fallo de lectura se mantiene el último estado conocido.
      },
    );
    return unsubscribe;
  }, [user, postId]);

  // Conmutación con actualización optimista y rollback ante fallo (Req 5.8).
  const handleToggle = useCallback(async () => {
    if (!user || pending) {
      return;
    }

    // Estado previo para poder revertir si la operación falla.
    const previousLiked = liked;
    const previousCount = count;

    // Actualización optimista: respuesta visual inmediata (Req 5.4, 5.5).
    setErrorMessage(null);
    setLiked(!previousLiked);
    setCount(
      previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1,
    );
    setPending(true);

    try {
      const result = await toggleLikeAction(postId);
      if (!mountedRef.current) {
        return;
      }
      if (!result.ok) {
        // Rollback al estado y contador previos (Req 5.8).
        setLiked(previousLiked);
        setCount(previousCount);
        setErrorMessage(
          result.error ??
            "No se pudo completar la operación. Inténtalo de nuevo.",
        );
      }
      // En caso de éxito, las suscripciones `onSnapshot` reconcilian el estado
      // con la verdad del servidor; no es necesario fijarlo aquí.
    } catch {
      // Fallo inesperado (p. ej. red): rollback y mensaje en español (Req 5.8).
      if (mountedRef.current) {
        setLiked(previousLiked);
        setCount(previousCount);
        setErrorMessage(
          "No se pudo completar la operación. Inténtalo de nuevo.",
        );
      }
    } finally {
      if (mountedRef.current) {
        setPending(false);
      }
    }
  }, [user, pending, liked, count, postId]);

  const likeLabel = `${count} me gusta`;

  // Visitante no autenticado: en lugar de conmutar, se invita a iniciar sesión
  // (Req 5.7). Se sigue mostrando el contador en tiempo real (Req 5.1).
  if (user === null) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Tooltip title="Inicia sesión para dar me gusta">
            <Link href={loginHref} aria-label="Inicia sesión para dar me gusta">
              <Button
                icon={<HeartOutlined />}
                aria-pressed={false}
                className="border-[#1e4a6e]! text-[#9ED0FA]!"
              >
                {count}
              </Button>
            </Link>
          </Tooltip>
          <Link
            href={loginHref}
            className="text-sm text-[#4a9eda] hover:text-[#9ED0FA] transition-colors"
          >
            Inicia sesión para dar me gusta
          </Link>
        </div>
      </div>
    );
  }

  // Estado de autenticación aún sin resolver: control deshabilitado mostrando el
  // contador actual para evitar parpadeos de layout.
  const authResolving = user === undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Tooltip
          title={
            authResolving
              ? undefined
              : liked
                ? "Quitar me gusta"
                : "Dar me gusta"
          }
        >
          <Button
            type={liked ? "primary" : "default"}
            danger={liked}
            icon={liked ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleToggle}
            loading={pending}
            disabled={authResolving}
            aria-pressed={liked}
            aria-label={
              liked
                ? `Quitar me gusta. ${likeLabel}`
                : `Dar me gusta. ${likeLabel}`
            }
            className={liked ? undefined : "border-[#1e4a6e]! text-[#9ED0FA]!"}
          >
            {count}
          </Button>
        </Tooltip>
      </div>

      {/* Mensaje de error en español ante un fallo de la operación (Req 5.8). */}
      {errorMessage && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={() => setErrorMessage(null)}
          message={errorMessage}
          className="border-none"
        />
      )}
    </div>
  );
}
