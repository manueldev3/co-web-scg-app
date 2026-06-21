// Tipos de dominio compartidos del Blog.
// Módulo sin dependencias de React/Next/Firebase: lo consumen la lógica pura
// (`blog-engine.ts`), el acceso a datos (`blog-data.ts`), las Server Actions y la UI.

/** Estado de publicación de una entrada. */
export type PublicationStatus = "borrador" | "publicada";

/** Entrada del blog. Los contadores están denormalizados en el documento. */
export interface Post {
  id: string;
  slug: string; // identificador de ruta legible
  title: string; // 1..200
  content: string; // 1..50000
  status: PublicationStatus;
  publishedAt: number | null; // epoch ms; null mientras es borrador
  createdAt: number;
  updatedAt: number;
  categoryIds: string[]; // 0..10 (0 solo posible tras desasociar categoría)
  commentCount: number; // entero >= 0 (denormalizado)
  likeCount: number; // entero >= 0 (denormalizado)
}

/** Categoría que clasifica entradas. */
export interface Category {
  id: string;
  name: string; // 1..50
  nameLower: string; // name.toLowerCase() para unicidad/búsqueda
}

/** Comentario de un usuario registrado sobre una entrada. */
export interface Comment {
  id: string;
  postId: string;
  authorId: string; // uid del Usuario_Registrado
  content: string; // 1..2000
  createdAt: number; // epoch ms
}

/** «Me gusta» de un usuario sobre una entrada (máx. uno por (userId, postId)). */
export interface Like {
  postId: string;
  userId: string; // clave compuesta: máx. un like por (userId, postId)
  createdAt: number;
}

/** Rol de una cuenta del blog. */
export type UserRole = "suscriptor" | "admin";

/** Cuenta del blog (registro en Firestore asociado a Firebase Auth). */
export interface BlogUser {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

/** Ubicación geográfica aproximada de una conexión de presencia. */
export interface GeoLocation {
  lat: number;
  lng: number;
}

/** Conexión activa en el sistema de presencia en tiempo real. */
export interface PresenceConnection {
  connectionId: string;
  lastSeen: number; // epoch ms
  location?: GeoLocation | null;
}
