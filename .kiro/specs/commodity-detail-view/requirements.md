# Documento de Requisitos — Vista de Detalle de Mercancía

## Introducción

Esta funcionalidad completa la sección `/mercancia` del sitio SCG (Comercio Lucrativo), una guía de comercio para Star Citizen. La experiencia se presenta como una página única donde el usuario busca una mercancía y ve los resultados de precios sin percibir cambio de página, mientras la URL se actualiza con un slug amigable (`/mercancia/{slug}`). Los datos se obtienen de la API UEX Corp 2.0.

## Glosario

- **Sistema**: La aplicación web SCG (Comercio Lucrativo)
- **API_UEX**: La API pública de UEX Corp 2.0 (`https://api.uexcorp.space/2.0/`)
- **Mercancía**: Un commodity comercializable en el universo de Star Citizen
- **Terminal**: Un punto de comercio donde se puede comprar o vender mercancía
- **Ubicación_Jerárquica**: La cadena de ubicación de una terminal (ej: "Stanton > ArcCorp > Wala")
- **Precio_Compra**: El precio en UEC al que una terminal vende la mercancía al jugador
- **Precio_Venta**: El precio en UEC al que una terminal compra la mercancía del jugador
- **Stock**: La cantidad disponible de mercancía en una terminal, medida en SCU
- **Demanda**: La cantidad de mercancía que una terminal está dispuesta a comprar, medida en SCU
- **SCU**: Standard Cargo Unit, unidad de medida de carga en Star Citizen
- **UEC**: United Earth Credits, moneda del juego Star Citizen
- **Tabla_Vendedores**: La tabla que muestra terminales donde el jugador puede comprar la mercancía
- **Tabla_Compradores**: La tabla que muestra terminales donde el jugador puede vender la mercancía
- **Slug**: Versión URL-friendly del nombre de una mercancía (ej: "Laranite" → "laranite", "Hydrogen Fuel" → "hydrogen-fuel"). Se usa como parámetro de ruta en la URL
- **Buscador**: El componente de autocompletado en `/mercancia` que permite buscar mercancías por nombre

## Requisitos

### Requisito 1: Experiencia de página única con navegación invisible

**User Story:** Como jugador, quiero buscar mercancías y ver sus detalles sin sentir que cambio de página, para una experiencia fluida y rápida.

#### Criterios de Aceptación

1. THE Sistema SHALL presentar el Buscador y los resultados de detalle en una misma experiencia visual continua (sin recarga de página ni transición visible)
2. WHEN el usuario selecciona una mercancía en el Buscador, THE Sistema SHALL actualizar la URL a `/mercancia/{slug}` usando navegación del lado del cliente (sin recarga completa), y mostrar los datos de la mercancía debajo del Buscador
3. WHEN el usuario navega directamente a `/mercancia/{slug}` (por URL compartida o bookmark), THE Sistema SHALL pre-cargar el Buscador con el nombre de la mercancía correspondiente al slug y mostrar los datos de detalle automáticamente
4. WHEN la URL es `/mercancia` (sin slug), THE Sistema SHALL mostrar el Buscador con un mensaje primario de bienvenida invitando al usuario a buscar una mercancía, sin mostrar tablas de datos
5. THE Sistema SHALL usar el campo `slug` de la API_UEX (o derivar un slug del nombre: lowercase, espacios reemplazados por guiones) como parámetro de ruta en la URL
6. THE Sistema SHALL usar el parámetro `commodity_slug` (o `commodity_name` derivado del slug) para consultar la API_UEX
7. WHEN el usuario limpia el Buscador o borra la selección, THE Sistema SHALL volver la URL a `/mercancia` y mostrar nuevamente el mensaje primario de bienvenida

### Requisito 2: Obtención de datos de precios

**User Story:** Como jugador, quiero que la página obtenga los datos de precios de la mercancía desde la API, para poder ver información actualizada.

#### Criterios de Aceptación

1. WHEN el usuario navega a `/mercancia/[slug]`, THE Sistema SHALL obtener los datos de precios desde el endpoint `GET /commodities_prices?commodity_slug={slug}` de la API_UEX (o usando `commodity_name` derivado del slug)
2. WHEN la API_UEX retorna datos válidos, THE Sistema SHALL procesar la respuesta y separar los registros en terminales de compra (con Precio_Compra > 0) y terminales de venta (con Precio_Venta > 0)
3. IF la API_UEX retorna un error o no retorna datos, THEN THE Sistema SHALL mostrar un mensaje indicando que no se encontraron datos para la mercancía solicitada

### Requisito 3: Título de la página

**User Story:** Como jugador, quiero ver el nombre de la mercancía como título de la página, para confirmar que estoy viendo la mercancía correcta.

#### Criterios de Aceptación

1. WHEN la página se carga con datos válidos, THE Sistema SHALL mostrar el nombre de la mercancía (obtenido de la API, no del slug) como encabezado principal de la página
2. THE Sistema SHALL usar el nombre real de la API_UEX para el título, no la versión slug de la URL

### Requisito 4: Sección "Vendido por" (Sold by)

**User Story:** Como jugador, quiero ver una tabla con las terminales donde puedo comprar la mercancía, para encontrar el mejor precio de compra.

#### Criterios de Aceptación

1. THE Tabla_Vendedores SHALL mostrar únicamente registros donde el Precio_Compra sea mayor a 0
2. THE Tabla_Vendedores SHALL mostrar las siguientes columnas: nombre de terminal, Ubicación_Jerárquica, Precio_Compra en UEC, y stock disponible sobre stock máximo en SCU
3. WHEN se muestran los datos, THE Tabla_Vendedores SHALL ordenar los registros por Precio_Compra de forma ascendente (precio más bajo primero)
4. WHEN no existen terminales con Precio_Compra mayor a 0, THE Sistema SHALL mostrar un mensaje indicando que no hay terminales que vendan esta mercancía

### Requisito 5: Sección "Comprado por" (Bought by)

**User Story:** Como jugador, quiero ver una tabla con las terminales donde puedo vender la mercancía, para encontrar el mejor precio de venta.

#### Criterios de Aceptación

1. THE Tabla_Compradores SHALL mostrar únicamente registros donde el Precio_Venta sea mayor a 0
2. THE Tabla_Compradores SHALL mostrar las siguientes columnas: nombre de terminal, Ubicación_Jerárquica, Precio_Venta en UEC, y demanda disponible sobre demanda máxima en SCU
3. WHEN se muestran los datos, THE Tabla_Compradores SHALL ordenar los registros por Precio_Venta de forma descendente (mejor precio de venta primero)
4. WHEN no existen terminales con Precio_Venta mayor a 0, THE Sistema SHALL mostrar un mensaje indicando que no hay terminales que compren esta mercancía

### Requisito 6: Información de ubicación jerárquica

**User Story:** Como jugador, quiero ver la ubicación completa de cada terminal, para saber exactamente dónde ir a comerciar.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar el nombre de la terminal como identificador principal de cada fila
2. THE Sistema SHALL mostrar la Ubicación_Jerárquica de cada terminal utilizando los campos de ubicación disponibles en la respuesta de la API_UEX (sistema estelar, planeta, órbita, luna, ciudad, outpost, POI)
3. THE Sistema SHALL construir la Ubicación_Jerárquica concatenando los nombres de ubicación disponibles separados por " > ", omitiendo niveles sin datos

### Requisito 7: Formato de precios y cantidades

**User Story:** Como jugador, quiero ver los precios y cantidades formateados de forma clara, para interpretar rápidamente la información.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar los precios con formato numérico incluyendo separador de miles y decimales cuando corresponda, seguido de la unidad "UEC"
2. THE Sistema SHALL mostrar el stock y la demanda en formato "{disponible} / {máximo} SCU"
3. WHEN el stock máximo o la demanda máxima no estén disponibles, THE Sistema SHALL mostrar únicamente el valor disponible seguido de "SCU"

### Requisito 8: Estado de carga

**User Story:** Como jugador, quiero ver un indicador de carga mientras se obtienen los datos, para saber que la página está funcionando.

#### Criterios de Aceptación

1. WHILE los datos se están obteniendo de la API_UEX, THE Sistema SHALL mostrar un indicador de carga visible al usuario
2. WHEN los datos terminan de cargarse, THE Sistema SHALL reemplazar el indicador de carga con el contenido de la página
