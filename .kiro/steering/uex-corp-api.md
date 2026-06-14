---
inclusion: fileMatch
fileMatchPattern: "**/{uex-api,types}.ts"
---

# UEX Corp API 2.0 — Reference

Reference for integrating the UEX Corp API in this project (mercancía, terminales, mejor-ruta). Source: https://uexcorp.space/api/documentation. Data is community-crowdsourced and may not match live servers; structures are stable but can evolve between API versions.

## Connection basics

- **Base URL:** `https://api.uexcorp.uk/2.0/{resource}/`
- **Format:** `application/json` — successful responses are `{ "status": "ok", "data": ... }`.
- **Auth:** Bearer Token, BUT the read endpoints this project uses are **public (no token)**: `commodities`, `commodities_prices`, `commodities_prices_all`, `terminals`, `vehicles`. The UEX docs mark these "Autorização: —".
- **Methods:** GET, POST, DELETE (we only use GET).
- **Rate limit:** **120 requests/minute** (172,800/day). Avoid fan-out request patterns (e.g. one request per commodity) — prefer the bulk `*_all` endpoints.
- **Pricing:** commodity prices are **per SCU**; default average window is 15 days.
- Optional `X-Client-Version` header if a key has client-version lock enabled (not used here).

### Response status values
| Status | Meaning |
| --- | --- |
| `ok` | success; payload in `data` |
| `error` (with `http_code`, `message`) | internal error |
| `requests_limit_reached` | rate limit hit (back off) |

### Request URL parameter styles (both supported)
- Query string: `?{p1}={v1}&{p2}={v2}`
- Path pairs: `/{resource}/{p1}/{v1}/{p2}/{v2}/`

## Client conventions in this repo

All UEX calls live in `*/uex-api.ts` modules. Follow these rules:

- Use `fetch` with `next: { revalidate: <seconds> }` (this project does NOT enable Cache Components, so the `revalidate` model applies — see `node_modules/next/dist/docs/`).
- Send `headers: { Accept: "application/json" }`. **Do NOT send an Authorization header** for the public read endpoints.
- **Never throw.** On any thrown error or non-2xx status, log and return `[]`.
- Read the array from `json.data ?? []`.
- Aggregate multiple datasets with `Promise.allSettled` so one failed endpoint does not break the others.
- Suggested cache TTLs: lists (`commodities`, `terminals`, `vehicles`) ~1h; prices ~30min (matches the endpoints' own TTL).

## Endpoints used by this project

### GET /commodities
List of all commodities (~205 rows). Includes global indicative `price_buy`/`price_sell` (NOT per-terminal — use the prices endpoints for trading).
Key fields: `id`, `id_parent` (commodity type/group), `name`, `code`, `kind`, `weight_scu`, `price_buy`, `price_sell`, `is_buyable`, `is_sellable`, `is_illegal`, `wiki`.

### GET /commodities_prices  ⚠️ requires a parameter
Per-terminal prices for a **specific** commodity/terminal. **Calling it with NO parameter returns HTTP 400** (this was the original "no market data" bug). Always pass a filter such as `?id_commodity=N`, `?commodity_name=X`, or `?id_terminal=N`.
Rich payload: includes `commodity_name`, `terminal_name`, `id_faction`, `faction_name`, location names, `container_sizes`, plus min/max/avg/week/month variants of price and scu.

### GET /commodities_prices_all  ✅ preferred for bulk
**Every commodity price at every terminal in ONE request** (~2,590 rows, ~1 MB, no params, no auth, 30-min TTL, hourly updates). This is what `mejor-ruta` uses to avoid ~205 per-commodity calls and the rate limit.
Output fields (REDUCED set): `id`, `id_commodity`, `id_terminal`, `price_buy`, `price_buy_avg`, `price_sell`, `price_sell_avg`, `scu_buy`, `scu_buy_avg`, `scu_sell_stock`, `scu_sell_stock_avg`, `scu_sell`, `scu_sell_avg`, `status_buy`, `status_sell`, `container_sizes`, `quality`, `date_added`, `date_modified`, `commodity_name`, `terminal_name`.
**Missing vs `/commodities_prices`:** `id_faction`, `faction_name`, and location-name fields. Treat those as optional/undefined when consuming this endpoint.

### GET /terminals
List of all terminals (~large, ~1 MB). Key fields: `id`, `name`, `nickname`, `code`, `type` (`"commodity"` = trading terminal), `is_visible` (0 ⇒ hidden/Hidden_Location), `is_available`, `id_faction`, `faction_name`, `max_container_size`, location names (`star_system_name`, `planet_name`, `city_name`, `space_station_name`, …).
**No numeric `security_level` field exists** — any security-level data must come from elsewhere.

### GET /vehicles
List of all ships/vehicles (~278 rows). Key fields: `id`, `name`, `name_full`, `scu` (cargo capacity in SCU), `crew`, `is_spaceship`, `is_cargo`, `is_ground_vehicle`, `container_sizes`, `pad_type`, `company_name`.

### Other resources available (not yet used)
`commodities_prices_history`, `commodities_raw_prices_all`, `commodities_averages`, `commodities_alerts`, `categories`, `cities`, `planets`, `moons`, `orbits`, `space_stations`, `outposts`, `poi`, `star_systems`, `factions`, `items`, `components`, `refineries`, `fuel_prices`, `marketplace`, `routes` (price finder). See the docs index for the full list.

## Data-quirk notes (important for trade-route logic)

- **`scu_sell` is frequently 0** even when a terminal has demand; the meaningful figures live in `scu_sell_stock` / `scu_sell_avg`. Treating `scu_sell` as a hard demand cap will filter out most sell terminals. Consider falling back to `scu_sell_stock` (or `scu_sell_avg`) when sizing the sellable quantity.
- **`price_buy` / `price_sell`** on a price row are the *current/last* values; `*_avg` variants are time-averaged. For routes, current values are the player-facing numbers.
- **Buy vs sell semantics:** `price_buy` = price at which the player buys at that terminal (terminal sells to player; `scu_buy` = available supply). `price_sell` = price at which the player sells to that terminal (terminal buys from player; demand ≈ `scu_sell`/`scu_sell_stock`).
- **`container_sizes`** is a comma-separated string (e.g. `"1,2,4,8,16,24,32"`) on both price rows and vehicles — parse to `number[]` if box-size filtering needs real data instead of defaults.
- **Commodity type/group** = `id_parent` on `/commodities` (there is no `commodityType` field on price rows).

## Quick verification (PowerShell)

```powershell
Invoke-WebRequest -Uri "https://api.uexcorp.uk/2.0/commodities_prices_all" -Headers @{Accept="application/json"} -UseBasicParsing
```
A bare `https://api.uexcorp.uk/2.0/commodities_prices` returns **400** — that is expected, not a bug.
