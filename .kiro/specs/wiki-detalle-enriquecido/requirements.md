# Requirements Document

## Introduction

Esta funcionalidad es una **mejora incremental** de la wiki que extiende el detalle de elemento ya enriquecido por la spec `wiki-detalle-completo`. Mientras que `wiki` aportó el detalle básico de nave (`/wiki/naves/[slug]`) y `wiki-detalle-completo` añadió, sobre un **modelo de detalle componible** (secciones tipadas), la ficha técnica ampliada, la galería de imágenes, los precios y ubicaciones de compra/alquiler en aUEC y los enlaces externos oficiales, esta mejora cubre la **única pieza que ambas specs dejaron fuera de forma explícita**: un **texto descriptivo / resumen** (al estilo de la descripción/lore de páginas como `https://starcitizen.tools/Hull_C`), presentado como un nuevo tipo de sección componible.

El alcance de esta mejora es deliberadamente acotado y **no duplica** lo ya cubierto por `wiki-detalle-completo`:

- **Nuevo bloque de descripción**: se incorpora un **Bloque_Descripcion** como nuevo Tipo_Bloque del Modelo_Detalle, que muestra un texto descriptivo del elemento. Se integra en el orden de secciones existente sin rediseñar la página de detalle ni las presentaciones de los demás bloques (galería, ficha técnica, precios, enlaces).
- **Fuente enchufable por categoría**: la API_UEX **no expone** texto narrativo ni lore. Por ello la descripción se obtiene de un **Proveedor_Descripcion** declarado por cada Categoria_Wiki en el Registro_Categorias. En la entrega actual (naves), la fuente es **texto curado manualmente** en el propio código (Descripcion_Curada), sin introducir dependencias de APIs externas nuevas. La abstracción permite, a futuro, conectar otra fuente para esa u otras categorías sin rediseñar la página.
- **Extensibilidad a cualquier categoría**: la solución es genérica para que **cualquier** Categoria_Wiki futura (no solo naves) pueda presentar este enriquecimiento (descripción + las secciones ya existentes de ficha, precios, ubicaciones, galería y enlaces) declarando su configuración en el Registro_Categorias, siguiendo el principio de extensibilidad ya establecido.
- **Manejo coherente de datos faltantes**: si una categoría no define proveedor o el proveedor no aporta texto para un elemento, el Detalle_Elemento omite el Bloque_Descripcion sin romper la página, reutilizando el patrón de estados vacíos y de Dato_Faltante ya existentes.

La mejora **conserva** las convenciones del Cliente_UEX ya establecidas (público sin autenticación, `Accept: application/json`, nunca lanza, devuelve `[]` en error, `next: { revalidate }` de ~1h para listados, agregación con `Promise.allSettled`, preferencia por endpoints masivos `*_all`) y el marcador de Dato_Faltante. La resolución del Proveedor_Descripcion se integra en la agregación del detalle de forma resiliente, de modo que su ausencia o fallo no impide mostrar el resto del detalle.

El layout es una **mejora incremental** del detalle actual (se añade un bloque), **no** un rediseño ni un clon de starcitizen.tools.

El proyecto es Next.js (App Router) **modificado** (versión 16.x): antes de escribir o modificar rutas, layouts, componentes o llamadas de datos se debe consultar `node_modules/next/dist/docs/` según la regla de `AGENTS.md`.

## Glossary

Términos heredados de las specs `wiki` y `wiki-detalle-completo` (se mantienen con el mismo significado):

- **Wiki**: Conjunto de páginas bajo la ruta `/wiki` que muestran información de referencia del universo de Star Citizen procedente de UEX Corp.
- **Categoria_Wiki**: Clasificación de contenido de la wiki (p. ej. "naves"). En la entrega actual solo está activa la categoría "naves".
- **Registro_Categorias**: Estructura de configuración declarativa que define las Categoria_Wiki disponibles y, por cada una, sus adaptadores de datos y de presentación. Es el punto de extensión que permite añadir categorías nuevas.
- **Detalle_Elemento**: Página que muestra la información completa de un único elemento de una Categoria_Wiki (en la entrega actual, el detalle de una Nave en `/wiki/naves/[slug]`).
- **Nave**: Elemento de la categoría "naves" correspondiente a un registro de `/vehicles` con `is_spaceship` activo.
- **Cliente_UEX**: Módulo `uex-api.ts` de la wiki que realiza las llamadas a la API_UEX siguiendo las convenciones del repositorio (sin `Authorization`, `Accept: application/json`, `next: { revalidate }`, nunca lanza y devuelve `[]` en error).
- **API_UEX**: API pública de UEX Corp 2.0 en `https://api.uexcorp.uk/2.0`. No expone texto narrativo ni descripción de lore.
- **Documentacion_Next**: Documentación local del framework en `node_modules/next/dist/docs/` que debe consultarse antes de escribir código de Next.js.
- **Dato_Faltante**: Campo de un elemento cuyo valor es `null`, `undefined` o ausente en la fuente de datos. Las cadenas vacías y los valores cero NO se consideran Dato_Faltante por sí mismos.
- **Modelo_Detalle**: Estructura `WikiDetail` que representa el detalle de cualquier elemento de la wiki como un título, un subtítulo y una lista ordenada de Seccion_Detalle.
- **Seccion_Detalle**: Unidad componible del Modelo_Detalle. Cada Seccion_Detalle es de exactamente uno de los Tipo_Bloque definidos y se renderiza de forma independiente del resto.
- **Tipo_Bloque**: Conjunto de tipos de sección componible del Modelo_Detalle. Antes de esta mejora: Bloque_Grupo_Campos, Bloque_Galeria, Bloque_Precios y Bloque_Enlaces.

Términos nuevos de esta mejora:

- **Bloque_Descripcion**: Nuevo Tipo_Bloque del Modelo_Detalle que muestra un texto descriptivo (resumen/lore) de un elemento de la wiki.
- **Texto_Descripcion**: Cadena de texto descriptivo asociada a un elemento, compuesta por uno o varios párrafos, destinada a mostrarse en el Bloque_Descripcion.
- **Proveedor_Descripcion**: Función declarada por una Categoria_Wiki en el Registro_Categorias que, dado un elemento, resuelve su Texto_Descripcion (o indica su ausencia). Es resiliente: nunca lanza y devuelve ausencia cuando no hay texto.
- **Descripcion_Curada**: Fuente de Texto_Descripcion mantenida manualmente dentro del propio código del proyecto, asociada a los elementos de una Categoria_Wiki por su identificador (slug). Es la fuente que usa el Proveedor_Descripcion de la categoría "naves" en esta entrega.

## Requirements

### Requirement 1: Bloque de descripción en el detalle

**User Story:** Como visitante, quiero ver un texto descriptivo del elemento en su detalle, para conocer de qué se trata más allá de sus datos técnicos y precios.

#### Acceptance Criteria

1. THE Tipo_Bloque SHALL incluir el Bloque_Descripcion como tipo de Seccion_Detalle adicional a Bloque_Grupo_Campos, Bloque_Galeria, Bloque_Precios y Bloque_Enlaces.
2. WHEN una persona usuaria visita el Detalle_Elemento de un elemento que tiene Texto_Descripcion disponible, THE Detalle_Elemento SHALL mostrar un Bloque_Descripcion con ese Texto_Descripcion.
3. WHEN el Detalle_Elemento renderiza un Modelo_Detalle que incluye un Bloque_Descripcion, THE Detalle_Elemento SHALL renderizar el Bloque_Descripcion en la posición que ocupa dentro de la lista ordenada de Seccion_Detalle.
4. WHERE el Texto_Descripcion contiene varios párrafos, THE Bloque_Descripcion SHALL mostrar cada párrafo como una unidad de texto separada y legible.
5. THE Bloque_Descripcion SHALL mostrar el Texto_Descripcion como texto plano, sin interpretar su contenido como marcado ejecutable.
6. THE Detalle_Elemento SHALL conservar las Seccion_Detalle existentes (Bloque_Grupo_Campos, Bloque_Galeria, Bloque_Precios y Bloque_Enlaces) y su comportamiento sin alterarlos al incorporar el Bloque_Descripcion.

### Requirement 2: Proveedor de descripción enchufable por categoría

**User Story:** Como desarrollador, quiero que cada categoría declare de dónde obtiene la descripción de sus elementos, para poder enriquecer cualquier categoría con texto descriptivo sin rediseñar la página de detalle.

#### Acceptance Criteria

1. THE Registro_Categorias SHALL permitir que cada Categoria_Wiki declare un Proveedor_Descripcion que resuelve el Texto_Descripcion de un elemento de esa categoría.
2. WHERE una Categoria_Wiki declara un Proveedor_Descripcion y el proveedor resuelve un Texto_Descripcion no vacío para un elemento, THE Detalle_Elemento SHALL incluir un Bloque_Descripcion con ese Texto_Descripcion sin requerir cambios en la página de detalle ni en las presentaciones de los demás Tipo_Bloque.
3. WHERE una Categoria_Wiki no declara un Proveedor_Descripcion, THE Detalle_Elemento SHALL omitir el Bloque_Descripcion para los elementos de esa categoría.
4. IF el Proveedor_Descripcion no resuelve Texto_Descripcion para un elemento, o resuelve un Dato_Faltante o una cadena vacía o compuesta únicamente de espacios en blanco, THEN THE Detalle_Elemento SHALL omitir el Bloque_Descripcion de ese elemento en lugar de mostrar una sección vacía o un marcador de Dato_Faltante.
5. THE Proveedor_Descripcion SHALL resolver el Texto_Descripcion de un elemento sin lanzar excepciones, devolviendo la ausencia de descripción cuando no dispone de texto.

### Requirement 3: Descripción curada de naves

**User Story:** Como editor de contenido, quiero mantener manualmente las descripciones de las naves dentro del proyecto, para enriquecer el detalle sin depender de una API que no provee ese texto.

#### Acceptance Criteria

1. THE Proveedor_Descripcion de la categoría "naves" SHALL obtener el Texto_Descripcion de cada Nave desde la Descripcion_Curada mantenida dentro del código del proyecto.
2. THE Descripcion_Curada SHALL asociar cada Texto_Descripcion al identificador (slug) de la Nave correspondiente.
3. WHERE la Descripcion_Curada contiene un Texto_Descripcion para el slug de la Nave del detalle, THE Proveedor_Descripcion SHALL devolver ese Texto_Descripcion.
4. IF la Descripcion_Curada no contiene una entrada para el slug de la Nave del detalle, THEN THE Proveedor_Descripcion SHALL devolver la ausencia de descripción.
5. THE Proveedor_Descripcion de la categoría "naves" SHALL obtener el Texto_Descripcion sin realizar solicitudes a la API_UEX ni a ninguna fuente externa nueva.

### Requirement 4: Integración resiliente de la descripción en el detalle

**User Story:** Como desarrollador, quiero que la resolución de la descripción se integre en la agregación del detalle siguiendo las convenciones del repositorio, para que su ausencia o fallo no rompa la página.

#### Acceptance Criteria

1. WHEN el Detalle_Elemento compone el Modelo_Detalle de un elemento, THE Detalle_Elemento SHALL resolver el Texto_Descripcion mediante el Proveedor_Descripcion de la categoría del elemento.
2. WHERE el Detalle_Elemento combina la resolución de la descripción con las demás fuentes de datos del detalle, THE Detalle_Elemento SHALL agregar los resultados de modo que la ausencia o el fallo de la resolución de la descripción no impida mostrar las demás Seccion_Detalle.
3. IF la resolución del Texto_Descripcion falla, THEN THE Detalle_Elemento SHALL mostrar el resto del detalle del elemento sin el Bloque_Descripcion.
4. THE incorporación del Proveedor_Descripcion SHALL conservar las convenciones del Cliente_UEX existentes para las solicitudes a la API_UEX (`Accept: application/json` sin `Authorization`, `next: { revalidate }` entre 3300 y 3900 segundos para listados, lectura desde `json.data`, devolución de `[]` en error y preferencia por los endpoints masivos `*_all`).

### Requirement 5: Extensibilidad del enriquecimiento a cualquier categoría

**User Story:** Como desarrollador, quiero que el detalle enriquecido (descripción incluida) sea genérico, para que cualquier categoría futura de la wiki pueda presentar este tipo de información declarándola en el Registro_Categorias.

#### Acceptance Criteria

1. THE Modelo_Detalle SHALL representar el detalle enriquecido de cualquier elemento como una lista ordenada de Seccion_Detalle que admite el Bloque_Descripcion junto con los Tipo_Bloque existentes.
2. WHERE una Categoria_Wiki define el conjunto y el orden de sus Seccion_Detalle incluyendo un Bloque_Descripcion, THE Detalle_Elemento SHALL renderizar ese detalle sin requerir cambios en la página de detalle ni en las presentaciones de cada Tipo_Bloque.
3. WHERE se añade una Categoria_Wiki nueva al Registro_Categorias con su Proveedor_Descripcion y su configuración de Seccion_Detalle, THE Wiki SHALL exponer su Detalle_Elemento enriquecido sin requerir cambios en las páginas de las demás categorías.
4. THE presentación del Bloque_Descripcion SHALL ser independiente de la categoría del elemento, de modo que la misma presentación sirva a cualquier Categoria_Wiki que declare un Bloque_Descripcion.

### Requirement 6: Manejo de datos faltantes y estados del detalle

**User Story:** Como visitante, quiero que el detalle se muestre de forma coherente cuando falta la descripción o el elemento no existe, para no encontrar secciones vacías ni pantallas rotas.

#### Acceptance Criteria

1. IF un elemento no tiene Texto_Descripcion disponible, THEN THE Detalle_Elemento SHALL mostrar el resto de las Seccion_Detalle del elemento sin mostrar un Bloque_Descripcion vacío.
2. IF el elemento solicitado no existe en los datos de su categoría, THEN THE Detalle_Elemento SHALL mostrar un estado de "no encontrado", conservando el comportamiento ya existente.
3. WHERE el Texto_Descripcion de un elemento está disponible pero el resto de Seccion_Detalle se omiten por falta de datos, THE Detalle_Elemento SHALL mostrar el Bloque_Descripcion junto con la Ficha_Tecnica del elemento.
4. THE Detalle_Elemento SHALL conservar el control de navegación de regreso al Listado_Categoria del elemento.

### Requirement 7: Cumplimiento del framework Next.js

**User Story:** Como desarrollador, quiero que la mejora respete la versión modificada de Next.js del proyecto, para evitar usar APIs o convenciones obsoletas.

#### Acceptance Criteria

1. BEFORE escribir o modificar rutas, layouts, componentes o llamadas de datos del Detalle_Elemento, THE equipo de desarrollo SHALL consultar la Documentacion_Next en `node_modules/next/dist/docs/`.
2. THE Detalle_Elemento SHALL resolver el segmento dinámico `params` siguiendo el modelo de `Promise` de esta versión de Next.js descrito en la Documentacion_Next.
3. WHERE la Documentacion_Next marca una API o convención como obsoleta, THE Detalle_Elemento SHALL evitar su uso y emplear la alternativa vigente documentada.
