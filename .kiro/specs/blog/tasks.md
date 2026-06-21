# Implementation Plan: Blog

## Overview

Este plan convierte el diseño del Blog en una secuencia incremental de tareas de codificación en **TypeScript** sobre Next.js 16 (versión modificada), React 19, Ant Design v6 y Tailwind v4. Se construye primero la capa de lógica pura (`app/blog/blog-engine.ts`), validada con pruebas basadas en propiedades (`fast-check`, ya instalado), y a continuación se levantan, una sobre otra, las capas de datos, las páginas públicas, las cuentas, los comentarios y «me gusta», el panel de administración, la sección destacada de la home, el enlace de cabecera, las reglas de Firestore y las páginas legales.

> Restricción de plataforma: antes de implementar cualquier ruta, layout, componente o llamada de datos, DEBE consultarse la documentación incluida en `node_modules/next/dist/docs/` y respetarse los avisos de obsolescencia (Proxy, `unstable_instant`, Server Functions, `params` como Promesa, manejo de errores con `not-found.tsx`/`error.tsx`).

## Tasks

- [x] 1. Preparar dependencias, tipos de dominio y andamiaje de la lógica pura
  - [x] 1.1 Instalar dependencias de Firebase y verificar configuración existente
    - Añadir `firebase` y `firebase-admin` a `package.json` con versiones fijadas
    - Confirmar que `lib/firebase/config.ts` (SDK cliente) y `lib/firebase/admin.ts` (Admin SDK) compilan e importan correctamente
    - _Requirements: Restricción de plataforma; base de Req 3, 4, 5, 7, 8, 9, 10, 15_

  - [x] 1.2 Definir los tipos de dominio compartidos en `app/blog/types.ts`
    - Declarar `PublicationStatus`, `Post`, `Category`, `Comment`, `Like`, `UserRole`, `BlogUser`, `GeoLocation`, `PresenceConnection`
    - _Requirements: 2.8, 2.9, 3.8, 5.6, 8.6, 10.2_

  - [x] 1.3 Crear `app/blog/blog-engine.ts` con constantes y firmas (stubs tipados)
    - Exportar constantes: `POSTS_PER_PAGE=10`, `COMMENT_MAX=2000`, `TITLE_MAX=200`, `CONTENT_MAX=50000`, `CATEGORY_NAME_MAX=50`, `CATEGORY_MIN=1`, `CATEGORY_MAX=10`, `PASSWORD_MIN=8`, `FEATURED_TOTAL=3`, `PRESENCE_TTL_MS=60000`
    - Declarar las firmas de todas las funciones puras del diseño (sin dependencias de React/Next/Firebase)
    - _Requirements: 1.8, 4.6, 4.7, 10.2, 11.6_

- [x] 2. Implementar la lógica pura del Blog (`app/blog/blog-engine.ts`)
  - [x] 2.1 Implementar funciones de listado y paginación
    - `orderPublishedPosts` (solo publicadas; fecha desc, título asc en empate), `filterByCategory`, `paginate`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8, 1.9, 1.10_

  - [x]\* 2.2 Escribir prueba de propiedad de visibilidad de publicadas
    - **Property 1: Solo las entradas publicadas son visibles públicamente**
    - **Validates: Requirements 1.1, 2.6, 2.7**
    - Archivo `app/blog/__tests__/publication-visibility.property.test.ts`, `fast-check` con `{ numRuns: 100 }`

  - [x]\* 2.3 Escribir prueba de propiedad de orden del listado
    - **Property 2: Orden del listado por fecha descendente y título ascendente**
    - **Validates: Requirements 1.2, 1.3**
    - Archivo `app/blog/__tests__/ordering.property.test.ts`

  - [x]\* 2.4 Escribir prueba de propiedad de filtrado por categoría
    - **Property 3: Filtrado por categoría devuelve solo publicadas de esa categoría**
    - **Validates: Requirements 1.4, 1.10**
    - Archivo `app/blog/__tests__/category-filter.property.test.ts`

  - [x]\* 2.5 Escribir prueba de propiedad de paginación
    - **Property 4: La paginación particiona la lista ordenada sin huecos ni solapamientos**
    - **Validates: Requirements 1.8, 1.9**
    - Archivo `app/blog/__tests__/pagination.property.test.ts`

  - [x] 2.6 Implementar funciones de validación y conmutación de «me gusta»
    - `validateCommentContent` (longitud efectiva 1..2000 tras recorte), `validateRegistration` (email válido + contraseña ≥ 8), `toggleLike` (involución, máx. 1 like por usuario)
    - _Requirements: 3.1, 3.5, 4.6, 4.7, 5.4, 5.5, 5.6_

  - [x]\* 2.7 Escribir prueba de propiedad de validación de comentario
    - **Property 5: Validación de contenido de comentario por longitud efectiva**
    - **Validates: Requirements 4.6, 4.7**
    - Archivo `app/blog/__tests__/comment-validation.property.test.ts`

  - [x]\* 2.8 Escribir prueba de propiedad de validación de registro
    - **Property 6: Validación de registro por email y contraseña**
    - **Validates: Requirements 3.1, 3.5**
    - Archivo `app/blog/__tests__/registration-validation.property.test.ts`

  - [x]\* 2.9 Escribir prueba de propiedad de conmutación de «me gusta»
    - **Property 7: Conmutar «me gusta» es una involución que mantiene un único like por usuario**
    - **Validates: Requirements 5.4, 5.5, 5.6**
    - Archivo `app/blog/__tests__/like-toggle.property.test.ts`

  - [x] 2.10 Implementar funciones de administración y métricas
    - `searchUsersByEmail` (insensible a may/min), `validatePost`, `isCategoryNameTaken`, `computeDashboardMetrics`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.5, 10.2, 10.6, 10.7, 10.9, 10.12_

  - [x]\* 2.11 Escribir prueba de propiedad de métricas del dashboard
    - **Property 8: Las métricas del dashboard agregan correctamente los datos**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - Archivo `app/blog/__tests__/dashboard-metrics.property.test.ts`

  - [x]\* 2.12 Escribir prueba de propiedad de búsqueda de usuarios
    - **Property 11: Búsqueda de usuarios por email insensible a mayúsculas**
    - **Validates: Requirements 9.5**
    - Archivo `app/blog/__tests__/user-search.property.test.ts`

  - [x]\* 2.13 Escribir prueba de propiedad de validación de entrada
    - **Property 12: Validación de entrada de blog por longitud y número de categorías**
    - **Validates: Requirements 10.2, 10.9, 10.12**
    - Archivo `app/blog/__tests__/post-validation.property.test.ts`

  - [x]\* 2.14 Escribir prueba de propiedad de unicidad de categoría
    - **Property 13: Unicidad de nombre de categoría insensible a mayúsculas**
    - **Validates: Requirements 10.6, 10.7**
    - Archivo `app/blog/__tests__/category-uniqueness.property.test.ts`

  - [x] 2.15 Implementar funciones de presencia, destacados y cabecera
    - `activeConnections`, `isMappableLocation`, `selectFeatured`, `featuredCountForWidth`, `isBlogLinkActive`
    - _Requirements: 8.1, 8.4, 8.6, 8.7, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 12.3_

  - [x]\* 2.16 Escribir prueba de propiedad de presencia (ttl)
    - **Property 9: Las conexiones inactivas quedan excluidas del conjunto activo**
    - **Validates: Requirements 8.4**
    - Archivo `app/blog/__tests__/presence-ttl.property.test.ts`

  - [x]\* 2.17 Escribir prueba de propiedad de conteo y mapa de presencia
    - **Property 10: El total de conectados incluye todas las conexiones activas y el mapa solo las geolocalizables**
    - **Validates: Requirements 8.1, 8.6, 8.7**
    - Archivo `app/blog/__tests__/presence-mapping.property.test.ts`

  - [x]\* 2.18 Escribir prueba de propiedad de selección de destacados
    - **Property 14: Selección de entradas destacadas**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.9**
    - Archivo `app/blog/__tests__/featured-selection.property.test.ts`

  - [x]\* 2.19 Escribir prueba de propiedad de destacados por viewport
    - **Property 15: Número de destacados según el ancho de la ventana**
    - **Validates: Requirements 11.6, 11.7, 11.8**
    - Archivo `app/blog/__tests__/featured-count.property.test.ts`

  - [x]\* 2.20 Escribir prueba de propiedad del estado activo del enlace «Blog»
    - **Property 16: Estado activo del enlace «Blog» en la cabecera**
    - **Validates: Requirements 12.3**
    - Archivo `app/blog/__tests__/blog-link-active.property.test.ts`

- [x] 3. Checkpoint - Lógica pura completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implementar acceso a datos de lectura y listado público
  - [x] 4.1 Implementar `app/blog/blog-data.ts` (lectura de Firestore, Server)
    - `getPublishedPosts`, `getPublishedPostBySlug` (devuelve `null` si no existe o es borrador), `getCategories`, `getFeaturedPosts` (usa `selectFeatured`), `getAdminMetricsData`
    - Marcar el contenido publicado estable con la directiva `use cache` según la doc de Next.js modificado
    - _Requirements: 1.1, 2.6, 2.7, 11.3, 7.5_

  - [x]\* 4.2 Escribir prueba de integración de resolución de slug (emulador Firebase)
    - Verificar que `getPublishedPostBySlug` devuelve `null` para borrador e inexistente y la entrada para publicada
    - _Requirements: 2.6, 2.7_

  - [x] 4.3 Implementar la página de listado `app/blog/page.tsx` con `loading.tsx` y `error.tsx`
    - Server Component: ordena con `orderPublishedPosts` y pagina con `paginate`; muestra título, fecha y categorías por entrada; mensaje de vacío; `error.tsx` (Client) con reintento y sin listado parcial
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 1.9, 1.11, 1.12_

  - [x] 4.4 Implementar `app/blog/BlogListClient.tsx` (UI de paginación y categorías)
    - "use client": controles de página siguiente/anterior y navegación de categorías preservando el orden
    - _Requirements: 1.8, 1.9_

  - [x] 4.5 Implementar `app/blog/categoria/[categoria]/page.tsx`
    - Listado filtrado por categoría con `filterByCategory`; mensaje en español cuando la categoría no tiene entradas publicadas
    - _Requirements: 1.4, 1.10_

  - [x]\* 4.6 Escribir pruebas unitarias de render del listado y estados vacíos
    - Render de título/fecha/categorías; mensaje de `/blog` vacío y de categoría sin entradas
    - _Requirements: 1.5, 1.6, 1.7, 1.10, 1.11_

- [x] 5. Implementar el detalle de una Entrada
  - [x] 5.1 Implementar `app/blog/[slug]/page.tsx` y `not-found.tsx`
    - Mostrar título, contenido completo sin truncar, fecha, categorías (omitir sección si no hay), y contadores de comentarios y «me gusta» como enteros ≥ 0; `notFound()` para borrador o slug inexistente (`await params`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x]\* 5.2 Escribir pruebas unitarias del detalle
    - Render de contenido y categorías; entrada sin categorías sin error; contadores enteros
    - _Requirements: 2.4, 2.5, 2.8, 2.9_

- [x] 6. Implementar cuentas de Usuario_Registrado (registro, inicio y cierre de sesión)
  - [x] 6.1 Implementar verificación de sesión en `lib/blog/session.ts` (server-only)
    - Verificar ID token y custom claim `admin` con el Admin SDK
    - _Requirements: 3.7, 6.2, 6.4, 6.8_

  - [x] 6.2 Implementar Server Actions de cuentas en `lib/blog/auth-actions.ts`
    - `registerUser` (valida con `validateRegistration`, crea cuenta y registro de usuario con rol `suscriptor`, traduce errores de Firebase a español), `loginUser` (mensaje genérico de credenciales), `logoutUser`
    - Errores esperados como valores de retorno (patrón `useActionState`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9_

  - [x] 6.3 Implementar la UI de registro e inicio de sesión (Client Components)
    - Formularios que invocan las Server Actions, mantienen estado autenticado entre recargas y muestran mensajes de error en español
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.9_

  - [x]\* 6.4 Escribir pruebas de integración de cuentas (emulador Firebase)
    - Login correcto, email duplicado, logout, persistencia de sesión, creación de registro con rol `suscriptor`
    - _Requirements: 3.2, 3.4, 3.6, 3.7, 3.8_

- [x] 7. Checkpoint - Blog público y cuentas
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar comentarios y «me gusta» en entradas publicadas
  - [x] 8.1 Implementar Server Actions de contenido en `lib/blog/actions.ts`
    - `createComment` (verifica sesión, valida con `validateCommentContent`, guarda con `postId`/`authorId`/`createdAt`, actualiza `commentCount` transaccional), `toggleLikeAction` (doc id = `userId`, actualiza `likeCount` transaccional)
    - _Requirements: 4.2, 4.5, 4.6, 4.7, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 8.2 Implementar `app/blog/[slug]/CommentsSection.tsx` (Client, tiempo real)
    - Suscripción `onSnapshot`; formulario visible solo con sesión, invitación a login si no autenticado; muestra autor y fecha; refleja nuevos comentarios en ≤ 3 s
    - _Requirements: 4.1, 4.3, 4.4, 4.8, 4.9_

  - [x] 8.3 Implementar `app/blog/[slug]/LikeButton.tsx` (Client, tiempo real)
    - Estado activado/desactivado según like del usuario; contador en tiempo real; actualización optimista con rollback ante fallo; invitación a login si no autenticado
    - _Requirements: 5.1, 5.2, 5.3, 5.7, 5.8, 5.9_

  - [x]\* 8.4 Escribir pruebas unitarias de comentarios y «me gusta»
    - Formulario condicionado a sesión, invitación a login, rollback optimista del like
    - _Requirements: 4.1, 4.3, 4.4, 5.1, 5.2, 5.3, 5.8_

- [x] 9. Implementar control de acceso al Panel_Admin
  - [x] 9.1 Implementar `proxy.ts` (raíz) con comprobación optimista de `/admin`
    - Redirige a `/admin/login` cuando no hay indicio de cookie de sesión (no autoritativo)
    - _Requirements: 6.5_

  - [x] 9.2 Implementar `app/admin/layout.tsx` (guard de sesión admin)
    - Verifica en servidor el claim `admin === true` (vía `session.ts`); impide renderizar vistas distintas del login sin claim válido; `export const unstable_instant = false`
    - _Requirements: 6.4, 6.8_

  - [x] 9.3 Implementar `app/admin/login/page.tsx` y acciones de sesión admin
    - Formulario de login admin; `adminLogin`/`adminLogout` en `lib/blog/auth-actions.ts`; mensajes en español de credenciales incorrectas y de acceso no autorizado; redirección al cerrar sesión
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7_

  - [x]\* 9.4 Escribir pruebas de integración de acceso admin (emulador Firebase)
    - Claim concede acceso; ausencia de claim deniega y redirige; logout
    - _Requirements: 6.2, 6.4, 6.5, 6.7, 6.8_

- [x] 10. Implementar el Dashboard con métricas y el mapa de presencia
  - [x] 10.1 Implementar el servicio de presencia en `lib/blog/presence.ts`
    - Registro de conexión con `lastSeen` y ubicación opcional, heartbeat, alta/baja en ≤ 5 s, caducidad > 60 s; lectura admin del conjunto activo
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 10.2 Implementar `app/admin/page.tsx` (Dashboard de 4 métricas)
    - Calcula métricas con `computeDashboardMetrics` sobre `getAdminMetricsData`; indicador de carga por métrica; error por métrica sin valores parciales
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 10.3 Implementar el componente de mapamundi de conectados (Client)
    - Total de conectados (entero ≥ 0) con `activeConnections`; posiciona solo ubicaciones mapeables (`isMappableLocation`); actualización ≤ 5 s; indicación de error y conservación del último conteo si presencia no responde en 10 s
    - _Requirements: 8.1, 8.5, 8.6, 8.7, 8.8_

  - [x]\* 10.4 Escribir pruebas unitarias del dashboard
    - Indicadores de carga, mensajes de error de métrica y de presencia no disponible
    - _Requirements: 7.6, 7.7, 8.8_

- [x] 11. Implementar la gestión de Usuarios (suscriptores) en el Panel_Admin
  - [x] 11.1 Implementar `app/admin/usuarios/page.tsx` y sus acciones
    - Lista con email/rol/fecha; mensaje de vacío; búsqueda con `searchUsersByEmail`; `deleteUser` (Firestore + Auth) y `updateUserRole` en `lib/blog/actions.ts`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x]\* 11.2 Escribir pruebas de la gestión de usuarios (unidad + integración con emulador)
    - Búsqueda insensible a may/min; eliminación en Firestore + Auth; cambio de rol
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 12. Implementar la gestión de Entradas y Categorías en el Panel_Admin
  - [x] 12.1 Implementar Server Actions de entradas en `lib/blog/actions.ts`
    - `createPost` (valida con `validatePost`, estado `borrador`), `updatePost` (conserva estado), `publishPost` (estado `publicada` + fecha actual), `deletePost` (borrado en cascada de comentarios y likes con Admin SDK por lotes)
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.9, 10.12_

  - [x] 12.2 Implementar Server Actions de categorías en `lib/blog/actions.ts`
    - `createCategory` (rechaza duplicado con `isCategoryNameTaken`, guarda `nameLower`), `deleteCategory` (desasocia de `categoryIds` de cada entrada)
    - _Requirements: 10.6, 10.7, 10.8_

  - [x] 12.3 Implementar `app/admin/entradas/page.tsx` (CRUD de entradas y categorías)
    - Lista ordenada por fecha desc con título/estado/fecha/categorías; formularios de creación/edición/publicación/eliminación; mensajes de error en español por campo inválido; mensaje de vacío
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.11, 10.12_

  - [x]\* 12.4 Escribir pruebas de integración de entradas y categorías (emulador Firebase)
    - Persistencia y edición conservando estado, publicación con fecha actual, borrado en cascada, desasociación al borrar categoría, rechazo de nombre duplicado
    - _Requirements: 10.3, 10.4, 10.5, 10.7, 10.8_

- [x] 13. Checkpoint - Panel de administración
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integrar la sección destacada del Blog y el enlace de cabecera
  - [x] 14.1 Implementar `HomeFeaturedBlog` e integrarlo como primera sección de la home
    - Selección con `selectFeatured` (más reciente con mayor tamaño visual + top por comentarios); número responsive con `featuredCountForWidth` (3/2/1); sin huecos de relleno; mensaje en español si no hay entradas
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [x]\* 14.2 Escribir pruebas unitarias de la sección destacada
    - Conteos responsive en los límites 767/768/1023/1024 y entrada destacada principal
    - _Requirements: 11.2, 11.6, 11.7, 11.8_

  - [x] 14.3 Añadir el enlace «Blog» en `app/components/SiteHeader.tsx`
    - Enlace a `/blog` al mismo nivel que «Wiki» en barra horizontal (≥1024) y en el drawer (<1024); estado activo con `isBlogLinkActive`; cierra el drawer tras navegar; sin referencias a `/admin`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 6.6_

  - [x]\* 14.4 Escribir pruebas unitarias de la cabecera
    - Presencia del enlace «Blog» al nivel de «Wiki», estado activo/no activo y ausencia de referencias a `/admin`
    - _Requirements: 12.1, 12.3, 6.6_

- [x] 15. Implementar las Reglas de seguridad de Firestore
  - [x] 15.1 Escribir `firestore.rules`
    - Lectura pública de publicadas y sus comentarios/likes; rechazo de escrituras no autenticadas; propiedad de comentario/like por `userId`; rechazo de modificación de datos ajenos; permisos de admin para entradas/categorías; rechazo de lectura de borradores por no-admin
    - _Requirements: 9.6, 10.10, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [x]\* 15.2 Escribir pruebas de integración de las Reglas de Firestore (emulador)
    - Casos permitidos y denegados para lectura pública, escrituras no autenticadas, propiedad por `userId`, permisos de admin y lectura de borradores
    - _Requirements: 9.6, 10.10, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [x] 16. Actualizar las páginas legales
  - [x] 16.1 Actualizar `app/politica-de-privacidad/page.tsx`
    - Describir sistema de cuentas (Firebase Auth), datos tratados (email, contenido de comentarios), finalidad por categoría, almacenamiento en Firebase, derecho de eliminación, medio de contacto y fecha de última actualización
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [x] 16.2 Actualizar `app/terminos-y-condiciones/page.tsx`
    - Describir condiciones de cuentas, normas de conducta de comentarios, normas de «me gusta», moderación sin previo aviso y fecha de última actualización
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 17. Checkpoint final - Verificación completa
  - Ensure all tests pass, ask the user if questions arise.
  - Ejecutar `npm test` (vitest `--run`) y `npm run build` para validar exportaciones `unstable_instant` y Cache Components; documentar el comando del emulador de Firebase para las pruebas de integración

## Notes

- Las tareas marcadas con `*` son opcionales (pruebas) y pueden omitirse para un MVP más rápido; las tareas de implementación nunca se marcan como opcionales.
- Cada tarea referencia cláusulas concretas de requisitos para trazabilidad.
- Las pruebas basadas en propiedades validan las 16 propiedades universales del diseño con `fast-check` (`{ numRuns: 100 }`) y se etiquetan como `Feature: blog, Property {n}: {texto}`.
- Las pruebas unitarias y de integración cubren UI, servicios de Firebase y Reglas de Firestore (estas últimas con el emulador de Firebase).
- Los checkpoints aseguran validación incremental.
- Antes de cada ruta/layout/componente DEBE consultarse `node_modules/next/dist/docs/` (Next.js 16 modificado).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.6", "2.2", "2.3", "2.4", "2.5"] },
    { "id": 4, "tasks": ["2.10", "2.7", "2.8", "2.9"] },
    { "id": 5, "tasks": ["2.15", "2.11", "2.12", "2.13", "2.14"] },
    { "id": 6, "tasks": ["2.16", "2.17", "2.18", "2.19", "2.20"] },
    {
      "id": 7,
      "tasks": [
        "4.1",
        "6.1",
        "8.1",
        "9.1",
        "10.1",
        "14.3",
        "15.1",
        "16.1",
        "16.2"
      ]
    },
    {
      "id": 8,
      "tasks": [
        "4.3",
        "4.4",
        "4.5",
        "5.1",
        "6.2",
        "9.2",
        "12.1",
        "14.1",
        "4.2",
        "14.4",
        "15.2"
      ]
    },
    {
      "id": 9,
      "tasks": [
        "6.3",
        "8.2",
        "8.3",
        "9.3",
        "10.2",
        "10.3",
        "12.2",
        "4.6",
        "5.2",
        "14.2"
      ]
    },
    { "id": 10, "tasks": ["11.1", "12.3", "6.4", "8.4", "9.4", "10.4"] },
    { "id": 11, "tasks": ["11.2", "12.4"] }
  ]
}
```
