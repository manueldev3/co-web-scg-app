"use client";

// Mapamundi de usuarios conectados en tiempo real (Dashboard del Panel_Admin).
//
// --- Restricción de plataforma (Next.js 16 modificado) ---
// Antes de implementar este componente se consultó la documentación incluida en
// `node_modules/next/dist/docs/`. Hallazgos aplicados aquí
// (`01-app/01-getting-started/05-server-and-client-components.md`):
//
// 1. Componente de CLIENTE: lleva la directiva `"use client"` porque usa estado,
//    efectos y una suscripción en tiempo real basada en el SDK de navegador de
//    Firebase (`subscribeToActiveConnections`, en `lib/blog/presence.ts`, que a
//    su vez está marcado con `import "client-only"`). Toda la suscripción vive
//    dentro de `useEffect`, de modo que no se ejecuta en el render del servidor.
// 2. El valor inicial (`initialConnections`) lo aporta el Server Component que
//    monta este control (tarea 10.2, `app/admin/page.tsx`) a partir de la lectura
//    puntual en servidor `getActiveConnections()` de `lib/blog/presence-server.ts`
//    (Admin SDK, `server-only`). Así el primer pintado ya muestra un conteo real
//    sin esperar a la primera instantánea en tiempo real.
//
// --- Modelo de tiempo real (design.md «Modelo de tiempo real», Req 8) ---
// El Dashboard se suscribe al conjunto de conexiones de presencia vigentes con
// `subscribeToActiveConnections`, que entrega únicamente las conexiones activas
// (no caducadas) según `PRESENCE_TTL_MS` calculadas con la lógica pura
// `activeConnections` de `blog-engine`. Como una conexión puede caducar por el
// simple paso del tiempo sin que llegue una nueva instantánea, este componente
// vuelve a filtrar periódicamente con `activeConnections(..., Date.now(), TTL)`
// para que esas conexiones también desaparezcan del conteo y del mapa (Req 8.5).
//
// Reparto de responsabilidades respecto a los requisitos:
//   - Req 8.1: muestra el total de conectados como entero >= 0 (= nº de activas).
//   - Req 8.5: refleja altas/bajas en <= 5 s (instantánea + re-filtrado periódico).
//   - Req 8.6: posiciona en el mapamundi solo las ubicaciones mapeables
//     (`isMappableLocation`: lat ∈ [-90,90], lng ∈ [-180,180]).
//   - Req 8.7: las conexiones sin ubicación válida cuentan en el total pero NO
//     se representan en el mapa.
//   - Req 8.8: si la presencia no responde en 10 s o falla la suscripción, se
//     muestra una indicación de error y se conserva el último conteo conocido.

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Card, Spin, Statistic, Typography } from "antd";
import { GlobalOutlined, TeamOutlined } from "@ant-design/icons";

import {
  PRESENCE_HEARTBEAT_MS,
  subscribeToActiveConnections,
} from "@/lib/blog/presence";
import {
  activeConnections,
  isMappableLocation,
  PRESENCE_TTL_MS,
} from "@/app/blog/blog-engine";
import type { GeoLocation, PresenceConnection } from "@/app/blog/types";

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Constantes de comportamiento
// ---------------------------------------------------------------------------

/**
 * Plazo máximo de espera de la primera respuesta de presencia. Si no llega
 * ninguna instantánea (ni un error) en este tiempo, se considera que el servicio
 * no está disponible y se muestra la indicación de error (Req 8.8).
 */
const PRESENCE_RESPONSE_TIMEOUT_MS = 10_000;

/**
 * Cadencia con la que se vuelve a filtrar el conjunto vigente para que las
 * conexiones caducadas por el paso del tiempo desaparezcan del conteo y del mapa
 * incluso sin una nueva instantánea. Se reutiliza la cadencia del heartbeat del
 * servicio de presencia (un tercio del TTL ≈ 20 s), holgadamente por debajo de
 * los 5 s de margen para reflejar cambios provocados por altas/bajas reales
 * (esas sí llegan como instantánea inmediata, Req 8.5).
 */
const REFILTER_INTERVAL_MS = Math.max(1000, PRESENCE_HEARTBEAT_MS);

// ---------------------------------------------------------------------------
// Proyección geográfica (equirectangular simple)
// ---------------------------------------------------------------------------

/**
 * Proyecta una ubicación geográfica a coordenadas porcentuales [0..100] sobre un
 * lienzo equirectangular (plate carrée): la longitud se mapea al eje X y la
 * latitud, invertida, al eje Y (el norte queda arriba). Función pura para poder
 * probarla de forma aislada.
 *
 * @returns `{ x, y }` en porcentaje del ancho/alto del contenedor del mapa.
 */
export function projectToPercent(loc: GeoLocation): { x: number; y: number } {
  const x = ((loc.lng + 180) / 360) * 100;
  const y = ((90 - loc.lat) / 180) * 100;
  return { x, y };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props de {@link ConnectedUsersMap}.
 *
 * CONTRATO PARA LA TAREA 10.2 (`app/admin/page.tsx`, Server Component):
 *
 * - `initialConnections` (opcional): conjunto inicial de conexiones de presencia
 *   ya vigentes, leído en el servidor con `getActiveConnections()` de
 *   `lib/blog/presence-server.ts`. La página de admin (Server Component) debe
 *   obtenerlo en el servidor y pasarlo como prop para que el primer render
 *   muestre un conteo real (Req 8.1) sin parpadeo de carga. Si se omite, el
 *   componente arranca en estado de carga hasta recibir la primera instantánea
 *   en tiempo real (o agotar el plazo de 10 s, Req 8.8).
 *
 *   IMPORTANTE: este componente es `"use client"`. La página que lo monta es un
 *   Server Component que NO debe importar `lib/blog/presence.ts` (cliente) ni el
 *   SDK de navegador; solo lee con `presence-server.ts` (Admin SDK) y entrega el
 *   resultado serializable (`PresenceConnection[]`) por esta prop.
 *
 * Ejemplo de montaje en la tarea 10.2:
 * ```tsx
 * // app/admin/page.tsx (Server Component)
 * import { getActiveConnections } from "@/lib/blog/presence-server";
 * import ConnectedUsersMap from "@/app/admin/ConnectedUsersMap";
 *
 * export default async function AdminDashboardPage() {
 *   const initialConnections = await getActiveConnections();
 *   return <ConnectedUsersMap initialConnections={initialConnections} />;
 * }
 * ```
 */
export interface ConnectedUsersMapProps {
  /**
   * Conjunto inicial de conexiones vigentes leído en el servidor. Por defecto un
   * conjunto vacío (sin datos iniciales ⇒ estado de carga hasta la 1ª respuesta).
   */
  initialConnections?: PresenceConnection[];
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Mapamundi de conectados en tiempo real. Muestra el total de usuarios
 * conectados y representa en el mapa únicamente las conexiones con ubicación
 * geográfica válida. Ante la indisponibilidad del servicio de presencia, muestra
 * un aviso de error conservando el último conteo conocido.
 */
export default function ConnectedUsersMap({
  initialConnections = [],
}: ConnectedUsersMapProps) {
  // Conjunto de conexiones vigentes (ya filtradas como activas). Se inicializa
  // con el valor leído en servidor para un primer render con datos reales.
  const [connections, setConnections] =
    useState<PresenceConnection[]>(initialConnections);

  // `true` mientras no se ha recibido la primera respuesta del servicio y no hay
  // datos iniciales: muestra un indicador de carga (Req 8.1 sigue cumpliéndose
  // en cuanto llegan los datos).
  const [loading, setLoading] = useState<boolean>(
    initialConnections.length === 0,
  );

  // `true` si el servicio no responde en 10 s o si la suscripción falla. Cuando
  // está activo, se conserva el último conteo y mapa conocidos (Req 8.8).
  const [presenceError, setPresenceError] = useState<boolean>(false);

  // Evita actualizar el estado tras desmontar el componente.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 1) Suscripción en tiempo real al conjunto de conexiones activas (Req 8.5) y
  //    temporizador de indisponibilidad de 10 s (Req 8.8).
  useEffect(() => {
    let receivedFirstResponse = false;

    // Temporizador: si no llega ninguna respuesta en 10 s, se marca error y se
    // conserva el último conteo conocido (el inicial, si lo hubiera).
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && !receivedFirstResponse) {
        setPresenceError(true);
        setLoading(false);
      }
    }, PRESENCE_RESPONSE_TIMEOUT_MS);

    const unsubscribe = subscribeToActiveConnections(
      (active) => {
        receivedFirstResponse = true;
        clearTimeout(timeoutId);
        if (!mountedRef.current) {
          return;
        }
        // Datos frescos: se actualiza el conjunto, se limpia el error y termina
        // la carga. Las altas/bajas reales llegan aquí de inmediato (Req 8.5).
        setConnections(active);
        setPresenceError(false);
        setLoading(false);
      },
      () => {
        // Fallo de la suscripción: indicación de error conservando el último
        // conteo conocido (no se tocan `connections`) (Req 8.8).
        receivedFirstResponse = true;
        clearTimeout(timeoutId);
        if (mountedRef.current) {
          setPresenceError(true);
          setLoading(false);
        }
      },
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // 2) Re-filtrado periódico: una conexión puede caducar por el paso del tiempo
  //    sin que llegue una nueva instantánea; se vuelve a filtrar con la lógica
  //    pura para que también desaparezca del conteo y del mapa (Req 8.5). En
  //    estado de error se omite, para conservar el último conteo conocido (8.8).
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!mountedRef.current) {
        return;
      }
      setConnections((prev) => {
        const next = activeConnections(prev, Date.now(), PRESENCE_TTL_MS);
        // Evita renders innecesarios si nada caducó en este tick.
        return next.length === prev.length ? prev : next;
      });
    }, REFILTER_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  // Total de conectados: entero >= 0 igual al número de conexiones activas
  // (incluye las que no tienen ubicación, Req 8.1, 8.7).
  const totalConnected = connections.length;

  // Subconjunto representable en el mapa: solo ubicaciones mapeables (Req 8.6).
  // Las conexiones sin ubicación válida quedan fuera del mapa pero ya están
  // contadas en `totalConnected` (Req 8.7).
  const mappable = useMemo(
    () => connections.filter((conn) => isMappableLocation(conn.location)),
    [connections],
  );

  return (
    <Card
      variant="borderless"
      className="bg-[#0F2C3E] shadow-xl"
      title={
        <span className="flex items-center gap-2 text-[#9ED0FA]">
          <GlobalOutlined aria-hidden />
          Usuarios conectados
        </span>
      }
    >
      {/* Indicación de error de presencia conservando el último conteo (Req 8.8). */}
      {presenceError && (
        <Alert
          type="warning"
          showIcon
          role="alert"
          className="mb-4 border-none"
          message="Datos de presencia no disponibles"
          description="No se pudo obtener la información de usuarios conectados en tiempo real. Se muestra el último conteo conocido."
        />
      )}

      <div className="mb-4 flex items-center gap-3">
        {loading && !presenceError ? (
          // Carga inicial sin datos: indicador mientras llega la 1ª respuesta.
          <Spin aria-label="Cargando usuarios conectados" />
        ) : (
          <Statistic
            title={<span className="text-[#9ED0FA]">Conectados ahora</span>}
            value={totalConnected}
            prefix={<TeamOutlined aria-hidden />}
            // El total siempre es un entero >= 0 (Req 8.1).
            valueStyle={{ color: "#ffffff" }}
          />
        )}
      </div>

      {/* Mapamundi: proyección equirectangular ligera (sin librerías de mapas). */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-[#1e4a6e] bg-[#0a1f2c]"
        style={{ aspectRatio: "2 / 1" }}
        role="img"
        aria-label={`Mapa de usuarios conectados: ${mappable.length} de ${totalConnected} con ubicación`}
      >
        {/* Retícula de referencia (ecuador y meridiano de Greenwich). */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Ecuador (lat 0 ⇒ y = 25 en un lienzo de 50 de alto). */}
          <line
            x1="0"
            y1="25"
            x2="100"
            y2="25"
            stroke="#1e4a6e"
            strokeWidth="0.3"
          />
          {/* Meridiano de Greenwich (lng 0 ⇒ x = 50). */}
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="50"
            stroke="#1e4a6e"
            strokeWidth="0.3"
          />
        </svg>

        {/* Un punto por conexión geolocalizable (Req 8.6). */}
        {mappable.map((conn) => {
          const { x, y } = projectToPercent(conn.location as GeoLocation);
          return (
            <span
              key={conn.connectionId}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4a9eda] ring-2 ring-[#9ED0FA]/40"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`Conexión en lat ${conn.location?.lat}, lng ${conn.location?.lng}`}
            />
          );
        })}
      </div>

      {/* Nota: las conexiones sin ubicación válida cuentan en el total pero no
          se representan en el mapa (Req 8.7). */}
      <Text type="secondary" className="mt-3 block text-xs">
        {mappable.length} con ubicación en el mapa · {totalConnected} en total
      </Text>
    </Card>
  );
}
