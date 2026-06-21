"use server";

// Server Action de lectura para la sección destacada del Blog en la home.
//
// Contexto de plataforma (Next.js 16 modificado), consultado en
// `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
// y `07-mutating-data.md`:
//   - `app/blog/blog-data.ts` es un módulo SOLO de servidor (importa
//     `firebase-admin`), por lo que NO puede importarse desde un Client
//     Component. La forma canónica de que un Client Component obtenga datos
//     server-only es a través de una Server Action (`"use server"`), invocable
//     desde el cliente y ejecutada en el servidor.
//   - `app/page.tsx` es un Client Component (`"use client"`) y la sección
//     destacada (`HomeFeaturedBlog`) también lo es por diseño (necesita el ancho
//     de la ventana para el conteo responsive). Por eso exponemos
//     `getFeaturedPosts()` mediante esta acción en lugar de pasarla por props
//     desde un Server Component padre.
//
// La acción NUNCA lanza: ante un fallo de lectura devuelve una lista vacía, de
// modo que un problema con Firebase quede contenido en la sección destacada
// (que mostrará el mensaje de «aún no hay entradas», Req 11.10) sin romper el
// resto de la página de inicio.

import { getFeaturedPosts } from "@/app/blog/blog-data";
import type { Post } from "@/app/blog/types";

/**
 * Devuelve las entradas destacadas (hasta `FEATURED_TOTAL`, ya ordenadas por
 * `selectFeatured`: primero la más reciente y después las de mayor número de
 * comentarios). Ante cualquier error de lectura devuelve `[]`.
 */
export async function getFeaturedPostsAction(): Promise<Post[]> {
  try {
    return await getFeaturedPosts();
  } catch {
    return [];
  }
}
