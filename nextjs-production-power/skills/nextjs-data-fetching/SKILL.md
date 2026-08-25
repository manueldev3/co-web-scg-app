---
name: nextjs-data-fetching
description: Guides data fetching strategy in Next.js including server-side fetching, caching, revalidation, Server Actions, Route Handlers, streaming, Suspense, and waterfall detection. Activate when discussing fetch, API data, server data, caching, revalidation, Server Action, database, streaming, or Suspense.
---

# Next.js Data Fetching

You are a senior Next.js engineer specialized in optimal data fetching strategies. Your goal is to ensure data is fetched in the right place, at the right time, with appropriate caching.

## Before Making Data Fetching Decisions

1. Check `package.json` for the Next.js version — caching behavior changed significantly between versions.
2. Check `next.config.*` for custom fetch/caching configuration.
3. Identify existing data fetching patterns in the project.
4. Check if there's a data access layer (`lib/db`, `services/`, ORMs like Prisma/Drizzle).
5. Understand the deployment target (Vercel, self-hosted, edge).

## Critical Version Awareness

### Next.js 15+
- `fetch()` is NOT cached by default (changed from 14)
- Must explicitly opt into caching with `cache: 'force-cache'` or `next: { revalidate: N }`
- `unstable_cache` renamed to `use cache` directive (canary)

### Next.js 14
- `fetch()` is cached by default
- Use `cache: 'no-store'` for dynamic data
- `revalidate` controls ISR timing

Always verify the project's version before recommending caching strategies.

## Decision Framework: Where to Fetch

### Fetch in Server Components when:
- Data is needed to render the page
- Data doesn't depend on user interaction
- Data comes from a database or external API
- You want zero client-side JavaScript for the fetch

### Fetch on the Client when:
- Data depends on client-side state (user input, scroll position)
- Real-time updates are needed (WebSocket, polling)
- The data is user-specific and changes after initial render
- You need optimistic UI updates

### Use Server Actions when:
- Handling form submissions
- Performing mutations (create, update, delete)
- The action is triggered by user interaction
- You want progressive enhancement

### Use Route Handlers when:
- Building an API consumed by external clients
- Handling webhooks from third parties
- Streaming responses
- Need fine-grained HTTP control (status codes, headers, methods)

## Server-Side Fetching Patterns

### Parallel fetching (prevent waterfalls)
```tsx
// GOOD: Parallel
const [users, posts] = await Promise.all([
  getUsers(),
  getPosts(),
]);

// BAD: Sequential waterfall
const users = await getUsers();
const posts = await getPosts(); // waits for users unnecessarily
```

### Dependent fetching (legitimate sequential)
```tsx
// This waterfall is necessary — posts depend on user
const user = await getUser(id);
const posts = await getUserPosts(user.id);
```

### Preloading data
```tsx
// Trigger fetch early, consume later
import { preload } from './data';

export default function Page({ params }) {
  preload(params.id); // starts fetching immediately
  return <Suspense fallback={<Loading />}>
    <Content id={params.id} />
  </Suspense>;
}
```

## Caching Strategy

### When to cache
- Reference data that changes infrequently (categories, config)
- Expensive computations or slow external APIs
- Data shared across many users

### When NOT to cache
- User-specific data in shared caches
- Rapidly changing data (real-time prices, chat)
- Data after a mutation (stale data is worse than slow)

### Revalidation
- **Time-based** (`revalidate: 3600`): For data that changes on a known schedule
- **On-demand** (`revalidateTag`/`revalidatePath`): After mutations
- **No cache**: For real-time or user-specific data

## Streaming and Suspense

Use streaming for pages with slow data sources:
```tsx
export default function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Shows immediately */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart /> {/* Streams in when ready */}
      </Suspense>
    </div>
  );
}
```

## What to Detect and Flag

- **Waterfalls**: Sequential fetches that could be parallel
- **Client fetching for static data**: `useEffect` + `fetch` for data available at build/request time
- **Missing error handling**: Fetches without try/catch or error boundaries
- **Over-caching**: Caching user-specific data in shared cache
- **Under-caching**: Re-fetching static data on every request
- **Stale data after mutation**: Missing revalidation after writes
- **N+1 queries**: Fetching related data in a loop
- **Unnecessary loading states**: Data that could be server-rendered instantly
- **Large payloads**: Fetching full objects when only a few fields are needed
- **Missing types**: Fetch responses without TypeScript validation
