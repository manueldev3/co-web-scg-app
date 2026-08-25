---
name: nextjs-architecture
description: Guides Next.js application architecture decisions including App Router structure, Server vs Client Components, route organization, layouts, loading/error states, and module boundaries. Activate when discussing architecture, structure, App Router, Server Component, Client Component, routing, layout, page, or module organization.
---

# Next.js Architecture

You are a senior Next.js architect. Your role is to make sound structural decisions that balance simplicity, scalability, and maintainability.

## Before Making Any Architectural Decision

1. Read `package.json` to determine the Next.js version installed.
2. Read `next.config.*` for custom configuration.
3. Inspect `app/` or `src/app/` to understand existing route structure.
4. Check `tsconfig.json` for path aliases and configuration.
5. Identify existing patterns — do NOT replace them without justification.
6. If the project uses Pages Router alongside App Router, respect that boundary.

## Server Components (Default)

Every component in the `app/` directory is a Server Component by default. Prefer Server Components unless you need:

- Event handlers (onClick, onChange, onSubmit)
- Browser-only APIs (window, document, localStorage)
- React state (useState, useReducer)
- React effects (useEffect, useLayoutEffect)
- Client-only hooks (useContext with client state, custom hooks with browser deps)

### What to detect and flag

- `"use client"` added to components that only render data
- Client Components wrapping large subtrees unnecessarily
- State management for data that could be fetched server-side
- `useEffect` used to fetch data that could be a server fetch

## Client Components

Add `"use client"` only at the lowest boundary needed. Push it as far down the tree as possible.

### Valid uses

- Interactive forms
- Dropdowns, modals, accordions
- Real-time features (WebSocket, polling)
- Animations tied to user interaction
- Third-party client libraries (maps, editors, charts)

### Pattern: Isolate interactivity

```
// ServerPage.tsx (Server Component)
export default function Page() {
  const data = await fetchData();
  return <ClientInteractiveWidget initialData={data} />;
}
```

## App Router Structure

### Route conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI (required for route to be accessible) |
| `layout.tsx` | Shared UI that wraps children and persists across navigations |
| `loading.tsx` | Instant loading UI while page loads (Suspense boundary) |
| `error.tsx` | Error boundary for the route segment |
| `not-found.tsx` | 404 UI for the segment |
| `template.tsx` | Like layout but remounts on navigation |
| `default.tsx` | Fallback for parallel routes |

### Route groups `(groupName)/`

Use route groups to organize without affecting the URL:
- `(marketing)/` — public pages
- `(dashboard)/` — authenticated pages
- `(auth)/` — login/signup flows

### Dynamic routes

- `[param]` — single dynamic segment
- `[...param]` — catch-all
- `[[...param]]` — optional catch-all

### Parallel routes `@slot`

Use when you need independent loading states for different page sections.

### Intercepting routes `(.)`, `(..)`, `(..)(..)`

Use for modal patterns where you need a route-based modal that can also render as a full page.

## Architecture Decisions

### Where to place logic

| Logic type | Location |
|-----------|----------|
| Data fetching | Server Components, Server Actions, Route Handlers |
| Business logic | `lib/` or `services/` — pure functions, no framework deps |
| Database access | Server-only: Server Components, Server Actions, Route Handlers |
| Form handling | Server Actions (preferred) or Route Handlers |
| Validation | Shared `lib/validations/` — usable on server and client |
| UI utilities | `lib/utils.ts` or co-located with components |
| Type definitions | Co-located or in `types/` for shared types |

### When to create abstractions

Create a new module/hook/utility ONLY when:
- The same logic appears 3+ times
- The abstraction has a clear single responsibility
- It simplifies understanding, not just reduces lines
- It will be tested independently

Do NOT create abstractions for:
- One-time use logic
- Simple conditional rendering
- Trivial data transformations
- "Future proofing"

### Server Actions vs Route Handlers

| Use Server Actions for | Use Route Handlers for |
|----------------------|----------------------|
| Form submissions | External webhooks |
| Data mutations from UI | Third-party API callbacks |
| Progressive enhancement needed | Streaming responses |
| Tightly coupled to a component | Shared API consumed by multiple clients |

## What to Flag During Review

- Components over 300 lines (suggest decomposition)
- Business logic inside components (extract to services)
- Deeply nested folder structure (>4 levels without route groups)
- Mixing concerns in a single file (data + UI + business logic)
- Layout components that fetch data they could receive as children
- Unnecessary barrel files (`index.ts` re-exports adding complexity)
- Circular dependencies between modules
