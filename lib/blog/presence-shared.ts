// Constantes neutrales del servicio de presencia, compartidas por el módulo de
// CLIENTE (`presence.ts`) y el de SERVIDOR (`presence-server.ts`).
//
// Este módulo NO lleva la directiva `client-only` ni `server-only`: contiene
// únicamente valores planos sin dependencias de entorno, de modo que ambos
// grafos (cliente y servidor) pueden importarlo sin contaminarse mutuamente.

/** Nombre de la colección de presencia en Firestore. */
export const PRESENCE_COLLECTION = "presence";
