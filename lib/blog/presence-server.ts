import "server-only";

// Servicio de presencia — lado SERVIDOR (lectura del Administrador).
//
// Módulo hermano de `lib/blog/presence.ts` (cliente). Aquí vive la lectura del
// conjunto de conexiones activas mediante el Admin SDK de Firebase, que omite
// las Reglas de Firestore y nunca debe llegar al navegador. Se marca con
// `import "server-only"` para que cualquier importación desde un Client
// Component produzca un error de compilación.
//
// Motivo de la separación en dos archivos (ver
// `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`,
// «Preventing environment poisoning»): el SDK de cliente (`firebase/firestore`,
// APIs de navegador) y el Admin SDK (`firebase-admin`, solo Node) no pueden
// convivir en el mismo módulo sin contaminar el bundle del cliente.
//
// Firebase Admin SDK v14 (API MODULAR): `firebase-admin/firestore` expone
// `getFirestore`; los documentos de presencia se leen una sola vez (lectura
// puntual para el render en servidor del Dashboard). La suscripción en tiempo
// real la realiza el Client Component del mapa con `subscribeToActiveConnections`.

import { getFirestore } from "firebase-admin/firestore";

import initFirebase from "@/lib/firebase/admin";
import { activeConnections, PRESENCE_TTL_MS } from "@/app/blog/blog-engine";
import { PRESENCE_COLLECTION } from "@/lib/blog/presence-shared";
import type { GeoLocation, PresenceConnection } from "@/app/blog/types";

/** Inicializa el Admin SDK (idempotente) y devuelve la instancia de Firestore. */
function db() {
  initFirebase();
  return getFirestore();
}

/**
 * Convierte un documento de presencia (Admin SDK) en `PresenceConnection`.
 * `lastSeen` se persiste con marca de servidor y se lee como `Timestamp` de
 * `firebase-admin`, que expone `toMillis()`. Un valor ausente se trata como
 * `Date.now()` (recién escrito ⇒ vigente).
 */
function mapPresenceDoc(
  id: string,
  data: FirebaseFirestore.DocumentData,
): PresenceConnection {
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

  return { connectionId: id, lastSeen, location };
}

/**
 * Lee, una sola vez en el servidor, el conjunto de conexiones de presencia y
 * devuelve únicamente las VIGENTES según la ventana de inactividad
 * `PRESENCE_TTL_MS`, calculadas con `activeConnections` de `blog-engine`
 * (Req 8.1, 8.4). Útil como valor inicial del Dashboard antes de que el Client
 * Component del mapa establezca la suscripción en tiempo real.
 */
export async function getActiveConnections(): Promise<PresenceConnection[]> {
  const snapshot = await db().collection(PRESENCE_COLLECTION).get();
  const all = snapshot.docs.map((d) => mapPresenceDoc(d.id, d.data()));
  return activeConnections(all, Date.now(), PRESENCE_TTL_MS);
}
