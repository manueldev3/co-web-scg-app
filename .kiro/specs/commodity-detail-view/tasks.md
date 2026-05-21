# Plan de Implementación: Vista de Detalle de Mercancía

## Resumen

Implementar la vista de detalle de mercancía como experiencia de página única dentro del App Router de Next.js. Se refactoriza la estructura existente para usar un layout compartido con buscador persistente, navegación invisible con `router.push`, y Server Components para fetch de datos. Se crean funciones puras de utilidad con property-based testing usando `fast-check`.

## Tareas

- [x] 1. Crear tipos compartidos y funciones utilitarias
  - [x] 1.1 Crear `app/mercancia/types.ts` con las interfaces TypeScript
    - Definir `ApiCommodity`, `ApiPriceRecord`, `CommodityOption`, `TerminalPriceRecord`, `CommodityDetailData`
    - _Requisitos: 2.1, 2.2, 4.2, 5.2, 6.2_

  - [x] 1.2 Crear `app/mercancia/utils.ts` con funciones puras de transformación
    - Implementar `buildHierarchicalLocation(record)`: construye cadena de ubicación concatenando campos no nulos separados por " > "
    - Implementar `formatPrice(price)`: formatea número con separador de miles y decimales, sufijo " UEC"
    - Implementar `formatStock(available, max?)`: formatea stock como "{disponible} / {máximo} SCU" o "{disponible} SCU"
    - Implementar `separateRecords(data)`: separa registros en sellers (price_buy > 0) y buyers (price_sell > 0), con ordenamiento correcto
    - Implementar `slugToName(slug)`: convierte slug a nombre legible
    - _Requisitos: 2.2, 4.1, 4.3, 5.1, 5.3, 6.2, 6.3, 7.1, 7.2, 7.3_

  - [x] 1.3 Configurar Vitest y fast-check para testing
    - Instalar `vitest` y `fast-check` como devDependencies
    - Crear configuración de Vitest (`vitest.config.ts`)
    - Agregar script `"test"` en package.json
    - _Requisitos: Infraestructura de testing_

  - [x] 1.4 Escribir property test para separación de registros
    - **Propiedad 1: Separación correcta de registros**
    - Generar listas aleatorias de `ApiPriceRecord` con `price_buy` y `price_sell` aleatorios (incluyendo 0)
    - Verificar: todos en sellers tienen price_buy > 0, todos en buyers tienen price_sell > 0, no hay registros faltantes
    - **Valida: Requisitos 2.2, 4.1, 5.1**

  - [x] 1.5 Escribir property test para construcción de ubicación jerárquica
    - **Propiedad 2: Construcción de ubicación jerárquica**
    - Generar objetos con 7 campos de ubicación, cada uno `string | null` aleatorio
    - Verificar: contiene exactamente valores no nulos, separados por " > ", sin segmentos vacíos, orden preservado
    - **Valida: Requisitos 6.2, 6.3**

  - [x] 1.6 Escribir property test para formato de precios
    - **Propiedad 3: Formato de precios**
    - Generar números flotantes no negativos
    - Verificar: termina con " UEC", separadores de miles correctos, round-trip numérico
    - **Valida: Requisitos 7.1**

  - [x] 1.7 Escribir property test para formato de stock
    - **Propiedad 4: Formato de stock y demanda**
    - Generar pares `(number, number | null)`
    - Verificar: formato correcto según presencia de máximo, separadores de miles
    - **Valida: Requisitos 7.2, 7.3**

  - [x] 1.8 Escribir property test para ordenamiento de registros
    - **Propiedad 5: Ordenamiento correcto de registros**
    - Generar listas de registros con precios aleatorios
    - Verificar: sellers ordenados por price_buy ASC, buyers ordenados por price_sell DESC
    - **Valida: Requisitos 4.3, 5.3**

- [x] 2. Checkpoint - Verificar funciones utilitarias
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 3. Crear layout compartido y refactorizar buscador
  - [x] 3.1 Crear `app/mercancia/layout.tsx` (Server Component)
    - Fetch de commodities desde `GET /commodities` de la API UEX
    - Extraer `id`, `name`, `slug` de cada commodity para el buscador
    - Renderizar componente `Mercancia` (buscador) + `{children}`
    - Pasar `initialSlug` derivado de la URL actual al buscador
    - _Requisitos: 1.1, 1.3_

  - [x] 3.2 Refactorizar `app/mercancia/Mercancia.tsx` (Client Component)
    - Agregar prop `initialSlug?: string` para pre-llenar el buscador en acceso directo
    - Agregar `slug` al tipo `CommodityOption`
    - Implementar `onSelect`: llamar `router.push('/mercancia/${slug}')` al seleccionar
    - Implementar `onClear`: llamar `router.push('/mercancia')` al limpiar
    - Pre-llenar el input con el nombre correspondiente cuando `initialSlug` está presente
    - _Requisitos: 1.1, 1.2, 1.3, 1.5, 1.7_

  - [x] 3.3 Refactorizar `app/mercancia/page.tsx` (Server Component)
    - Eliminar el fetch de commodities (ahora está en layout)
    - Convertir en página simple que muestra mensaje de bienvenida invitando a buscar
    - No mostrar tablas ni datos
    - _Requisitos: 1.4_

- [x] 4. Implementar vista de detalle de mercancía
  - [x] 4.1 Completar `app/mercancia/[name]/page.tsx` (Server Component)
    - Fetch de precios desde `GET /commodities_prices?commodity_slug={slug}`
    - Usar `separateRecords` para procesar la respuesta
    - Manejar errores: mostrar mensaje si API falla o retorna vacío
    - Renderizar `<DetalleMercancia>` con datos procesados
    - Eliminar `MercanciaPorNombre.tsx` (reemplazado por DetalleMercancia)
    - _Requisitos: 2.1, 2.2, 2.3, 3.1, 3.2, 8.1, 8.2_

  - [x] 4.2 Crear `app/mercancia/TablaPrecios.tsx` (Client Component)
    - Implementar tabla reutilizable con Ant Design Table
    - Columnas para tipo "sellers": Terminal, Ubicación, Precio Compra (UEC), Stock (SCU)
    - Columnas para tipo "buyers": Terminal, Ubicación, Precio Venta (UEC), Demanda (SCU)
    - Usar `formatPrice` y `formatStock` de utils para formatear valores
    - Usar `buildHierarchicalLocation` para la columna de ubicación
    - Mostrar `emptyMessage` cuando no hay registros
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_

  - [x] 4.3 Crear `app/mercancia/DetalleMercancia.tsx` (Client Component)
    - Recibir props: `commodityName`, `sellers`, `buyers`
    - Renderizar título con nombre de la mercancía (h1)
    - Renderizar `<TablaPrecios>` para vendedores con título "Vendido por" y orden ASC
    - Renderizar `<TablaPrecios>` para compradores con título "Comprado por" y orden DESC
    - _Requisitos: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

  - [x] 4.4 Escribir unit tests para componentes de detalle
    - Test: mercancía sin vendedores muestra mensaje vacío
    - Test: mercancía sin compradores muestra mensaje vacío
    - Test: datos válidos renderizan tablas correctamente
    - _Requisitos: 4.4, 5.4_

- [x] 5. Integración y cableado final
  - [x] 5.1 Verificar flujo completo de navegación
    - Asegurar que seleccionar en buscador navega a `/mercancia/{slug}` sin recarga
    - Asegurar que acceso directo por URL pre-llena buscador y muestra datos
    - Asegurar que limpiar buscador vuelve a `/mercancia` con mensaje de bienvenida
    - Verificar indicador de carga (Suspense/loading) durante fetch
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.7, 8.1, 8.2_

  - [x] 5.2 Escribir tests de integración
    - Test: navegación buscador → detalle actualiza URL y muestra datos
    - Test: acceso directo por URL carga datos correctamente
    - Test: API retorna error muestra mensaje apropiado
    - _Requisitos: 1.2, 1.3, 2.3_

- [x] 6. Checkpoint final - Verificar implementación completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud definidas en el diseño
- Los unit tests validan ejemplos específicos y edge cases
- Se usa TypeScript para toda la implementación, consistente con el stack del proyecto
