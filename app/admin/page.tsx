import { Suspense } from "react";

import { getAdminMetricsData } from "@/app/blog/blog-data";
import { computeDashboardMetrics } from "@/app/blog/blog-engine";
import { getActiveConnections } from "@/lib/blog/presence-server";
import ConnectedUsersMap from "@/app/admin/ConnectedUsersMap";
import type { PresenceConnection } from "@/app/blog/types";

// Dashboard del Panel_Admin (`/admin`) — 4 métricas + mapa de presencia.
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Documentación consultada en `node_modules/next/dist/docs/`:
//
// 1. `02-guides/instant-navigation.md` (streaming con `<Suspense>`): cada bloque
//    que obtiene datos no cacheados (las métricas y el mapa de presencia) se
//    envuelve en su propio límite `<Suspense>`. Mientras el componente servidor
//    asíncrono espera la lectura de Firestore, React transmite (stream) el
//    fallback y, al resolverse, sustituye el contenido sin recargar. Esto cubre
//    el «indicador de carga por métrica» (Req 7.6) sin bloquear el shell.
//
// 2. NO se usa `use cache` ni se exporta `unstable_instant = { prefetch }`: esos
//    son APIs de *Cache Components*, que este proyecto NO habilita (ver
//    `app/blog/blog-data.ts` y `next.config.ts`). El layout de `/admin`
//    (`app/admin/layout.tsx`) ya exporta `unstable_instant = false` por tratarse
//    de contenido dinámico específico del administrador; este Dashboard hereda
//    esa naturaleza dinámica (lee métricas y presencia en vivo en cada visita).
//
// 3. `01-getting-started/05-server-and-client-components.md` («Preventing
//    environment poisoning»): este es un **Server Component**. NO importa
//    `lib/blog/presence.ts` (cliente, SDK de navegador). La presencia se lee en
//    el servidor con `getActiveConnections()` de `lib/blog/presence-server.ts`
//    (Admin SDK, `server-only`) y el resultado serializable
//    (`PresenceConnection[]`) se entrega al Client Component `ConnectedUsersMap`.
//
// Reparto de responsabilidades respecto a los requisitos:
//   - Req 7.1-7.4: muestra las 4 métricas como enteros >= 0
//     (`computeDashboardMetrics`).
//   - Req 7.5: los valores se obtienen de Firestore vía `getAdminMetricsData`.
//   - Req 7.6: cada bloque pendiente muestra un indicador de carga (Suspense).
//   - Req 7.7: si la obtención de las métricas falla, se muestra un mensaje de
//     error sin renderizar valores parciales ni incorrectos (no se pinta ninguna
//     tarjeta de métrica).
//   - Req 8.1: monta el `Mapa_Conectados` (`ConnectedUsersMap`) con el conjunto
//     inicial de conexiones activas leído en el servidor.

/** Paleta del tema oscuro del panel (coincide con el resto de vistas admin). */
const CARD_BG = "bg-[#0F2C3E]";
const ACCENT = "text-[#9ED0FA]";

/** Definición declarativa de cada métrica del Dashboard (Req 7.1-7.4). */
interface MetricDefinition {
  key: "totalPosts" | "postsWithComments" | "totalComments" | "totalLikes";
  label: string;
}

const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: "totalPosts",
    label: "Entradas totales",
  },
  {
    key: "postsWithComments",
    label: "Entradas con comentarios",
  },
  {
    key: "totalComments",
    label: "Comentarios totales",
  },
  {
    key: "totalLikes",
    label: "«Me gusta» totales",
  },
];

/** Rejilla responsive de tarjetas (1 / 2 / 4 columnas según el ancho). */
function MetricsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  );
}

/**
 * Fallback de carga de las métricas (Req 7.6): una tarjeta con indicador de
 * carga por cada métrica pendiente mientras se leen los datos de Firestore.
 */
function MetricsLoading() {
  return (
    <MetricsGrid>
      {METRIC_DEFINITIONS.map((metric) => (
        <div key={metric.key} className={`rounded-lg ${CARD_BG} p-5 shadow-xl`}>
          <div className="flex flex-col gap-3">
            <span className={`flex items-center gap-2 ${ACCENT}`}>
              {metric.label}
            </span>
            <span
              className="text-sm text-gray-400"
              aria-label={`Cargando ${metric.label}`}
            >
              Cargando…
            </span>
          </div>
        </div>
      ))}
    </MetricsGrid>
  );
}

/**
 * Componente servidor asíncrono que obtiene los datos de métricas de Firestore,
 * los agrega con la lógica pura `computeDashboardMetrics` y renderiza las 4
 * tarjetas. Si la obtención falla, captura el error y muestra un mensaje sin
 * valores parciales ni incorrectos (Req 7.7). Al lanzar internamente solo este
 * subárbol, un fallo NO derriba el resto del Dashboard (el mapa de presencia).
 */
async function DashboardMetrics() {
  let metrics: ReturnType<typeof computeDashboardMetrics>;
  try {
    const { posts, comments, likes } = await getAdminMetricsData();
    metrics = computeDashboardMetrics(posts, comments, likes);
  } catch {
    // Req 7.7: error de obtención ⇒ mensaje claro y NINGÚN valor parcial.
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-sm text-red-200"
      >
        <p className="font-semibold text-red-100">
          No se pudieron cargar las métricas
        </p>
        <p className="mt-1">
          No fue posible obtener las métricas del Blog desde el almacén de
          datos. Vuelve a intentarlo más tarde.
        </p>
      </div>
    );
  }

  return (
    <MetricsGrid>
      {METRIC_DEFINITIONS.map((metric) => (
        <div key={metric.key} className={`rounded-lg ${CARD_BG} p-5 shadow-xl`}>
          <span className={`flex items-center gap-2 text-sm ${ACCENT}`}>
            {metric.label}
          </span>
          {/* Las 4 métricas son enteros >= 0 (Req 7.1-7.4). */}
          <p className="mt-2 text-3xl font-bold text-white">
            {metrics[metric.key]}
          </p>
        </div>
      ))}
    </MetricsGrid>
  );
}

/**
 * Componente servidor asíncrono que lee en el servidor el conjunto inicial de
 * conexiones de presencia activas y monta el Client Component del mapa (Req 8.1).
 * Si la lectura inicial falla, se monta el mapa sin datos iniciales: el propio
 * `ConnectedUsersMap` gestiona la suscripción en tiempo real y el estado de
 * error/timeout (Req 8.8), por lo que el Dashboard no se derriba.
 */
async function PresencePanel() {
  let initialConnections: PresenceConnection[];
  try {
    initialConnections = await getActiveConnections();
  } catch {
    initialConnections = [];
  }
  return <ConnectedUsersMap initialConnections={initialConnections} />;
}

/**
 * Página del Dashboard del Panel_Admin. Server Component que compone las métricas
 * y el mapa de presencia, cada uno tras su propio límite `<Suspense>` para
 * transmitir un indicador de carga mientras se obtienen los datos (Req 7.6).
 */
export default function AdminDashboardPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className={`mb-1 text-2xl font-bold ${ACCENT}`}>
          Panel de administración
        </h2>
        <p className="mb-0 text-sm text-gray-400">
          Métricas del Blog y usuarios conectados en tiempo real.
        </p>
      </div>

      {/* Métricas: stream con indicador de carga por métrica (Req 7.6). */}
      <section aria-label="Métricas del Blog" className="mb-8">
        <Suspense fallback={<MetricsLoading />}>
          <DashboardMetrics />
        </Suspense>
      </section>

      {/* Mapa de usuarios conectados en tiempo real (Req 8.1). */}
      <section aria-label="Usuarios conectados">
        <Suspense
          fallback={
            <div
              className={`rounded-lg ${CARD_BG} p-6 text-gray-300 shadow-xl`}
            >
              <span aria-label="Cargando usuarios conectados">
                Cargando usuarios conectados…
              </span>
            </div>
          }
        >
          <PresencePanel />
        </Suspense>
      </section>
    </div>
  );
}
