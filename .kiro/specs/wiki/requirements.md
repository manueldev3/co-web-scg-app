# Requirements Document

## Introduction

Esta funcionalidad añade una **wiki** dentro de la web de SCG que muestra información del universo de Star Citizen obtenida de la API pública de UEX Corp (`https://api.uexcorp.uk/2.0`, sin autenticación). La wiki está pensada como un espacio de consulta de referencia: naves, vehículos terrestres, armas, armaduras, ítems, planetas, lunas, outposts y, en general, cualquier categoría que UEX Corp exponga.

El enfoque es **escalable e incremental**. La primera entrega (alcance del MVP) se centra **únicamente en NAVES** (`/vehicles` con `is_spaceship`), pero la arquitectura se diseña para que añadir nuevas categorías (vehículos terrestres, armas, armaduras, ítems, planetas, lunas, outposts, etc.) requiera el mínimo esfuerzo posible. Las categorías futuras se describen como requisitos de extensibilidad, no como entregables del MVP.

La wiki incluye: una página de entrada (landing) que presenta las categorías disponibles, un buscador global capaz de encontrar elementos en cualquier categoría activa, listados por categoría, pantallas de detalle muy completas por elemento, manejo robusto de datos faltantes y errores de la API, y una nueva sección destacada en el Home (con buscador) que dirige el tráfico hacia la wiki **sin reemplazar** el contenido existente del Home (hero con vídeo, secciones de herramientas, footer).

El proyecto es Next.js (App Router) **modificado**: antes de escribir rutas, layouts, componentes o llamadas de datos se debe consultar `node_modules/next/dist/docs/` según la regla de `AGENTS.md`.

## Glossary

- **Wiki**: Conjunto de páginas bajo la ruta `/wiki` que muestran información de referencia del universo de Star Citizen procedente de UEX Corp.
- **Categoria_Wiki**: Clasificación de contenido de la wiki (p. ej. "naves", "vehículos terrestres", "armas", "armaduras", "ítems", "planetas", "lunas", "outposts"). En el MVP solo está activa la categoría "naves".
- **Registro_Categorias**: Estructura de configuración declarativa que define las categorías de la wiki disponibles y, por cada una, sus metadatos (identificador, nombre visible, icono, fuente de datos, campos de detalle y función de búsqueda). Es el punto de extensión que permite añadir categorías nuevas.
- **Wiki_Landing**: Página índice de la wiki (`/wiki`) que presenta las Categoria_Wiki activas.
- **Buscador_Wiki**: Componente y lógica de búsqueda transversal que encuentra elementos en todas las Categoria_Wiki activas.
- **Listado_Categoria**: Página que muestra el conjunto de elementos de una Categoria_Wiki (en el MVP, el listado de naves).
- **Detalle_Elemento**: Página que muestra la información completa de un único elemento de una Categoria_Wiki (en el MVP, el detalle de una nave).
- **Nave**: Elemento de la categoría "naves" correspondiente a un registro de `/vehicles` con `is_spaceship = 1`.
- **Cliente_UEX**: Módulo `uex-api.ts` de la wiki que realiza las llamadas a la API de UEX Corp siguiendo las convenciones del repositorio (sin Authorization, `Accept: application/json`, `next: { revalidate }`, nunca lanza excepción y devuelve `[]` en error).
- **Home_Wiki_Section**: Nueva sección añadida en la página de inicio (`app/page.tsx`) que promociona la wiki e incluye un buscador de acceso.
- **Header_Navegacion**: Componente de navegación del sitio (`app/components/SiteHeader.tsx`) que contiene el menú principal.
- **API_UEX**: API pública de UEX Corp 2.0 en `https://api.uexcorp.uk/2.0`.
- **Documentacion_Next**: Documentación local del framework en `node_modules/next/dist/docs/` que debe consultarse antes de escribir código de Next.js.
- **Dato_Faltante**: Campo de un elemento cuyo valor es `null`, `undefined` o ausente en la respuesta de la API_UEX. Las cadenas vacías y los valores cero NO se consideran Dato_Faltante y se muestran tal cual.

## Requirements

### Requirement 1: Entrada de navegación a la wiki

**User Story:** Como visitante de la web, quiero un acceso claro a la wiki desde la navegación principal, para poder llegar a la información de referencia desde cualquier página.

#### Acceptance Criteria

1. THE Header_Navegacion SHALL mostrar una entrada de menú etiquetada "Wiki" que enlaza a la ruta `/wiki`.
2. WHEN una persona usuaria selecciona la entrada "Wiki", THE Header_Navegacion SHALL navegar a la ruta `/wiki`.
3. WHILE la ruta activa pertenece a la wiki, THE Header_Navegacion SHALL marcar la entrada "Wiki" como seleccionada.
4. THE Header_Navegacion SHALL conservar las entradas de navegación existentes ("Inicio" y "Herramientas para cargadores" con sus subelementos) sin eliminarlas ni reordenarlas.
5. WHERE el ancho de pantalla activa el menú horizontal de escritorio, THE Header_Navegacion SHALL mostrar la entrada "Wiki" en la barra de navegación principal.
6. WHERE el ancho de pantalla activa el menú móvil (drawer), THE Header_Navegacion SHALL mostrar la entrada "Wiki" dentro del drawer.

### Requirement 2: Landing de la wiki con categorías

**User Story:** Como visitante, quiero una página índice de la wiki que presente las categorías disponibles, para entender qué información puedo consultar y navegar hacia ella.

#### Acceptance Criteria

1. WHEN una persona usuaria visita la ruta `/wiki`, THE Wiki_Landing SHALL mostrar una tarjeta por cada Categoria_Wiki activa definida en el Registro_Categorias.
2. THE Wiki_Landing SHALL mostrar, por cada Categoria_Wiki activa, su nombre visible y su icono.
3. WHEN una persona usuaria selecciona la tarjeta de una Categoria_Wiki activa, THE Wiki_Landing SHALL navegar al Listado_Categoria correspondiente.
4. THE Wiki_Landing SHALL mostrar el Buscador_Wiki en la propia página índice.
5. WHERE una Categoria_Wiki está definida en el Registro_Categorias como inactiva o "próximamente", THE Wiki_Landing SHALL mostrarla en estado deshabilitado, sin enlace de navegación a su Listado_Categoria.
6. WHEN una persona usuaria selecciona la tarjeta de una Categoria_Wiki inactiva, THE Wiki_Landing SHALL mostrar un mensaje o tooltip que indica que la categoría aún no está disponible, sin navegar a ningún Listado_Categoria.
7. THE Wiki_Landing SHALL aplicar el tema oscuro y los tokens visuales del sitio existentes.

### Requirement 3: Arquitectura extensible por categorías

**User Story:** Como desarrollador, quiero que las categorías de la wiki se declaren en una estructura central, para poder añadir nuevas categorías con poco esfuerzo y sin reescribir las páginas existentes.

#### Acceptance Criteria

1. THE Registro_Categorias SHALL definir cada Categoria_Wiki mediante un identificador único, un nombre visible, un icono, una fuente de datos y la configuración de sus campos de detalle.
2. THE Wiki_Landing SHALL derivar las categorías que muestra a partir del Registro_Categorias, sin listas codificadas en la propia página.
3. THE Buscador_Wiki SHALL derivar el conjunto de categorías en las que busca a partir de las Categoria_Wiki activas del Registro_Categorias.
4. WHERE se añade una nueva Categoria_Wiki al Registro_Categorias con su configuración completa, THE Wiki SHALL exponer su landing, su Listado_Categoria y su Detalle_Elemento sin requerir cambios en las páginas de las demás categorías.
5. THE Registro_Categorias SHALL marcar la categoría "naves" como única Categoria_Wiki activa en la primera entrega.

### Requirement 4: Listado de naves

**User Story:** Como visitante, quiero ver el listado de naves de la wiki, para explorar las naves disponibles y abrir el detalle de cualquiera de ellas.

#### Acceptance Criteria

1. WHEN una persona usuaria visita la ruta del Listado_Categoria de naves, THE Listado_Categoria SHALL solicitar las naves al Cliente_UEX.
2. THE Listado_Categoria SHALL mostrar únicamente los registros de `/vehicles` cuyo campo `is_spaceship` indica que son naves.
3. THE Listado_Categoria SHALL mostrar, por cada Nave, su nombre (`name_full` cuando esté disponible, en caso contrario `name`) y su empresa fabricante (`company_name`).
4. WHEN una persona usuaria selecciona una Nave del Listado_Categoria, THE Listado_Categoria SHALL navegar al Detalle_Elemento de esa Nave.
5. THE Listado_Categoria SHALL ofrecer un campo de filtrado por nombre que reduce las naves mostradas a las que coinciden con el texto introducido.
6. IF la respuesta del Cliente_UEX para naves es una lista vacía, THEN THE Listado_Categoria SHALL mostrar un mensaje de estado vacío en lugar de una tabla o cuadrícula vacía.

### Requirement 5: Detalle de nave

**User Story:** Como visitante, quiero una pantalla de detalle de nave muy completa, para conocer todos los datos que UEX Corp expone sobre esa nave.

#### Acceptance Criteria

1. WHEN una persona usuaria visita el Detalle_Elemento de una Nave existente, THE Detalle_Elemento SHALL mostrar el nombre completo de la Nave y su empresa fabricante.
2. THE Detalle_Elemento SHALL mostrar los campos de la Nave provistos por la API_UEX, incluyendo capacidad de carga (`scu`), tripulación (`crew`), tipo de plataforma de aterrizaje (`pad_type`), tamaños de contenedor (`container_sizes`) y los indicadores de clasificación (`is_spaceship`, `is_cargo`, `is_ground_vehicle`).
3. WHERE una Nave tiene varios indicadores de clasificación activos simultáneamente (p. ej. `is_spaceship` y `is_cargo`), THE Detalle_Elemento SHALL mostrar todas las clasificaciones activas de esa Nave.
4. WHERE el campo `container_sizes` contiene una cadena separada por comas, THE Detalle_Elemento SHALL mostrar los tamaños como una lista de valores numéricos legibles.
5. IF un campo de la Nave es un Dato_Faltante, THEN THE Detalle_Elemento SHALL mostrar un marcador de "dato no disponible" para ese campo en lugar de "null" o "undefined".
6. IF la Nave solicitada no existe en los datos del Cliente_UEX, THEN THE Detalle_Elemento SHALL mostrar un estado de "no encontrado".
7. THE Detalle_Elemento SHALL ofrecer un control de navegación de regreso al Listado_Categoria de naves.

### Requirement 6: Buscador global de la wiki

**User Story:** Como visitante, quiero un buscador que encuentre cualquier elemento dentro de cualquier categoría activa, para localizar información sin saber de antemano en qué categoría está.

#### Acceptance Criteria

1. WHEN una persona usuaria introduce un texto de búsqueda en el Buscador_Wiki, THE Buscador_Wiki SHALL buscar coincidencias en todas las Categoria_Wiki activas del Registro_Categorias.
2. THE Buscador_Wiki SHALL realizar la coincidencia de texto de forma insensible a mayúsculas y minúsculas.
3. WHEN el Buscador_Wiki produce resultados, THE Buscador_Wiki SHALL mostrar por cada resultado su nombre y la Categoria_Wiki a la que pertenece.
4. WHEN una persona usuaria selecciona un resultado del Buscador_Wiki, THE Buscador_Wiki SHALL navegar al Detalle_Elemento correspondiente a ese resultado.
5. IF el texto de búsqueda no produce coincidencias, THEN THE Buscador_Wiki SHALL mostrar un mensaje de "sin resultados".
6. WHILE el campo de búsqueda está vacío, THE Buscador_Wiki SHALL no mostrar resultados.

### Requirement 7: Sección de la wiki en el Home

**User Story:** Como visitante de la página de inicio, quiero una sección que llame la atención hacia la wiki con un buscador, para descubrir y acceder a la información de referencia desde el Home.

#### Acceptance Criteria

1. THE Home_Wiki_Section SHALL añadirse a la página de inicio sin eliminar ni modificar el hero con vídeo, las secciones de herramientas ni el footer existentes.
2. THE Home_Wiki_Section SHALL presentar un título y una descripción que identifican la wiki como espacio de información del universo.
3. THE Home_Wiki_Section SHALL incluir un campo de búsqueda que dirige a la persona usuaria hacia la wiki.
4. WHEN una persona usuaria realiza una búsqueda desde la Home_Wiki_Section, THE Home_Wiki_Section SHALL navegar a la wiki llevando el texto de búsqueda introducido.
5. THE Home_Wiki_Section SHALL incluir un enlace o botón de acceso directo a la Wiki_Landing.
6. THE Home_Wiki_Section SHALL aplicar el tema oscuro y los tokens visuales del Home existente.

### Requirement 8: Acceso a datos de UEX Corp

**User Story:** Como desarrollador, quiero que el acceso a la API de UEX Corp siga las convenciones del repositorio, para mantener consistencia, respetar los límites de la API y no romper la web ante fallos.

#### Acceptance Criteria

1. THE Cliente_UEX SHALL realizar las solicitudes a la API_UEX con la cabecera `Accept: application/json` y sin cabecera `Authorization`.
2. THE Cliente_UEX SHALL configurar el almacenamiento en caché mediante `next: { revalidate: <segundos> }` con una vigencia para los listados comprendida entre 3300 y 3900 segundos (aproximadamente una hora).
3. THE Cliente_UEX SHALL leer los datos desde `json.data` y devolver una lista vacía cuando `json.data` está ausente.
4. IF la solicitud a la API_UEX lanza una excepción o devuelve un estado distinto de 2xx, THEN THE Cliente_UEX SHALL registrar el error y devolver una lista vacía sin propagar la excepción.
5. WHERE una pantalla necesita combinar varios conjuntos de datos de la API_UEX, THE Cliente_UEX SHALL agregarlos con `Promise.allSettled` de modo que el fallo de un origen no impida mostrar los demás.
6. THE Cliente_UEX SHALL preferir los endpoints masivos `*_all` frente a patrones de una solicitud por elemento para respetar el límite de 120 solicitudes por minuto.

### Requirement 9: Cumplimiento del framework Next.js

**User Story:** Como desarrollador, quiero que toda la implementación respete la versión modificada de Next.js del proyecto, para evitar usar APIs o convenciones obsoletas.

#### Acceptance Criteria

1. BEFORE escribir rutas, layouts, componentes o llamadas de datos de la wiki, THE equipo de desarrollo SHALL consultar la Documentacion_Next en `node_modules/next/dist/docs/`.
2. THE Wiki SHALL implementar sus rutas siguiendo las convenciones del App Router descritas en la Documentacion_Next.
3. WHERE la Documentacion_Next marca una API o convención como obsoleta, THE Wiki SHALL evitar su uso y emplear la alternativa vigente documentada.
