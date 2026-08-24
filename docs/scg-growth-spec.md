# SCG Growth Spec — De herramienta a plataforma de referencia

**Versión:** 1.0  
**Fecha:** Agosto 2026  
**Autor:** Spec generado por análisis de proyecto  
**Estado:** PROPUESTA — No implementar sin aprobación

---

## Executive Summary

SCG App es actualmente una web de herramientas de comercio para Star Citizen construida con Next.js 16 (App Router), React 19, Ant Design 6 y Tailwind CSS 4. Consume datos de la API pública de UEX Corp y ofrece tres herramientas funcionales: calculadora de rutas ("Mejor Ruta"), consulta de mercancías y organizador de carga. Tiene una wiki incipiente (solo categoría "Naves") y una sección de guías recién creada.

**Objetivo:** Transformar SCG de una web de herramientas en la plataforma de referencia hispanohablante para comercio y carga de Star Citizen, con tres pilares: **Tools** (herramientas), **Data** (páginas de datos indexables) y **Content** (guías editoriales). El fin es multiplicar el tráfico orgánico y monetizar vía AdSense + futuro modelo freemium.

**Principios de diseño:**
1. No hacer fan-out de requests a la API (usar endpoints `*_all`).
2. No crear páginas thin-content — cada página debe aportar valor diferencial.
3. Reutilizar la arquitectura existente (Server Components + Client Components + pure computation modules).
4. No romper funcionalidades existentes.
5. Incrementalidad — cada fase es autónoma y deployable.

---

## Current Architecture

### Tech Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.6 |
| React | React + React DOM | 19.2.4 |
| UI Library | Ant Design + @ant-design/nextjs-registry | 6.4.3 |
| Styling | Tailwind CSS (via @tailwindcss/postcss) | 4.x |
| Fonts | Geist + Geist Mono (next/font/google) | — |
| Testing | Vitest + Testing Library + fast-check | 4.1.7 |
| Linting | ESLint + eslint-config-next | 9.x |
| Deploy | Vercel (hobby plan) | — |
| Language | TypeScript | 5.x |

### Project Structure

```
app/
├── layout.tsx              ← Root: AntdRegistry > SCGLayout > Header + children + Footer
├── page.tsx                ← Home ("use client", hero + tool cards + CTA)
├── globals.css             ← Tailwind v4 + theme vars
├── icon.tsx                ← Dynamic favicon
├── components/             ← Shared UI (SiteHeader, SiteFooter, SCGLayout, VideoBackground)
├── mejor-ruta/             ← Route calculator (Server page + Client RouteFinder)
├── mercancia/              ← Commodity lookup (nested layout + [name] dynamic)
├── organizador-de-carga/   ← Cargo planner (Server page + Client)
├── wiki/                   ← Wiki (registry pattern, [category]/[slug])
├── guias/                  ← Guides (landing + como-empezar-en-comercio)
├── terminales/             ← Shared terminal types+API (no page)
├── contacto/               ← Contact page
├── sobre-nosotros/         ← About page
├── politica-de-privacidad/ ← Privacy policy
└── terminos-y-condiciones/ ← Terms
```

### Architectural Patterns

1. **Server Component data-fetching → Client Component interactivity:** Pages fetch data server-side, pass as props to `"use client"` components.
2. **Pure computation modules:** `route-engine.ts` — framework-free, pure functions, testable.
3. **Registry pattern:** Wiki categories are declarative entries; adding a category requires no page changes.
4. **Resilient API layer:** All `uex-api.ts` modules: try/catch, return `[]` on failure, `Promise.allSettled` for parallel requests.
5. **ISR via `fetch` revalidate:** No `unstable_cache`, no `"use cache"`. Uses `next: { revalidate }` exclusively.

### Layout System

- **Root layout:** `html[lang="es"]` → Geist fonts → AntdRegistry → SCGLayout (ConfigProvider dark theme) → header bar → SiteHeader → children → SiteFooter.
- **Nested layouts:** `mercancia/layout.tsx` (fetches commodity list for sidebar), `organizador-de-carga/layout.tsx` (passthrough).

### State Management

No global state library. Local `useState` in client components. Data flows top-down via props from server components.

### Styling

- Tailwind v4 CSS-first config (no tailwind.config.ts) — `@theme` directive in globals.css.
- Ant Design ConfigProvider with `darkAlgorithm` and extensive token overrides in `SCGLayout.tsx`.
- Color palette: `#061220` (bg), `#0a1929` (card bg), `#0F2C3E` (header), `#143A52` (borders), `#9ED0FA` (accent), `#BCBEC0` (text).

### Caching/Revalidation (Confirmed)

| Dataset | Endpoint | TTL |
|---------|----------|-----|
| Commodities | `/commodities` | 3600s (1h) |
| All prices | `/commodities_prices_all` | 1800s (30min) |
| Single commodity prices | `/commodities_prices?commodity_name=X` | 1800s |
| Terminals | `/terminals` | 3600s |
| Vehicles | `/vehicles` | 3600s |
| Vehicle purchase prices | `/vehicles_purchases_prices_all` | 3600s |
| Vehicle rental prices | `/vehicles_rentals_prices_all` | 3600s |

### Error Handling (Current)

- **No `error.tsx`** files anywhere.
- **No `not-found.tsx`** files anywhere.
- **`loading.tsx`** files in: mejor-ruta, mercancia/[name], wiki, wiki/[category], wiki/[category]/[slug].
- API errors handled silently (log + return `[]`).

---

## Current Features

### 1. Mejor Ruta (Route Calculator)
- **Status:** Fully implemented, 22 test files (unit + property-based + integration).
- **Flow:** Server page fetches `MarketData` (commodities + prices_all + terminals + vehicles) → passes to `RouteFinder` client component.
- **Engine:** `buildCandidateRoutes` → `applyFilters` → `rankRoutes` → `computeRoutes`.
- **Filters:** profitMode, maxStops, commodityTypes, commodities, factions (multiselect avoid/only), minSecurityLevel, boxSizeScu, allowWaitTimers, avoidHiddenLocations.
- **Ranking:** pure_profit (total profit DESC) or over_time (profit/time proxy DESC).

### 2. Mercancía (Commodity Lookup)
- **Status:** Implemented.
- **Flow:** Layout fetches all commodities → Mercancia client component provides autocomplete search → `/mercancia/[name]` server page fetches per-commodity prices → shows sellers/buyers tables.
- **Dynamic route:** slug-based (`name.toLowerCase().replace(/\s+/g, "-")`).

### 3. Organizador de Carga
- **Status:** Implemented (basic).
- **Flow:** Server page fetches commodities + terminals → Client component lets users manually add destination entries (commodity + terminal + SCU) to a table.
- **No calculation:** Purely a manual planning list.

### 4. Wiki
- **Status:** Partially implemented (only "Naves" category active).
- **Pattern:** Registry-based (`WIKI_CATEGORIES`). Category `navesCategory` loads vehicles, purchase prices, rental prices, terminals.
- **Detail:** Ship pages show fields (specs), gallery (images from API), prices (buy/rent), external links, curated descriptions.
- **Routes:** `/wiki` (landing with search), `/wiki/[category]` (list), `/wiki/[category]/[slug]` (detail).

### 5. Guías
- **Status:** Just created (this session). Landing + one article ("Cómo empezar en comercio").
- **Architecture:** Static file-based pages (no CMS, no registry pattern yet).

### 6. Legal/Info Pages
- `/politica-de-privacidad`, `/terminos-y-condiciones`, `/sobre-nosotros`, `/contacto` — all implemented.

---

## UEX Data Architecture

### API Connection

- **Base URL:** `https://api.uexcorp.uk/2.0`
- **Auth:** None required for read endpoints.
- **Rate limit:** 120 requests/minute.
- **Response format:** `{ "status": "ok", "data": [...] }`.
- **Preferred bulk endpoint:** `/commodities_prices_all` (~2,590 rows, 30min TTL).

### Available Data (Confirmed from API)

| Entity | Endpoint | Rows | Key Fields |
|--------|----------|------|------------|
| Commodities | `/commodities` | ~205 | id, id_parent, name, code, kind, weight_scu, price_buy, price_sell, is_buyable, is_sellable, is_illegal |
| Prices (bulk) | `/commodities_prices_all` | ~2,590 | id_commodity, id_terminal, price_buy, price_sell, scu_buy, scu_sell, scu_sell_stock, container_sizes, commodity_name, terminal_name |
| Prices (single) | `/commodities_prices?commodity_name=X` | varies | Full record: location hierarchy, id_faction, faction_name, game_version |
| Terminals | `/terminals` | large | id, name, type, is_visible, id_faction, faction_name, star_system_name, planet_name, city_name, space_station_name |
| Vehicles | `/vehicles` | ~278 | id, name, name_full, scu, crew, is_spaceship, is_cargo, container_sizes, pad_type, company_name, dimensions, fuel, images, slug |
| Vehicle prices (buy) | `/vehicles_purchases_prices_all` | varies | id_vehicle, id_terminal, price_buy |
| Vehicle prices (rent) | `/vehicles_rentals_prices_all` | varies | id_vehicle, id_terminal, price_rent |

### Critical Data Quirks

1. **`scu_sell` is frequently 0** even when demand exists → use `scu_sell_stock` or `scu_sell_avg` as fallback.
2. **`price_buy`/`price_sell` in `/commodities`** are global indicative values — NOT per-terminal.
3. **No `security_level` field** exists on terminals — do not invent levels.
4. **`/commodities_prices` without parameters returns HTTP 400** — always pass a filter.
5. **`container_sizes`** is a comma-separated string, parse to `number[]`.
6. **`/commodities_prices_all` lacks** `id_faction`, `faction_name`, and location-name fields.

---

## Product Strategy

### Three Pillars

```
┌─────────────────────────────────────────────────────────────┐
│                        SCG Platform                          │
├──────────────┬──────────────────────┬───────────────────────┤
│    TOOLS     │        DATA          │       CONTENT         │
├──────────────┼──────────────────────┼───────────────────────┤
│ Mejor Ruta   │ Páginas de Naves     │ Guías de comercio     │
│ Mercancía    │ Páginas de Commodit. │ Tutoriales            │
│ Org. Carga   │ Páginas de Terminales│ Wiki (existente)      │
│ Comparador   │ Páginas de Ubicac.   │ Blog/Noticias (futuro)│
│ Calculadora  │ Índices/Directorios  │                       │
└──────────────┴──────────────────────┴───────────────────────┘
```

### Interconexión entre pilares

Cada entidad enlaza a las demás:
- **Nave** → mercancías recomendadas → terminales donde comprar/vender → ruta calculada → guía "cómo comerciar con esta nave"
- **Mercancía** → mejores terminales para comprar/vender → naves ideales → CTA "calcular ruta"
- **Terminal** → mercancías disponibles → naves que operan allí → rutas desde/hacia
- **Guía** → enlaces a herramientas, datos y entidades relevantes

---

## Information Architecture

### URL Structure Propuesta

Se mantiene el idioma español para URLs (coherente con el proyecto actual) pero se reorganiza la jerarquía:

```
/                                    ← Home (existente, mejorar)
├── /mejor-ruta                      ← Route calculator (existente)
├── /mercancia                       ← Commodity search (existente)
│   └── /mercancia/[slug]            ← Commodity detail (existente, enriquecer)
├── /organizador-de-carga            ← Cargo planner (existente)
├── /comparador-de-naves             ← Ship comparison (NUEVO)
├── /calculadora-rentabilidad        ← Profit calculator (NUEVO)
├── /naves                           ← Ships index (NUEVO)
│   └── /naves/[slug]                ← Ship detail (NUEVO - migrar de wiki)
├── /terminales                      ← Terminals index (NUEVO)
│   └── /terminales/[slug]           ← Terminal detail (NUEVO)
├── /ubicaciones                     ← Locations index (NUEVO, si datos suficientes)
│   └── /ubicaciones/[slug]          ← Location detail (NUEVO)
├── /guias                           ← Guides index (existente, expandir)
│   └── /guias/[slug]                ← Guide article (existente)
├── /wiki                            ← Wiki hub (existente, redireccionará a nuevas secciones)
│   └── /wiki/[category]/[slug]      ← Wiki detail (existente, mantener compatibilidad)
├── /sobre-nosotros                  ← About (existente)
├── /contacto                        ← Contact (existente)
├── /politica-de-privacidad          ← Privacy (existente)
└── /terminos-y-condiciones          ← Terms (existente)
```

### Decisiones de Routing

1. **Naves se promueven a ruta propia** (`/naves/[slug]`) en lugar de `/wiki/naves/[slug]`. La wiki actual solo tiene naves como categoría activa — promoverlas da más peso SEO y URLs más limpias. Se mantiene redirect 301 desde `/wiki/naves/[slug]` → `/naves/[slug]`.
2. **Terminales como sección independiente** con índice filtrable + páginas de detalle.
3. **Mercancía mantiene su URL actual** (`/mercancia/[slug]`) pero se enriquece con más datos.
4. **Ubicaciones** solo se implementan si los datos de terminales ofrecen suficiente agrupación útil (sistemas/planetas con >3 terminales cada uno). → **Open Question**: verificar densidad de datos por ubicación.
5. **Herramientas nuevas** usan URLs raíz descriptivas en español (coherente con el proyecto).

---

## SEO Strategy

### SEO Técnico — Gaps Identificados

| Elemento | Estado Actual | Acción |
|----------|---------------|--------|
| sitemap.xml | **NO EXISTE** | Crear `app/sitemap.ts` dinámico |
| robots.txt | **NO EXISTE** | Crear `app/robots.ts` |
| Metadata dinámica | Solo metadata estática | Implementar `generateMetadata` en rutas dinámicas |
| Open Graph | **NO EXISTE** | Añadir og:title, og:description, og:image en metadata |
| Twitter/X cards | **NO EXISTE** | Añadir twitter:card metadata |
| Canonical URLs | **NO EXISTE** | Añadir canonical vía metadata alternates |
| Structured data (JSON-LD) | **NO EXISTE** | Añadir en páginas de datos |
| Breadcrumbs | **NO EXISTE** | Implementar componente + structured data |
| 404 page | **NO EXISTE** | Crear `app/not-found.tsx` |
| Error page | **NO EXISTE** | Crear `app/error.tsx` |
| Hreflang | No aplica (solo español) | — |

### sitemap.xml (Propuesta)

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const staticPages = ["/", "/mejor-ruta", "/mercancia", "/organizador-de-carga", 
    "/naves", "/terminales", "/guias", "/sobre-nosotros", "/contacto",
    "/politica-de-privacidad", "/terminos-y-condiciones"];
  
  // Páginas dinámicas: commodities, naves, terminales, guías
  const commodities = await fetchCommodities(); // ~205 URLs
  const vehicles = await fetchVehicles();       // ~180 spaceships
  // terminales: solo las de type="commodity" con datos relevantes
  
  // Combinar con lastmod y priority
}
```

### robots.txt (Propuesta)

```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://scg-app.com/sitemap.xml
```

### Metadata Dinámica

Para cada página dinámica (`/mercancia/[slug]`, `/naves/[slug]`, `/terminales/[slug]`), implementar `generateMetadata()` que devuelve:
- `title`: `"{Nombre} - {Contexto} | SCG"`
- `description`: Descripción útil con datos clave (ej. precio, capacidad SCU)
- `openGraph`: title, description, url, siteName, locale="es_ES"
- `twitter`: card="summary", title, description
- `alternates.canonical`: URL canónica absoluta

### Structured Data (JSON-LD)

- **Naves:** `Product` schema (name, description, brand=manufacturer, offers=purchase prices)
- **Mercancías:** `Product` schema (name, description, offers con price ranges)
- **Guías:** `Article` schema (headline, author, datePublished, dateModified)
- **Breadcrumbs:** `BreadcrumbList` schema en todas las páginas con profundidad >1
- **WebSite:** `WebSite` + `SearchAction` en la home

### Contenido Indexable vs No-Indexable

| Página | Indexable | Razón |
|--------|-----------|-------|
| /naves/[slug] | Sí | Contenido rico único por nave |
| /mercancia/[slug] | Sí | Datos de precios + contexto editorial |
| /terminales/[slug] | Sí (condicional) | Solo si tiene >2 commodities activas |
| /mejor-ruta | Sí (landing) | Herramienta interactiva, no indexar resultados |
| /guias/[slug] | Sí | Contenido editorial original |
| /comparador-de-naves | Sí (landing) | Herramienta con descripción contextual |
| Páginas con <3 datos útiles | No (noindex) | Evitar thin content |

---

## Dynamic Data Pages

### Páginas de Naves (`/naves/[slug]`)

**Fuente de datos:** `/vehicles` + `/vehicles_purchases_prices_all` + `/vehicles_rentals_prices_all` + `/terminals` + `/commodities_prices_all`

**Contenido:**
- Nombre completo, fabricante (company_name), imagen principal (url_photo)
- Especificaciones: SCU, crew, pad_type, dimensiones, combustible
- Container sizes soportados
- Clasificaciones (cargo, mining, exploration, military, etc.)
- Galería de imágenes (url_photos)
- Precios de compra in-game por terminal
- Precios de alquiler por terminal
- Enlaces externos (tienda RSI, brochure, video)
- Descripción curada (del diccionario existente en naves-descriptions.ts)

**Sección comercial (NUEVO):**
- "Potencial de comercio" — capacidad SCU, tipos de caja soportados
- "Mejores rutas para esta nave" — top 3-5 rutas calculadas server-side con los datos actuales
- CTA: "Calcular todas las rutas para {nave}" → `/mejor-ruta?ship={id}`

**Implementación:** Migrar y enriquecer la lógica existente de `app/wiki/categories/naves.ts` (ya tiene `loadDetail` con `buildShipDetail`). Añadir la sección comercial con datos de `commodities_prices_all`.

**generateMetadata:** Título="{nombre_full} - Nave de Star Citizen | SCG", descripción con SCU y fabricante.

### Páginas de Mercancías (`/mercancia/[slug]`)

**Fuente de datos:** `/commodities` (catálogo) + `/commodities_prices?commodity_name=X` (precios detallados por terminal)

**Contenido actual (enriquecer):**
- Nombre, tabla de vendedores (terminales donde comprar), tabla de compradores (terminales donde vender)

**Contenido propuesto adicional:**
- Cabecera con: nombre, código, tipo/grupo (id_parent), peso SCU, legal/ilegal
- Indicadores de precio: precio actual medio de compra/venta, spread
- Mejor terminal para comprar (precio más bajo con stock)
- Mejor terminal para vender (precio más alto con demanda)
- "Margen estimado" = mejor venta - mejor compra
- Naves recomendadas (por container_sizes compatible + SCU capacity)
- CTA: "Buscar rutas con {mercancía}" → `/mejor-ruta?commodity={id}`

**generateMetadata:** Título="{nombre} - Precios en Star Citizen | SCG", descripción con rango de precios.

### Páginas de Terminales (`/terminales/[slug]`)

**Fuente de datos:** `/terminals` (detalle con ubicación) + `/commodities_prices_all` (precios en esa terminal)

**Contenido:**
- Nombre, nickname, código
- Ubicación: sistema > planeta > ciudad/estación
- Facción
- Tipo (commodity, etc.)
- Visibilidad (hidden location o no)
- Max container size

**Sección comercial:**
- Mercancías que puedes comprar aquí (filtradas de prices_all donde id_terminal match y price_buy > 0)
- Mercancías que puedes vender aquí (price_sell > 0)
- "Rutas desde esta terminal" — CTA a mejor ruta con terminal preseleccionada

**Criterio de indexación:** Solo terminales con type="commodity" Y que aparezcan en al menos 2 price records. Terminales sin actividad comercial → noindex.

**Open Question:** El endpoint `/terminals` devuelve ~gran cantidad de terminales. ¿Cuántas tienen type="commodity" y precios asociados? Verificar en runtime antes de generar sitemap entries.

### Páginas de Ubicaciones (`/ubicaciones/[slug]`)

**Evaluación:** Los datos disponibles en `/terminals` incluyen `star_system_name`, `planet_name`, `city_name`, `space_station_name`. Se pueden agrupar terminales por ubicación.

**Criterio de viabilidad:**
- Solo crear páginas de ubicación si agrupan ≥ 3 terminales comerciales activas.
- Contenido: lista de terminales en esa ubicación + mercancías disponibles + resumen de actividad comercial.
- Nivel de jerarquía: sistemas > planetas/estaciones. Solo crear el nivel que tenga suficiente densidad.

**Open Question:** Verificar cuántas ubicaciones cumplen el criterio de ≥3 terminales con datos de precios. Si <10, podría no justificar una sección dedicada.

---

## Tools Strategy

### Herramientas Existentes (Mejoras)

#### Mejor Ruta — Mejoras Propuestas

1. **Deep-linking:** Soportar query params (`?ship=X&investment=Y&commodity=Z`) para que las páginas de datos puedan enlazar directamente con parámetros preseleccionados.
2. **Demanda corregida:** Actualmente usa `scu_sell` como techo de demanda. Según la documentación UEX, `scu_sell` es frecuentemente 0 — usar `scu_sell_stock` (o `scu_sell_avg` como fallback) para no descartar terminales válidas.
3. **Terminal de origen/destino:** Añadir filtro opcional para fijar terminal de compra o venta (útil desde páginas de terminales).
4. **Métricas adicionales en resultados:** profit/SCU, ROI (%).

#### Organizador de Carga — Mejoras Propuestas

1. **Cálculo de totales:** Mostrar SCU totales asignados vs capacidad de nave seleccionada.
2. **Estimación de beneficio:** Si los datos de precios están disponibles, calcular beneficio estimado por destino.
3. **Selección de nave:** Añadir selector de nave con capacidad para mostrar fill percentage.

### Herramientas Nuevas

#### Comparador de Naves (`/comparador-de-naves`)

**Funcionalidad:**
- Selector de 2-4 naves para comparar lado a lado.
- Tabla comparativa: SCU, crew, fabricante, pad type, container sizes, dimensiones, combustible.
- Sección comercial: potencial de carga, container sizes compatibles.
- "Ganancia estimada por viaje" usando la mejor ruta disponible para cada nave.

**Implementación:**
- Server page fetches vehicles + prices_all.
- Client component con multi-select de naves.
- Cálculo de "mejor ruta" simplificado para cada nave (top-1 de `buildCandidateRoutes` + `rankRoutes`).

**CTA por nave:** "Ver detalle de {nave}" → `/naves/[slug]`, "Calcular rutas" → `/mejor-ruta?ship={id}`.

#### Calculadora de Rentabilidad (`/calculadora-rentabilidad`)

**Funcionalidad:**
- Inputs: nave, commodity, terminal de compra, terminal de venta.
- Resultado: capital requerido, ingresos, beneficio, beneficio/SCU, ROI, SCU transportables.
- Preseleccionable via query params desde páginas de datos.

**Diferencia con Mejor Ruta:** Mejor Ruta busca la MEJOR ruta automáticamente. La calculadora permite al usuario verificar una ruta específica que ya tiene en mente.

**Implementación:**
- Server page fetches MarketData (mismo patrón que mejor-ruta).
- Client component con selects encadenados (nave → commodity → terminales que tienen esa commodity).
- Cálculo puro: `qty = floor(min(shipScu, investment/priceBuy, supply, demand))`, profit = qty × (sellPrice - buyPrice).

---

## Content Strategy

### Guías — Expansión

**Arquitectura propuesta:** Mantener file-based pages (sin CMS) pero adoptar un registry pattern similar al de wiki para facilitar índice/búsqueda.

**Guías priorizadas (por valor SEO + utilidad):**

| # | Título | Slug | Keywords Target |
|---|--------|------|-----------------|
| 1 | Cómo empezar en comercio en Star Citizen | como-empezar-en-comercio | ✅ Existe |
| 2 | Cómo encontrar rutas comerciales rentables | como-encontrar-rutas-rentables | rutas comerciales star citizen |
| 3 | Qué significa SCU en Star Citizen | que-es-scu | scu star citizen significado |
| 4 | Cómo elegir nave para comercio | como-elegir-nave-comercio | mejor nave comercio star citizen |
| 5 | Cómo maximizar beneficio por SCU | maximizar-beneficio-scu | maximizar ganancias star citizen |
| 6 | Cómo funciona el precio de las commodities | como-funcionan-precios | precios star citizen economía |
| 7 | Cómo utilizar SCG para encontrar rutas | tutorial-scg-rutas | guía herramientas star citizen |
| 8 | Cómo planificar una operación de carga | planificar-operacion-carga | operación carga star citizen |
| 9 | Seguridad en rutas comerciales | seguridad-rutas-comerciales | piratería star citizen comercio |
| 10 | Cómo utilizar el organizador de carga | tutorial-organizador-carga | organizar carga star citizen |

**Criterio de calidad:**
- Mínimo 1000 palabras de contenido original.
- Al menos 3 enlaces internos a herramientas/datos.
- Incluir datos reales del juego (no información genérica).
- Actualizar la fecha cuando cambie la versión del juego.
- Incluir structured data `Article`.

### Wiki — Evolución

**Estado actual:** Solo categoría "Naves" activa en el registry.

**Propuesta:** Las naves se migran a `/naves/[slug]` (sección propia con más peso SEO). La wiki se redefine como hub de referencia rápida para entidades que no justifican sección propia (ej: tipos de mercancía, facciones, sistemas cuando hay poca data).

**Nuevas categorías wiki potenciales:**
- Facciones (cuando UEX tenga más datos)
- Tipos de mercancía (agrupar por id_parent)

---

## Internal Linking Strategy

### Principio

Cada página debe enlazar a al menos 3 otras páginas relevantes. Las conexiones deben ser naturales y útiles para el usuario.

### Matriz de enlaces

| Desde | Hacia |
|-------|-------|
| Nave | Mercancías compatibles, Terminales donde comprar nave, Mejor ruta con esa nave, Guía "elegir nave" |
| Mercancía | Terminales donde comprar/vender, Naves recomendadas, Mejor ruta con esa mercancía, Guía "precios" |
| Terminal | Mercancías disponibles, Naves comprables/alquilables, Rutas desde/hacia, Ubicación padre |
| Guía | Herramientas mencionadas, Mercancías/naves de ejemplo, Otras guías relacionadas |
| Mejor Ruta | Resultados enlazan a nave, mercancía, terminales de cada ruta |
| Home | Todas las secciones principales, guías destacadas, herramientas |

### Breadcrumbs

Componente reutilizable `<Breadcrumbs>` para todas las páginas con profundidad >1:
- `/naves/aurora-cl` → Inicio > Naves > Aurora CL
- `/mercancia/laranite` → Inicio > Mercancía > Laranite
- `/guias/como-empezar-en-comercio` → Inicio > Guías > Cómo empezar en comercio

Incluir structured data `BreadcrumbList` en JSON-LD.

---

## AdSense Readiness

### Estado Actual
- Script de AdSense cargado en root layout (publisher `ca-pub-5806249940542763`).
- `ads.txt` en `/public/ads.txt` correctamente configurado.
- Páginas legales existentes: privacidad, términos, sobre nosotros, contacto.
- Guía editorial creada.

### Requisitos Pendientes
1. **Más contenido original:** Las páginas de datos (naves, mercancías, terminales) deben tener contexto editorial, no solo tablas de datos.
2. **Navegación clara completa:** ✅ Ya implementado (header con todas las secciones).
3. **Experiencia móvil:** Verificar responsive en todas las nuevas páginas.
4. **Performance:** Asegurar LCP < 2.5s, CLS < 0.1 en mobile.
5. **Sin páginas vacías:** No crear páginas de entidades que no tengan suficientes datos.
6. **Atribución de datos:** Cada página que muestre datos de UEX debe indicar la fuente.

### Arquitectura de Ad Slots

**Componente reutilizable:**

```typescript
// app/components/AdSlot.tsx
interface AdSlotProps {
  placement: "content-top" | "content-middle" | "content-bottom" | "sidebar" | "between-sections";
  className?: string;
}
```

**Reglas de colocación:**
- Máximo 1 ad entre contenido principal (no interrumpir herramientas).
- 1 ad en sidebar (páginas con layout de contenido).
- 1 ad after-content (antes del footer de la página).
- NUNCA ads dentro de resultados de herramientas (tablas de rutas, precios).
- Ads no deben empujar contenido above-the-fold fuera de la vista.

**Implementación:** El componente renderiza un `<div>` con clase identificadora + data attribute. AdSense Auto-Ads se encarga del fill. Si se necesita más control, migrar a ad units manuales.

---

## Monetization Strategy

### Fase 1: AdSense (Actual)

Objetivo: Aprobación y monetización básica con tráfico orgánico.

### Fase 2: Freemium (Futuro)

**Arquitectura preparatoria** — no implementar pagos, pero diseñar para que sea posible sin refactoring:

#### Modelo de datos conceptual

```typescript
interface User {
  id: string;
  email: string;
  plan: "free" | "pro";
  createdAt: Date;
}

interface Subscription {
  userId: string;
  plan: "pro";
  status: "active" | "cancelled" | "expired";
  startDate: Date;
  endDate: Date;
}

interface FeatureFlag {
  key: string;
  requiredPlan: "free" | "pro";
}
```

#### Feature Split

| Feature | Free | Pro |
|---------|------|-----|
| Mejor Ruta (básico) | ✅ | ✅ |
| Mercancía consulta | ✅ | ✅ |
| Organizador carga | ✅ | ✅ |
| Guías | ✅ | ✅ |
| Wiki/Datos | ✅ | ✅ |
| Guardar rutas favoritas | ❌ | ✅ |
| Historial de rutas | ❌ | ✅ |
| Alertas de precios | ❌ | ✅ |
| Filtros avanzados | ❌ | ✅ |
| Comparación de naves (>2) | ❌ | ✅ |
| Dashboard personalizado | ❌ | ✅ |
| Sin publicidad | ❌ | ✅ |

#### Preparación arquitectural

1. **Feature flags:** Crear un módulo `lib/features.ts` con `isFeatureAvailable(feature, plan)`. Inicialmente todo devuelve `true` (no hay auth).
2. **Componente gate:** `<ProFeature fallback={<UpgradePrompt />}>` que envuelve features premium. En la fase actual renderiza directamente el children (no bloquea nada).
3. **Estructura de DB:** No implementar DB todavía. Documentar el schema para cuando se adopte (Supabase, Planetscale, etc.).

**Open Question:** ¿Qué provider de auth/pagos se usará? Opciones: Supabase Auth + Stripe, Clerk + Stripe, Auth.js + Lemon Squeezy. Decisión no necesaria hasta Fase 5.

---

## Analytics

### Estado Actual

**No existe ninguna implementación de analytics.**

### Propuesta

**Solución recomendada:** Google Analytics 4 (GA4) — coherente con el ecosistema Google (ya se usa AdSense) y gratuito.

**Alternativa privacy-first:** Plausible o Umami (self-hosted). Menor fricción legal pero menos integración con AdSense.

**Implementación GA4:**

```typescript
// app/layout.tsx - añadir Google Analytics script
<Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
<Script id="ga4-init" strategy="afterInteractive">
  {`window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');`}
</Script>
```

**Eventos a trackear:**

| Evento | Trigger | Datos |
|--------|---------|-------|
| page_view | Automático | page_path, page_title |
| tool_used | Submit en herramienta | tool_name (mejor-ruta, comparador, calculadora) |
| route_calculated | Resultado de mejor-ruta | ship_name, investment_amount, routes_found |
| commodity_viewed | Visita a /mercancia/[slug] | commodity_name |
| ship_viewed | Visita a /naves/[slug] | ship_name |
| terminal_viewed | Visita a /terminales/[slug] | terminal_name |
| guide_viewed | Visita a /guias/[slug] | guide_slug |
| cta_clicked | Click en CTA principal | cta_location, cta_destination |
| comparison_made | Comparación de naves | ships_compared (array) |

**No recopilar:** Datos personales, IPs identificables, información de formularios.

---

## Performance

### Estrategia Actual (Mantener)

- **Server Components** por defecto para data fetching.
- **Client Components** solo donde hay interactividad (RouteFinder, FiltersSidebar, Mercancia search, etc.).
- **ISR** vía `next: { revalidate }` — no regeneración bajo demanda, solo time-based.
- **No fan-out:** Usar bulk endpoints (`*_all`) siempre que sea posible.
- **`Promise.allSettled`** para requests paralelos (resiliente a fallos parciales).

### Optimizaciones Propuestas

1. **Imágenes de naves:** Usar `next/image` con `width`/`height` explícitos para las fotos de vehículos (evitar CLS). Configurar `remotePatterns` en next.config.ts para el dominio de imágenes UEX.

2. **Bundle splitting:** Las páginas de datos son Server Components puros (no envían JS al cliente excepto los componentes interactivos mínimos como tablas paginadas).

3. **Static generation para guías:** Las guías son contenido estático — se generan en build time. No necesitan revalidate.

4. **Lazy load de componentes pesados:**
   - `RouteResults` → importar dinámicamente solo tras el submit.
   - Tablas de precios en /mercancia/[slug] → considerar `loading="lazy"` si son below-the-fold.

5. **Core Web Vitals targets:**
   - LCP < 2.5s (la home actual tiene YouTube embed que puede dañar LCP — considerar poster image)
   - CLS < 0.1 (definir aspect-ratios para imágenes/video, usar `loading.tsx` para skeleton layouts)
   - INP < 200ms (las interacciones son simples selects/buttons — debería cumplirse)

6. **Caché compartido de datos:** Actualmente cada ruta que llama `fetchCommodities()` o `fetchTerminals()` comparte la caché de Next.js (mismo URL + revalidate). Esto ya es eficiente — Next.js deduplica fetch requests en el mismo render tree.

### Rate Limit Protection

- Budget: 120 req/min.
- Con revalidate de 30min-1h, la frecuencia real de requests a UEX es ~6-10 req/hora (una vez por dataset cuando expira).
- Las nuevas páginas de datos NO deben generar requests adicionales si reutilizan los mismos endpoints ya cacheados.
- **Regla:** Cada nuevo Server Component que necesite datos UEX debe consumir uno de los bulk endpoints existentes y filtrar client-side, o reutilizar un fetch ya existente con el mismo path (Next.js lo deduplica en el mismo request).

---

## Technical Architecture

### Módulos compartidos (propuestos)

```
lib/
├── uex/
│   ├── client.ts        ← Shared fetchUexList<T> helper (extraer de mejor-ruta/uex-api.ts)
│   ├── commodities.ts   ← fetchCommodities, fetchAllPrices
│   ├── terminals.ts     ← fetchTerminals (full)
│   ├── vehicles.ts      ← fetchVehicles, fetchPurchasePrices, fetchRentalPrices
│   └── types.ts         ← Unified UEX response types
├── seo/
│   ├── metadata.ts      ← Helpers para generateMetadata consistente
│   ├── json-ld.ts       ← Builders de structured data
│   └── breadcrumbs.tsx  ← Componente de breadcrumbs
├── features/
│   └── flags.ts         ← Feature flag system (preparación freemium)
└── analytics/
    └── events.ts        ← Funciones de tracking tipadas
```

### Consolidación de API Clients

Actualmente existen 4 archivos `uex-api.ts` con lógica duplicada. Propuesta:
1. Extraer `fetchUexList<T>(path, revalidate)` a `lib/uex/client.ts`.
2. Cada feature importa desde `lib/uex/` en lugar de tener su propia implementación.
3. Mantener un único punto de configuración para base URL, headers, y TTLs.

**Beneficio:** Cambios en la API (URL, auth, rate limit) se aplican en un solo lugar.

### Generación de páginas dinámicas

Para `/naves/[slug]`, `/mercancia/[slug]`, `/terminales/[slug]`:

```typescript
// Patrón para cada sección
export async function generateStaticParams() {
  const items = await fetchEntities();
  return items.map(item => ({ slug: toSlug(item.name) }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  // Metadata dinámica con OG, canonical, etc.
}

export default async function Page({ params }) {
  // Server Component: fetch + render
}
```

### Shared Component Library (propuesta)

```
app/components/
├── AdSlot.tsx           ← Ad placement wrapper
├── Breadcrumbs.tsx      ← Navigation breadcrumbs + JSON-LD
├── DataAttribution.tsx  ← "Datos: UEX Corp (comunidad)" footer
├── EntityCard.tsx       ← Card reutilizable para grids de entidades
├── PriceTable.tsx       ← Tabla de precios genérica (refactor de TablaPrecios)
├── RelatedRoutesCTA.tsx ← CTA "Calcular rutas" reutilizable
├── JsonLd.tsx           ← Wrapper para inyectar structured data
└── ... (existentes)
```

---

## Implementation Phases

### FASE 1 — SEO Foundation (1-2 semanas)

**Objetivo:** Establecer la infraestructura SEO técnica que todas las fases posteriores necesitan.

**Tareas:**
1. Crear `app/sitemap.ts` con todas las rutas estáticas y dinámicas existentes.
2. Crear `app/robots.ts`.
3. Crear `app/not-found.tsx` (404 page con navegación y búsqueda).
4. Crear `app/error.tsx` (error boundary global).
5. Añadir `generateMetadata` con OG + Twitter a: `/mercancia/[name]`, `/wiki/[category]/[slug]`.
6. Crear componente `<Breadcrumbs>` con JSON-LD.
7. Crear componente `<JsonLd>` genérico.
8. Añadir `WebSite` + `SearchAction` structured data en la home.
9. Configurar `next.config.ts` con `remotePatterns` para imágenes de UEX.
10. Crear `lib/seo/metadata.ts` con helpers de metadata.

**Dependencias:** Ninguna externa.
**Riesgos:** Bajo. Cambios aditivos que no afectan funcionalidad existente.
**Criterios de aceptación:** 
- Lighthouse SEO score > 95
- sitemap.xml accesible y válido
- robots.txt correcto
- Todas las páginas existentes tienen metadata completa
- 404 y error pages funcionales

---

### FASE 2 — Data Pages: Naves (2-3 semanas)

**Objetivo:** Crear la sección `/naves` como primera sección de datos indexable con contenido enriquecido.

**Tareas:**
1. Consolidar API: extraer `lib/uex/client.ts` y `lib/uex/vehicles.ts`.
2. Crear `app/naves/page.tsx` — índice de naves con grid filtrable (por fabricante, tipo, SCU).
3. Crear `app/naves/[slug]/page.tsx` — detalle de nave con specs, imágenes, precios, sección comercial.
4. Migrar lógica de `app/wiki/categories/naves.ts` → nuevo formato enriquecido.
5. Implementar `generateStaticParams` + `generateMetadata` para `/naves/[slug]`.
6. Añadir JSON-LD `Product` schema.
7. Añadir sección "Potencial comercial" con top rutas server-side.
8. Crear redirect 301 `/wiki/naves/[slug]` → `/naves/[slug]`.
9. Actualizar sitemap con ~180 URLs de naves.
10. Crear componente `<DataAttribution>`.
11. Añadir breadcrumbs.
12. Internal links: desde naves → mercancías, terminales, mejor-ruta.

**Dependencias:** Fase 1 (metadata helpers, breadcrumbs, JSON-LD).
**Riesgos:** Medio. Rompe la wiki existente para naves (necesita redirect). Los datos de imágenes de UEX pueden tener URLs rotas.
**Criterios de aceptación:**
- `/naves` muestra grid de ~180 naves de carga/combate con filtros
- Cada `/naves/[slug]` tiene contenido único (specs + precios + rutas)
- URLs antiguas de wiki redirigen correctamente
- Metadata + OG + JSON-LD presentes en cada página
- No se hace fan-out de requests (bulk endpoints)

---

### FASE 3 — Data Pages: Mercancías + Terminales (2-3 semanas)

**Objetivo:** Enriquecer mercancías existentes y crear sección de terminales.

**Tareas:**
1. Enriquecer `/mercancia/[slug]`:
   - Añadir cabecera con tipo, código, legalidad, peso.
   - Añadir indicadores (mejor precio compra, mejor precio venta, spread).
   - Añadir naves recomendadas por container_size.
   - Añadir CTA "Buscar rutas con esta mercancía".
   - Implementar `generateMetadata`.
   - Añadir JSON-LD + breadcrumbs.
2. Consolidar API terminals: `lib/uex/terminals.ts` con tipado enriquecido.
3. Crear `app/terminales/page.tsx` — índice filtrable (por sistema, planeta, facción).
4. Crear `app/terminales/[slug]/page.tsx` — detalle con mercancías comprables/vendibles.
5. Implementar criterio de indexación (noindex si <2 commodities activas).
6. `generateStaticParams` + `generateMetadata` + JSON-LD + breadcrumbs.
7. Actualizar sitemap.
8. Internal links bidireccionales (terminal ↔ mercancía ↔ nave).

**Dependencias:** Fase 1 + parcialmente Fase 2 (lib/uex consolidado).
**Riesgos:** Medio. La cantidad de terminales puede ser muy grande — necesita paginación o filtrado agresivo para no crear demasiadas páginas thin.
**Criterios de aceptación:**
- `/mercancia/[slug]` muestra info enriquecida con spread, naves, CTA
- `/terminales` muestra grid filtrable
- Cada `/terminales/[slug]` con datos comerciales tiene contenido útil
- Terminales sin datos → noindex o no generadas
- Performance: no nuevos requests a UEX (reutiliza cache)

---

### FASE 4 — Tools: Comparador + Calculadora (2 semanas)

**Objetivo:** Añadir dos herramientas nuevas que complementen Mejor Ruta.

**Tareas:**
1. Crear `app/comparador-de-naves/page.tsx` + client component.
2. Implementar lógica de comparación (tabla lado a lado + estimación de ganancia).
3. Crear `app/calculadora-rentabilidad/page.tsx` + client component.
4. Implementar calculadora con selects encadenados + resultado detallado.
5. Añadir deep-linking a Mejor Ruta (query params `?ship=X&commodity=Y`).
6. Corregir demanda en route-engine: usar `scu_sell_stock` como fallback cuando `scu_sell=0`.
7. Actualizar navegación (header + footer) con nuevas herramientas.
8. SEO: metadata estática + schema WebApplication para herramientas.
9. Tests para nuevas funcionalidades.

**Dependencias:** Fase 2 (lib/uex consolidado), Fase 1 (SEO).
**Riesgos:** Bajo-medio. Las herramientas son client-side computation, riesgos principalmente de UX.
**Criterios de aceptación:**
- Comparador permite 2-4 naves lado a lado con todas las specs + ganancia estimada
- Calculadora resuelve profit/ROI para una ruta manual específica
- Deep-linking funciona desde páginas de datos hacia herramientas
- Tests cubren cálculos core

---

### FASE 5 — Content: Guías + Analytics + AdSense (2-3 semanas)

**Objetivo:** Expandir contenido editorial, implementar analytics y preparar para re-solicitud de AdSense.

**Tareas:**
1. Escribir 5-8 guías adicionales (de la tabla de priorización).
2. Crear registry de guías para índice automático + búsqueda.
3. Implementar GA4 en root layout.
4. Crear `lib/analytics/events.ts` con funciones tipadas de tracking.
5. Añadir eventos de tracking en herramientas y páginas de datos.
6. Crear componente `<AdSlot>` reutilizable.
7. Integrar ad slots en posiciones estratégicas (content-top, between-sections, sidebar).
8. Auditoría de rendimiento mobile (Lighthouse).
9. Verificar que ninguna página esté vacía o tenga contenido insuficiente.
10. Añadir `<DataAttribution>` en todas las páginas con datos de UEX.

**Dependencias:** Fases 1-4 (necesita páginas creadas para colocar ads y verificar content quality).
**Riesgos:** Medio. La aprobación de AdSense depende de revisión manual de Google — no hay garantía de primera.
**Criterios de aceptación:**
- ≥8 guías publicadas con >1000 palabras cada una
- GA4 trackea page_views y custom events
- AdSlots renderizados sin dañar UX/performance
- Lighthouse Performance > 85, SEO > 95, Accessibility > 90 (mobile)
- Todas las páginas con content tienen >300 palabras únicas

---

### FASE 6 — Monetization Readiness (1-2 semanas)

**Objetivo:** Preparar la arquitectura para el futuro modelo freemium sin implementar auth ni pagos.

**Tareas:**
1. Crear `lib/features/flags.ts` con sistema de feature flags.
2. Crear componente `<ProFeature>` wrapper.
3. Crear componente `<UpgradePrompt>` (CTA genérico para futura suscripción).
4. Documentar schema de DB para users/subscriptions.
5. Identificar y marcar features que serán Pro en el código (con flags que por ahora devuelven `true`).
6. Diseñar página `/precios` (pricing page) como placeholder/coming-soon.
7. Preparar la UX de "guardar favoritos" / "historial" usando localStorage como MVP (migrable a DB después).

**Dependencias:** Fases 1-5 completas.
**Riesgos:** Bajo. Son preparaciones sin impacto en usuarios actuales.
**Criterios de aceptación:**
- Feature flags configurables centralmente
- ProFeature wrapper no bloquea nada actualmente
- localStorage MVP para favoritos funciona
- Documentación de schema lista para futura implementación

---

## Risks

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| UEX API cambia o se cae | Media | Alto | Todos los clients ya manejan errores gracefully. Añadir monitoring. |
| Rate limit excedido con nuevas páginas | Baja | Medio | Reutilizar cache de Next.js, no crear nuevos fetch paths innecesarios. |
| AdSense rechaza de nuevo | Media | Medio | Seguir las directrices paso a paso, no solicitar hasta tener suficiente contenido. |
| Terminales con thin content | Alta | Bajo | Aplicar criterio de noindex estricto. No generar páginas vacías. |
| Imágenes de naves con URLs rotas | Media | Bajo | Fallback placeholder image + next/image error handling. |
| Performance degradada con más páginas | Baja | Medio | Todo es ISR — las páginas se generan una vez y se sirven desde CDN. |
| Breaking changes en Next.js 16 | Baja | Alto | Ya documentado en AGENTS.md. Seguir guías de node_modules/next/dist/docs/. |
| Datos de UEX desactualizados vs juego | Alta | Bajo | Disclaimer visible + DataAttribution en todas las páginas. No es controlable. |

---

## Acceptance Criteria (Globales)

1. **No se rompe nada existente.** Todas las herramientas actuales siguen funcionando tras cada fase.
2. **Build exitoso.** `next build` pasa sin errores tras cada fase.
3. **Tests pasan.** `vitest --run` pasa sin regresiones.
4. **Performance.** Lighthouse Performance > 80, SEO > 90 en mobile para todas las páginas nuevas.
5. **No fan-out.** Ninguna nueva funcionalidad genera más de 1 request por endpoint por ciclo de revalidación.
6. **Contenido útil.** Cada página indexable tiene >300 palabras de contenido único (no solo datos tabulares).
7. **Mobile responsive.** Todas las nuevas páginas son usables en 375px viewport.
8. **Accesibilidad.** Lighthouse Accessibility > 85 en todas las páginas nuevas.

---

## Future Roadmap (Post-Fase 6)

1. **Auth + DB:** Implementar Supabase Auth (o similar) + base de datos para users/subscriptions.
2. **Stripe/Payments:** Integrar procesamiento de pagos para Plan Pro.
3. **Alertas de precios:** Sistema de notificaciones cuando un commodity alcanza un precio target.
4. **Dashboard personalizado:** Panel del usuario con rutas guardadas, historial, naves favoritas.
5. **API propia:** Endpoints internos para guardar/recuperar datos del usuario.
6. **Internacionalización (i18n):** Expandir a inglés (mercado mucho mayor) si el proyecto crece.
7. **PWA:** Service worker para uso offline de herramientas.
8. **Commodity price history charts:** Gráficos temporales si UEX ofrece endpoint de históricos.
9. **Collaborative routes:** Compartir rutas vía URL corta.
10. **Mobile app:** React Native o Capacitor wrapper si la PWA no es suficiente.

---

## Open Questions

1. **Densidad de ubicaciones:** ¿Cuántas ubicaciones (sistemas/planetas) agrupan ≥3 terminales comerciales activas? Verificar en runtime para decidir si `/ubicaciones` justifica una sección.
2. **Provider de auth/pagos:** ¿Supabase, Clerk, Auth.js? ¿Stripe, Lemon Squeezy? Decisión no necesaria hasta Fase 6.
3. **GA4 vs Plausible:** ¿Preferencia por privacidad (Plausible) o integración con Google (GA4)?
4. **Dominio de imágenes UEX:** ¿Las URLs de `url_photo`/`url_photos` apuntan a un CDN estable? Verificar antes de configurar `remotePatterns`.
5. **Wiki post-migración:** ¿Qué queda en `/wiki` una vez que naves se migra a `/naves`? ¿Se mantiene como hub genérico o se depreca?
6. **Ubicaciones sin endpoint dedicado:** Los datos de ubicación vienen embebidos en `/terminals`. ¿Hay suficiente riqueza para páginas standalone o solo como contexto dentro de terminales?
7. **Guías: ¿quién escribe el contenido?** ¿Se genera editorialmente o con asistencia de IA + revisión?

---

## Implementation Order

Lista ordenada de tareas para ejecución secuencial:

### Fase 1 — SEO Foundation
1. Crear `lib/seo/metadata.ts` — helpers de metadata reutilizables.
2. Crear `lib/seo/json-ld.ts` — builders de structured data.
3. Crear `app/components/Breadcrumbs.tsx` + JSON-LD `BreadcrumbList`.
4. Crear `app/components/JsonLd.tsx` — wrapper genérico.
5. Crear `app/robots.ts`.
6. Crear `app/sitemap.ts` (rutas estáticas + dinámicas existentes).
7. Crear `app/not-found.tsx`.
8. Crear `app/error.tsx`.
9. Añadir `generateMetadata` a `/mercancia/[name]/page.tsx`.
10. Añadir `generateMetadata` a `/wiki/[category]/[slug]/page.tsx`.
11. Añadir OG metadata al root layout metadata.
12. Configurar `next.config.ts` con `images.remotePatterns`.

### Fase 2 — Data Pages: Naves
13. Crear `lib/uex/client.ts` — extraer helper compartido.
14. Crear `lib/uex/vehicles.ts` — funciones de vehículos consolidadas.
15. Crear `app/naves/page.tsx` — índice con grid filtrable.
16. Crear `app/naves/[slug]/page.tsx` — detalle enriquecido.
17. Implementar sección "Potencial comercial" con top rutas.
18. Migrar datos de wiki/naves → nueva sección.
19. Crear middleware redirect 301 `/wiki/naves/*` → `/naves/*`.
20. Crear `app/components/DataAttribution.tsx`.
21. Actualizar sitemap con naves.
22. Añadir breadcrumbs a `/naves/[slug]`.
23. Internal links desde naves hacia mercancías + herramientas.

### Fase 3 — Data Pages: Mercancías + Terminales
24. Crear `lib/uex/terminals.ts` — terminal data consolidado.
25. Crear `lib/uex/commodities.ts` — commodity data consolidado.
26. Enriquecer `/mercancia/[slug]` — cabecera, spread, naves recomendadas, CTA.
27. Añadir `generateMetadata` + JSON-LD a `/mercancia/[slug]`.
28. Crear `app/terminales/page.tsx` — índice filtrable.
29. Crear `app/terminales/[slug]/page.tsx` — detalle con mercancías.
30. Implementar criterio noindex para terminales sin datos.
31. `generateStaticParams` para terminales.
32. Actualizar sitemap con mercancías + terminales.
33. Internal links bidireccionales.
34. Breadcrumbs en nuevas páginas.

### Fase 4 — Tools
35. Crear `app/comparador-de-naves/page.tsx` + client component.
36. Implementar lógica de comparación + estimación de ganancia.
37. Crear `app/calculadora-rentabilidad/page.tsx` + client component.
38. Implementar calculadora de rentabilidad.
39. Añadir deep-linking (query params) a Mejor Ruta.
40. Corregir `scu_sell` → `scu_sell_stock` fallback en route-engine.
41. Actualizar navegación global.
42. Tests para nuevas herramientas.

### Fase 5 — Content + Analytics + AdSense
43. Implementar GA4 en root layout.
44. Crear `lib/analytics/events.ts`.
45. Añadir tracking events en herramientas y páginas de datos.
46. Escribir guías 2-8 (contenido editorial).
47. Crear registry de guías para índice automático.
48. Crear `app/components/AdSlot.tsx`.
49. Integrar ad slots en páginas estratégicas.
50. Auditoría mobile + performance fix.
51. Añadir `<DataAttribution>` en todas las páginas de datos.

### Fase 6 — Monetization Readiness
52. Crear `lib/features/flags.ts`.
53. Crear `app/components/ProFeature.tsx` + `UpgradePrompt.tsx`.
54. Implementar "guardar favoritos" con localStorage.
55. Documentar schema de DB (users, subscriptions, saved_routes).
56. Crear página `/precios` (coming soon).
57. Marcar features Pro en el código con flags.
