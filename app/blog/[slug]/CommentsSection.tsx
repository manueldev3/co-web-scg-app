"use client";

// Sección de comentarios del detalle de una Entrada (Client Component, tiempo real).
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Antes de implementar este componente se consultó la documentación incluida en
// `node_modules/next/dist/docs/`. Hallazgos aplicados aquí:
//
// 1. `01-app/01-getting-started/05-server-and-client-components.md`: la
//    interactividad (suscripción en tiempo real, estado del formulario, sesión
//    del usuario) requiere un Client Component, de ahí la directiva
//    `"use client"`. El SDK de CLIENTE de Firebase (`firebase/auth`,
//    `firebase/firestore`, vía `lib/firebase/config.ts`) usa APIs de navegador y
//    solo puede ejecutarse en este entorno.
// 2. `01-app/01-getting-started/07-mutating-data.md`: una Server Action puede
//    invocarse desde un Client Component importándola de un módulo `"use server"`
//    (`lib/blog/actions.ts`). El estado del formulario y el indicador de envío se
//    obtienen con `useActionState(action, initialState)`, que devuelve
//    `[state, formAction, pending]`; el `<form>` se conecta con `action={formAction}`.
//    Tras un envío con éxito el comentario NO se añade a mano: aparece a través de
//    la suscripción `onSnapshot` (read-your-own-writes en tiempo real, Req 4.9).
//
// Requisitos cubiertos: 4.1, 4.3, 4.4, 4.8, 4.9.

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Alert, Button, Card, Empty, Input, Spin, Typography } from "antd";
import {
  CalendarOutlined,
  CommentOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { auth, firestore } from "@/lib/firebase/config";
import { createComment } from "@/lib/blog/actions";
import { initialCommentState } from "@/lib/blog/action-types";
import { COMMENT_MAX } from "@/app/blog/blog-engine";
import type { Comment } from "../types";

const { Title, Text, Paragraph } = Typography;

/**
 * Props de {@link CommentsSection}.
 *
 * El detalle de la entrada (`app/blog/[slug]/page.tsx`, Server Component) monta
 * este componente pasando `post.id`. Solo se necesita el identificador de la
 * entrada: tanto la lista de comentarios (suscripción en tiempo real) como el
 * estado de sesión se resuelven en el cliente.
 */
export interface CommentsSectionProps {
  /** Identificador de la Entrada cuyos comentarios se muestran y a la que se comenta. */
  postId: string;
}

/** Formateador de fecha y hora en español: «12 de marzo de 2025, 14:30». */
const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Convierte un documento de comentario de Firestore al modelo de dominio
 * `Comment`. `createdAt` se persiste con `Timestamp`; al leerlo expone
 * `toMillis()`. Mientras una escritura con marca de servidor está pendiente de
 * confirmación, el valor local puede ser `null`; en ese caso el comentario
 * acaba de crearse y se usa `Date.now()`.
 */
function mapCommentDoc(snapshot: QueryDocumentSnapshot<DocumentData>): Comment {
  const data = snapshot.data();
  const rawCreatedAt = data.createdAt as { toMillis?: () => number } | null;
  const createdAt =
    rawCreatedAt && typeof rawCreatedAt.toMillis === "function"
      ? rawCreatedAt.toMillis()
      : Date.now();

  return {
    id: snapshot.id,
    postId: String(data.postId ?? ""),
    authorId: String(data.authorId ?? ""),
    content: String(data.content ?? ""),
    createdAt,
  };
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  // Lista de comentarios en tiempo real y posible error de suscripción.
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Sesión del usuario actual. `authReady` evita parpadeos del formulario antes
  // de conocer el estado de autenticación.
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Estado del formulario de comentario (patrón `useActionState`, Req 4.6/4.7).
  const [state, formAction, pending] = useActionState(
    createComment,
    initialCommentState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // --- Suscripción en tiempo real a los comentarios (Req 4.3, 4.9) ---
  // Ordenados por `createdAt` ascendente; cada snapshot refleja los nuevos
  // comentarios en cuanto Firestore los emite, muy por debajo del límite de 3 s.
  useEffect(() => {
    const commentsRef = collection(firestore, "posts", postId, "comments");
    const commentsQuery = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        setComments(snapshot.docs.map(mapCommentDoc));
        setCommentsLoading(false);
        setCommentsError(null);
      },
      () => {
        setCommentsLoading(false);
        setCommentsError("No se pudieron cargar los comentarios.");
      },
    );

    return () => unsubscribe();
  }, [postId]);

  // --- Estado de sesión (Req 4.1, 4.4) ---
  // El formulario solo es visible con sesión activa; si no la hay se muestra una
  // invitación a iniciar sesión.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Tras un envío con éxito se limpia el formulario. El comentario aparece en la
  // lista a través de la suscripción en tiempo real, no se añade a mano.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section
      aria-label="Comentarios de la entrada"
      className="mt-10 border-t border-[#1e4a6e] pt-8"
    >
      <Title level={2} className="text-white! flex items-center gap-2 mb-6!">
        <CommentOutlined className="text-[#4a9eda]" aria-hidden />
        Comentarios
        <span className="text-base font-normal text-[#82919E]">
          ({comments.length})
        </span>
      </Title>

      {/* Lista de comentarios: visible para cualquier visitante (Req 4.3). */}
      {commentsError !== null ? (
        <Alert type="error" showIcon message={commentsError} className="mb-6" />
      ) : commentsLoading ? (
        <div className="flex justify-center py-8">
          <Spin aria-label="Cargando comentarios" />
        </div>
      ) : comments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-gray-500">
              Aún no hay comentarios. ¡Sé el primero en comentar!
            </span>
          }
          className="py-4"
        />
      ) : (
        <ul className="flex flex-col gap-4 list-none p-0 m-0 mb-8">
          {comments.map((comment) => (
            <li key={comment.id}>
              <Card size="small" className="bg-[#0a1929]/80">
                {/* Autor y fecha de creación del comentario (Req 4.8). */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#82919E] mb-2">
                  <span className="inline-flex items-center gap-1.5">
                    <UserOutlined aria-hidden />
                    <span className="break-all font-mono">
                      {comment.authorId}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarOutlined aria-hidden />
                    <time dateTime={new Date(comment.createdAt).toISOString()}>
                      {dateTimeFormatter.format(new Date(comment.createdAt))}
                    </time>
                  </span>
                </div>
                <Paragraph className="text-gray-200! mb-0! whitespace-pre-wrap wrap-break-word">
                  {comment.content}
                </Paragraph>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* Zona de participación: formulario solo con sesión (Req 4.1); si no hay
          sesión, invitación a iniciar sesión (Req 4.4). Se espera a conocer el
          estado de autenticación para evitar parpadeos. */}
      {!authReady ? (
        <div className="flex justify-center py-4">
          <Spin aria-label="Comprobando sesión" />
        </div>
      ) : user ? (
        <Card className="bg-[#0a1929]/80">
          <Title level={4} className="text-white! mt-0! mb-4!">
            Añadir un comentario
          </Title>
          {/* `action={formAction}` conecta el formulario con la Server Action
              `createComment` vía `useActionState`. Los campos `postId` y
              `content` componen el `FormData` que la acción espera. */}
          <form
            ref={formRef}
            action={formAction}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="postId" value={postId} />
            <Input.TextArea
              name="content"
              rows={4}
              maxLength={COMMENT_MAX}
              showCount
              placeholder="Escribe tu comentario…"
              aria-label="Contenido del comentario"
              disabled={pending}
            />

            {/* Mensaje de error de validación en español (Req 4.6, 4.7) o de
                rechazo por sesión (Req 4.5). */}
            {!state.ok && state.error && (
              <Alert type="error" showIcon message={state.error} />
            )}

            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={pending}
              >
                Publicar comentario
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Inicia sesión para comentar"
          description={
            <span>
              Para unirte a la conversación y publicar un comentario necesitas{" "}
              <Link href="/blog/cuenta" className="text-[#4a9eda]! underline">
                iniciar sesión
              </Link>{" "}
              con tu cuenta.
            </span>
          }
        />
      )}
    </section>
  );
}
