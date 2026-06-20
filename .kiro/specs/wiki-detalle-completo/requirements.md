# Requirements Document

## Introduction

Esta funcionalidad es una **mejora incremental** de la wiki existente (spec `wiki`). Enriquece la pantalla de **Detalle_Elemento** —hoy el detalle de nave en `/wiki/naves/[slug]`— para que muestre información completa procedente de la API pública de UEX Corp (`https://api.uexcorp.uk/2.0`, sin autenticación), y **generaliza** el modelo de detalle `WikiDetail` en un conjunto de **secciones componibles** reutilizables por las categorías futuras de la wiki.

El alcance de la mejora cubre, para el Detalle_Elemento de una Nave:

- **Modelo de detalle genérico y componible**: el `WikiDetail` deja de ser una lista plana de campos y pasa a ser una lista ordenada de **Seccion_Detalle** tipadas (grupo de campos, galería de imágenes, tabla de precios, enlaces externos), de modo que añadir o reordenar bloques en categorías futuras no requiera rediseñar la página de detalle.
- **Precios y ubicaciones de compra y alquiler en el juego (aUEC)**: lugares y precios de compra (`/vehicles_purchases_prices_all`) y de alquiler (`/vehicles_rentals_prices_all`), con el nombre completo de la ubicación resuelto contra `/terminals`. La API no expone precio en dinero real (USD).
- **Ficha técnica ampliada**: más campos de clasificación e información técnica de `/vehicles` (dimensiones, masa, combustible, plataforma de aterrizaje, versión del juego), mostrando **únicamente datos de UEX**, sin texto narrativo ni lore.
- **Galería de imágenes**: imagen principal y galería a partir de `url_photo` y `url_photos` (un array codificado como JSON).
- **Enlaces externos oficiales**: `url_store`, `url_brochure`, `url_video`, `url_hotsite`.

La mejora **conserva** las convenciones del Cliente_UEX ya establecidas (público sin autenticación, `Accept: application/json`, nunca lanza, devuelve `[]` en error, `next: { revalidate }` de ~1h para listados, agregación con `Promise.allSettled`, preferencia por endpoints masivos `*_all`), el marcador de Dato_Faltante y los estados vacíos / "no encontrado".

El layout es una **mejora incremental** del detalle actual (se añaden los bloques de galería, precios y enlaces), **no** un rediseño ni un clon de starcitizen.tools.

El proyecto es Next.js (App Router) **modificado**: antes de escribir rutas, layouts, componentes o llamadas de datos se debe consultar `node_modules/next/dist/docs/` según la regla de `AGENTS.md`.

## Glossary

Términos heredados de la spec `wiki` (se mantienen con el mismo significado):

- **Wiki**: Conjunto de páginas bajo la ruta `/wiki` que muestran información de referencia del universo de Star Citizen procedente de UEX Corp.
- **Categoria_Wiki**: Clasificación de contenido de la wiki (p. ej. "naves"). En la entrega actual solo está activa la categoría "naves".
- **Registro_Categorias**: Estructura de configuración declarativa que define las Categoria_Wiki disponibles y sus adaptadores de datos y presentación.
- **Detalle_Elemento**: Página que muestra la información completa de un único elemento de una Categoria_Wiki (en la entrega actual, el detalle de una Nave en `/wiki/naves/[slug]`).
- **Nave**: Elemento de la categoría "naves" correspondiente a un registro de `/vehicles` con `is_spaceship` activo.
- **Cliente_UEX**: Módulo `uex-api.ts` de la wiki que realiza las llamadas a la API_UEX siguiendo las convenciones del repositorio (sin `Authorization`, `Accept: application/json`, `next: { revalidate }`, nunca lanza y devuelve `[]` en error).
- **API_UEX**: API pública de UEX Corp 2.0 en `https://api.uexcorp.uk/2.0`.
- **Documentacion_Next**: Documentación local del framework en `node_modules/next/dist/docs/` que debe consultarse antes de escribir código de Next.js.
- **Dato_Faltante**: Campo de un elemento cuyo valor es `null`, `undefined` o ausente en la respuesta de la API_UEX. Las cadenas vacías y los valores cero NO se consideran Dato_Faltante y se muestran tal cual.

Términos nuevos de esta mejora:

- **Modelo_Detalle**: Estructura `WikiDetail` generalizada que representa el detalle de cualquier elemento de la wiki como un título, un subtítulo y una lista ordenada de Seccion_Detalle.
- **Seccion_Detalle**: Unidad componible del Modelo_Detalle. Cada Seccion_Detalle es de exactamente uno de los Tipo_Bloque definidos y se renderiza de forma independiente del resto.
- **Tipo_Bloque**: Conjunto cerrado de tipos de sección componible: **Bloque_Grupo_Campos** (grupo de pares etiqueta-valor), **Bloque_Galeria** (imagen principal y galería), **Bloque_Precios** (tabla de ubicaciones y precios) y **Bloque_Enlaces** (enlaces externos).
- **Bloque_Grupo_Campos**: Seccion_Detalle que agrupa un conjunto ordenado de campos etiqueta-valor (la ficha técnica y la clasificación de la Nave).
- **Bloque_Galeria**: Seccion_Detalle que muestra la imagen principal y la galería de imágenes de un elemento.
- **Bloque_Precios**: Seccion_Detalle que muestra una tabla de ubicaciones con sus precios en aUEC para una operación (compra o alquiler).
- **Bloque_Enlaces**: Seccion_Detalle que muestra enlaces externos oficiales.
- **Precio_Compra**: Precio en aUEC al que una Nave puede comprarse en una Ubicacion_Juego, procedente de `/vehicles_purchases_prices_all` (campo `price_buy`).
- **Precio_Alquiler**: Precio en aUEC al que una Nave puede alquilarse en una Ubicacion_Juego, procedente de `/vehicles_rentals_prices_all` (campo `price_rent`).
- **aUEC**: Moneda del juego (alpha United Earth Credit) en la que se expresan los precios de compra y alquiler. La API_UEX no expone precio en dinero real (USD).
- **Ubicacion_Juego**: Lugar del juego identificado por `id_terminal`, cuyo nombre completo se resuelve contra el endpoint `/terminals`.
- **Galeria_Imagenes**: Conjunto de imágenes de una Nave derivado de `url_photo` (imagen principal) y `url_photos` (un array de URLs codificado como cadena JSON).
- **Ficha_Tecnica**: Conjunto de campos técnicos y de clasificación de una Nave provistos por `/vehicles` (p. ej. dimensiones, masa, combustible, plataforma de aterrizaje, versión del juego, indicadores `is_*`).
- **Enlaces_Externos**: Enlaces oficiales de una Nave provistos por `/vehicles`: `url_store`, `url_brochure`, `url_video`, `url_hotsite`.

## Requirements

### Requirement 1: Modelo de detalle genérico y componible

**User Story:** Como desarrollador, quiero que el detalle de un elemento se exprese como una lista ordenada de secciones componibles tipadas, para poder reutilizar el mismo modelo y la misma página de detalle en categorías futuras sin rediseñarlos.

#### Acceptance Criteria

1. THE Modelo_Detalle SHALL representar el detalle de un elemento mediante un título, un subtítulo y una lista ordenada de Seccion_Detalle.
2. THE Modelo_Detalle SHALL admitir que cada Seccion_Detalle sea de exactamente uno de los Tipo_Bloque definidos: Bloque_Grupo_Campos, Bloque_Galeria, Bloque_Precios o Bloque_Enlaces.
3. WHEN el Detalle_Elemento renderiza un Modelo_Detalle, THE Detalle_Elemento SHALL renderizar las Seccion_Detalle en el orden en que aparecen en la lista.
4. WHEN el Detalle_Elemento renderiza una Seccion_Detalle, THE Detalle_Elemento SHALL seleccionar la presentación correspondiente al Tipo_Bloque de esa Seccion_Detalle.
5. WHERE una categoría de la wiki define el conjunto y el orden de sus Seccion_Detalle, THE Detalle_Elemento SHALL renderizar ese detalle sin requerir cambios en la página de detalle ni en las presentaciones de cada Tipo_Bloque.
6. THE Modelo_Detalle SHALL conservar el título de la Nave (nombre completo) y el subtítulo (empresa fabricante) que muestra el Detalle_Elemento actual.
7. THE Detalle_Elemento SHALL conservar el control de navegación de regreso al Listado_Categoria de la Nave.

### Requirement 2: Ficha técnica ampliada y clasificación

**User Story:** Como visitante, quiero ver la ficha técnica completa de la Nave con sus datos de clasificación y especificación, para conocer toda la información que UEX Corp expone sobre la Nave.

#### Acceptance Criteria

1. WHEN una persona usuaria visita el Detalle_Elemento de una Nave existente, THE Detalle_Elemento SHALL mostrar un Bloque_Grupo_Campos con la Ficha_Tecnica de la Nave.
2. THE Bloque_Grupo_Campos de la Ficha_Tecnica SHALL incluir los campos de capacidad de carga (`scu`), tripulación (`crew`), tipo de plataforma de aterrizaje (`pad_type`) y tamaños de contenedor (`container_sizes`) que ya muestra el Detalle_Elemento actual.
3. THE Bloque_Grupo_Campos de la Ficha_Tecnica SHALL incluir los campos de dimensiones físicas de la Nave: masa, longitud, anchura y altura provistos por `/vehicles`.
4. THE Bloque_Grupo_Campos de la Ficha_Tecnica SHALL incluir los campos de combustible cuántico (`fuel_quantum`) e hidrógeno (`fuel_hydrogen`) y la versión del juego (`game_version`) provistos por `/vehicles`.
5. THE Detalle*Elemento SHALL mostrar todas las clasificaciones activas de la Nave a partir de sus indicadores `is*\*`, incluyendo los indicadores adicionales que `/vehicles`expone además de`is_spaceship`, `is_cargo`e`is_ground_vehicle`.
6. WHERE el campo `container_sizes` contiene una cadena separada por comas, THE Detalle_Elemento SHALL mostrar los tamaños como una lista de valores numéricos legibles.
7. IF un campo de la Ficha_Tecnica es un Dato_Faltante, THEN THE Detalle_Elemento SHALL mostrar el marcador de "dato no disponible" para ese campo en lugar de "null" o "undefined".
8. THE Detalle_Elemento SHALL mostrar únicamente datos provistos por la API_UEX, sin incluir texto narrativo ni descripción de lore.

### Requirement 3: Galería de imágenes

**User Story:** Como visitante, quiero ver imágenes de la Nave en su detalle, para reconocerla visualmente.

#### Acceptance Criteria

1. WHERE la Nave tiene una imagen principal en `url_photo`, THE Detalle_Elemento SHALL mostrar un Bloque_Galeria con esa imagen principal.
2. WHERE la Nave tiene imágenes adicionales en `url_photos`, THE Detalle_Elemento SHALL decodificar la cadena JSON de `url_photos` en una lista de URLs y mostrarlas en la Galeria_Imagenes.
3. IF el campo `url_photos` es un Dato_Faltante, una cadena vacía o una cadena JSON no válida, THEN THE Detalle_Elemento SHALL tratar la lista de imágenes adicionales como vacía sin propagar un error.
4. IF la Nave no tiene imagen principal ni imágenes adicionales, THEN THE Detalle_Elemento SHALL omitir el Bloque_Galeria.
5. THE Bloque_Galeria SHALL incluir un texto alternativo para cada imagen basado en el nombre de la Nave.

### Requirement 4: Ubicaciones y precios de compra y alquiler en aUEC

**User Story:** Como visitante, quiero ver dónde comprar o alquilar la Nave en el juego y a qué precio en aUEC, para saber a qué ubicación acudir.

#### Acceptance Criteria

1. WHEN una persona usuaria visita el Detalle_Elemento de una Nave existente, THE Detalle_Elemento SHALL solicitar al Cliente_UEX los precios de compra desde `/vehicles_purchases_prices_all` y los precios de alquiler desde `/vehicles_rentals_prices_all`.
2. WHERE la Nave tiene precios de compra, THE Detalle_Elemento SHALL mostrar un Bloque_Precios de compra con una fila por cada Ubicacion_Juego, indicando el nombre de la Ubicacion_Juego y el Precio_Compra en aUEC.
3. WHERE la Nave tiene precios de alquiler, THE Detalle_Elemento SHALL mostrar un Bloque_Precios de alquiler con una fila por cada Ubicacion_Juego, indicando el nombre de la Ubicacion_Juego y el Precio_Alquiler en aUEC.
4. THE Cliente_UEX SHALL resolver el nombre completo de cada Ubicacion_Juego asociando el `id_terminal` de la fila de precio con el registro correspondiente de `/terminals`.
5. IF el `id_terminal` de una fila de precio no tiene un registro coincidente en `/terminals`, THEN THE Detalle_Elemento SHALL mostrar el `terminal_name` provisto por la fila de precio como nombre de la Ubicacion_Juego.
6. THE Detalle_Elemento SHALL filtrar las filas de precios para mostrar únicamente las que corresponden al `id_vehicle` de la Nave del detalle.
7. IF la Nave no tiene filas de precios de compra, THEN THE Detalle_Elemento SHALL omitir el Bloque_Precios de compra.
8. IF la Nave no tiene filas de precios de alquiler, THEN THE Detalle_Elemento SHALL omitir el Bloque_Precios de alquiler.
9. THE Detalle_Elemento SHALL expresar los importes de Precio_Compra y Precio_Alquiler en aUEC, sin mostrar precio en dinero real.

### Requirement 5: Enlaces externos oficiales

**User Story:** Como visitante, quiero acceder a los enlaces oficiales de la Nave, para ampliar información en las fuentes externas.

#### Acceptance Criteria

1. WHERE la Nave tiene al menos un Enlace_Externo entre `url_store`, `url_brochure`, `url_video` y `url_hotsite`, THE Detalle_Elemento SHALL mostrar un Bloque_Enlaces con los enlaces disponibles.
2. THE Bloque_Enlaces SHALL mostrar cada Enlace_Externo con una etiqueta que identifica su tipo (tienda, folleto, vídeo o hotsite).
3. WHEN una persona usuaria selecciona un Enlace_Externo, THE Bloque_Enlaces SHALL abrir el enlace en una pestaña o ventana nueva del navegador.
4. IF un campo de Enlace_Externo es un Dato_Faltante o una cadena vacía, THEN THE Detalle_Elemento SHALL omitir ese Enlace_Externo del Bloque_Enlaces.
5. IF la Nave no tiene ningún Enlace_Externo disponible, THEN THE Detalle_Elemento SHALL omitir el Bloque_Enlaces.

### Requirement 6: Agregación de datos resiliente

**User Story:** Como desarrollador, quiero que el detalle agregue varias fuentes de datos de UEX siguiendo las convenciones del repositorio, para mantener la web operativa ante fallos parciales y respetar los límites de la API.

#### Acceptance Criteria

1. THE Cliente_UEX SHALL realizar las solicitudes a `/vehicles`, `/vehicles_purchases_prices_all`, `/vehicles_rentals_prices_all` y `/terminals` con la cabecera `Accept: application/json` y sin cabecera `Authorization`.
2. THE Cliente_UEX SHALL preferir los endpoints masivos `*_all` para los precios de compra y alquiler, evitando un patrón de una solicitud por Nave.
3. THE Cliente_UEX SHALL configurar el almacenamiento en caché de las solicitudes mediante `next: { revalidate: <segundos> }` con una vigencia comprendida entre 3300 y 3900 segundos (aproximadamente una hora).
4. THE Cliente_UEX SHALL leer los datos desde `json.data` y devolver una lista vacía cuando `json.data` está ausente.
5. IF una solicitud a la API_UEX lanza una excepción o devuelve un estado distinto de 2xx, THEN THE Cliente_UEX SHALL registrar el error y devolver una lista vacía sin propagar la excepción.
6. WHEN el Detalle_Elemento combina los datos de la Nave, los precios de compra, los precios de alquiler y las ubicaciones, THE Cliente_UEX SHALL agregar los conjuntos de datos con `Promise.allSettled` de modo que el fallo de un origen no impida mostrar los demás.
7. IF el origen de precios de compra o de alquiler devuelve una lista vacía, THEN THE Detalle_Elemento SHALL mostrar el resto del detalle de la Nave sin el Bloque_Precios correspondiente.

### Requirement 7: Manejo de datos faltantes y estados vacíos del detalle

**User Story:** Como visitante, quiero que el detalle se muestre de forma coherente cuando faltan datos o el elemento no existe, para no encontrar valores técnicos crudos ni pantallas rotas.

#### Acceptance Criteria

1. IF la Nave solicitada no existe en los datos del Cliente_UEX, THEN THE Detalle_Elemento SHALL mostrar un estado de "no encontrado".
2. IF un campo de la Nave es un Dato_Faltante, THEN THE Detalle_Elemento SHALL mostrar el marcador de "dato no disponible" en lugar de "null" o "undefined".
3. WHERE el valor de un campo de la Nave es una cadena vacía o el número cero, THE Detalle_Elemento SHALL mostrar ese valor tal cual, sin aplicar el marcador de Dato_Faltante.
4. WHERE una Seccion_Detalle no tiene contenido para la Nave, THE Detalle_Elemento SHALL omitir esa Seccion_Detalle en lugar de mostrar una sección vacía.
5. THE Detalle_Elemento SHALL mostrar al menos la Ficha_Tecnica y las clasificaciones de la Nave aunque las demás Seccion_Detalle se omitan por falta de datos.

### Requirement 8: Cumplimiento del framework Next.js

**User Story:** Como desarrollador, quiero que la mejora respete la versión modificada de Next.js del proyecto, para evitar usar APIs o convenciones obsoletas.

#### Acceptance Criteria

1. BEFORE escribir o modificar rutas, layouts, componentes o llamadas de datos del Detalle_Elemento, THE equipo de desarrollo SHALL consultar la Documentacion_Next en `node_modules/next/dist/docs/`.
2. THE Detalle_Elemento SHALL resolver el segmento dinámico `params` siguiendo el modelo de `Promise` de esta versión de Next.js descrito en la Documentacion_Next.
3. WHERE la Documentacion_Next marca una API o convención como obsoleta, THE Detalle_Elemento SHALL evitar su uso y emplear la alternativa vigente documentada.
