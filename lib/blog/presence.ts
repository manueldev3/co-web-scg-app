import "client-only";

// Servicio de presencia en tiempo real — lado CLIENTE (Req 8.2, 8.3, 8.4, 8.5).
//
// Este módulo registra y mantiene la conexión del navegador actual en la
// colección `presence/{connectionId}` de Firestore mediante el SDK de CLIENTE
// (`firebase/firestore`, ver `lib/firebase/config.ts`). Lo consumen únicamente
// Client Components ("use client"); por eso se marca con `import "client-only"`
// para que cualquier intento de importarlo en el grafo de servidor produzca un
// error de compilación.
//
// Plataforma (Next.js 16 modificado), consultado en
// `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
// («Preventing environment poisoning»): el SDK de cliente de Firebase usa APIs
// de navegador, por lo que NO debe mezclarse en el mismo módulo con el Admin SDK
// (server-only). La lectura del conjunto activo desde el servidor vive, por esa
// razón, en un módulo hermano (`lib/blog/presence-server.ts`).
//
// Las reglas de `presence/{connectionId}` permiten crear/actualizar/eliminar a
// cualquier cliente (incluidos Visitantes no autenticados), de modo que el
// conteo de conectados los incluye (ver `firestore.rules`). La lectura del
// conjunto, en cambio, está restringida al Administrador.

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { firestore } from "@/lib/firebase/config";
import { activeConnections, PRESENCE_TTL_MS } from "@/app/blog/blog-engine";
import { PRESENCE_COLLECTION } from "@/lib/blog/presence-shared";
import type { GeoLocation, PresenceConnection } from "@/app/blog/types";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

// Se reexporta la constante neutral compartida para que los consumidores del
// servicio de cliente dispongan del nombre de colección sin importar el módulo
// de servidor.
export { PRESENCE_COLLECTION };

/**
 * Cadencia del heartbeat que refresca `lastSeen`. Debe ser holgadamente menor
 * que `PRESENCE_TTL_MS` (60 s) para que una conexión activa nunca caduque entre
 * dos latidos. Se toma un tercio del TTL (20 s), lo que deja margen para fallos
 * puntuales de red sin que la conexión se marque como inactiva (Req 8.4, 8.5).
 */
export const PRESENCE_HEARTBEAT_MS = Math.floor(PRESENCE_TTL_MS / 3);

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Opciones para registrar una conexión de presencia. */
export interface RegisterPresenceOptions {
  /** Ubicación geográfica aproximada opcional (Req 8.6, 8.7). */
  location?: GeoLocation | null;
  /** Cadencia del heartbeat en ms (por defecto `PRESENCE_HEARTBEAT_MS`). */
  heartbeatMs?: number;
}

/**
 * Controlador de una conexión registrada. Permite detener el heartbeat y dar de
 * baja la conexión de forma explícita.
 */
export interface PresenceHandle {
  /** Identificador del documento `presence/{connectionId}` de esta conexión. */
  readonly connectionId: string;
  /**
   * Detiene el heartbeat, retira el listener de descarga de página y elimina el
   * documento de presencia. Idempotente: llamadas adicionales no tienen efecto.
   */
  stop: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Mapeo de documentos -> modelo de dominio
// ---------------------------------------------------------------------------

/**
 * Convierte un documento de presencia en el modelo de dominio
 * `PresenceConnection`. `lastSeen` se persiste con `serverTimestamp()`: al
 * leerlo es un `Timestamp` de Firestore con `toMillis()`. Mientras una escritura
 * con `serverTimestamp()` está pendiente de confirmación del servidor, el valor
 * local puede ser `null`; en ese caso la conexión acaba de escribirse y se
 * considera vigente (se usa `Date.now()`).
 */
export function mapPresenceDoc(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): PresenceConnection {
  const data = snapshot.data();
  const rawLastSeen = data.lastSeen as { toMillis?: () => number } | null;
  const lastSeen =
    rawLastSeen && typeof rawLastSeen.toMillis === "function"
      ? rawLastSeen.toMillis()
      : Date.now();

  const rawLocation = data.location as GeoLocation | null | undefined;
  const location =
    rawLocation &&
    typeof rawLocation.lat === "number" &&
    typeof rawLocation.lng === "number"
      ? { lat: rawLocation.lat, lng: rawLocation.lng }
      : null;

  return { connectionId: snapshot.id, lastSeen, location };
}

// ---------------------------------------------------------------------------
// Registro de la conexión del cliente actual
// ---------------------------------------------------------------------------

/**
 * Registra la conexión del navegador actual y mantiene viva su presencia.
 *
 * Comportamiento:
 *  1. Crea de inmediato el documento `presence/{connectionId}` con `lastSeen`
 *     (marca de servidor) y la ubicación opcional. El alta se realiza al instante
 *     de la llamada, muy por debajo del límite de 5 s (Req 8.2).
 *  2. Arranca un heartbeat que refresca `lastSeen` cada `heartbeatMs` (< TTL),
 *     de modo que una conexión activa nunca se considera inactiva (Req 8.4, 8.5).
 *  3. Registra un listener de descarga de página (`pagehide`) que elimina el
 *     documento al cerrar/abandonar la pestaña (Req 8.3). Si la baja en descarga
 *     no llega a completarse, la caducidad por TTL (> 60 s) actúa como respaldo.
 *
 * Devuelve un `PresenceHandle` con `stop()` para una baja explícita (p. ej. al
 * desmontar el componente que la creó).
 *
 * @param options Ubicación opcional y cadencia de heartbeat.
 */
export function registerPresence(
  options: RegisterPresenceOptions = {},
): PresenceHandle {
  const { location = null, heartbeatMs = PRESENCE_HEARTBEAT_MS } = options;

  // Documento con id autogenerado: su id identifica la conexión.
  const ref = doc(collection(firestore, PRESENCE_COLLECTION));
  const connectionId = ref.id;

  // Escritura inicial (alta). El campo `connectionId` se desnormaliza dentro del
  // documento para facilitar consumos que no dispongan del id del snapshot.
  const writeFull = () =>
    setDoc(ref, {
      connectionId,
      lastSeen: serverTimestamp(),
      location: location ?? null,
    });

  // Refresco del heartbeat: solo actualiza `lastSeen` (merge para preservar la
  // ubicación y el resto de campos).
  const writeHeartbeat = () =>
    setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true });

  let stopped = false;

  // 1) Alta inmediata. Es best-effort: un fallo de red no debe romper la UI.
  void writeFull().catch(() => {
    /* la presencia es no crítica; el siguiente heartbeat reintentará el alta */
  });

  // 2) Heartbeat periódico.
  const intervalId = setInterval(
    () => {
      void writeHeartbeat().catch(() => {
        /* ignorado: la conexión caducará por TTL si los latidos siguen fallando */
      });
    },
    Math.max(1000, heartbeatMs),
  );

  // 3) Baja en descarga de página. `pagehide` es más fiable que `beforeunload`
  // (cubre el caso de la caché de retroceso/avance en móviles).
  const handleUnload = () => {
    // En descarga, `deleteDoc` es best-effort; el TTL es el respaldo (Req 8.4).
    void deleteDoc(ref).catch(() => {
      /* ignorado: respaldo por caducidad de TTL */
    });
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", handleUnload);
  }

  const stop = async (): Promise<void> => {
    if (stopped) return;
    stopped = true;
    clearInterval(intervalId);
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", handleUnload);
    }
    try {
      await deleteDoc(ref);
    } catch {
      /* ignorado: el documento caducará por TTL si la baja no se completa */
    }
  };

  return { connectionId, stop };
}

// ---------------------------------------------------------------------------
// Suscripción al conjunto de conexiones activas (Dashboard del Administrador)
// ---------------------------------------------------------------------------

/**
 * Se suscribe en tiempo real al conjunto de conexiones de presencia y entrega
 * únicamente las VIGENTES (no caducadas) según la ventana de inactividad
 * `PRESENCE_TTL_MS`, calculadas con `activeConnections` de `blog-engine`.
 *
 * Pensado para el Mapa de Conectados del Dashboard, cuya lectura solo autoriza
 * el Administrador (ver `firestore.rules`). Las actualizaciones se entregan en
 * cuanto Firestore emite un snapshot, dentro del margen de 5 s exigido (Req 8.5).
 *
 * El filtrado de vigencia se evalúa con `Date.now()` en cada snapshot. Como una
 * conexión puede caducar por el simple paso del tiempo sin que llegue un nuevo
 * snapshot, el consumidor puede re-evaluar periódicamente volviendo a filtrar
 * con `activeConnections`; este servicio expone el dato crudo más reciente.
 *
 * @param onActive Callback con la lista de conexiones vigentes.
 * @param onError Callback opcional para fallos de la suscripción (Req 8.8).
 * @returns Función para cancelar la suscripción.
 */
export function subscribeToActiveConnections(
  onActive: (connections: PresenceConnection[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const presenceRef = collection(firestore, PRESENCE_COLLECTION);

  return onSnapshot(
    presenceRef,
    (snapshot) => {
      const all = snapshot.docs.map(mapPresenceDoc);
      onActive(activeConnections(all, Date.now(), PRESENCE_TTL_MS));
    },
    (error) => {
      onError?.(error);
    },
  );
}
