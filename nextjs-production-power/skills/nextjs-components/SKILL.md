---
name: nextjs-components
description: Guides component design in Next.js applications including Server/Client component patterns, composition, props, accessibility, loading/error/empty states, and component boundaries. Activate when discussing components, UI, composition, props, accessibility, or component architecture.
---

# Next.js Components

You are a senior React/Next.js engineer focused on building well-structured, accessible, and maintainable components.

## Before Modifying Components

1. Check if the component is a Server or Client Component.
2. Read existing component patterns in the project.
3. Check what UI library is installed (Ant Design, shadcn, MUI, etc.).
4. Match existing naming and file organization conventions.
5. Do NOT introduce a new component library if one already exists.

## Server Components

### Characteristics
- Can use `async/await` directly
- Can access server resources (database, file system, env vars)
- Cannot use hooks, event handlers, or browser APIs
- Zero client-side JavaScript

### Preferred patterns
```tsx
// Direct data access — no useEffect, no loading state needed client-side
export default async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <ProfileCard user={user} />;
}
```

## Client Components

### Keep them small and focused
- Extract the interactive part into a small Client Component
- Keep the surrounding layout as a Server Component
- Pass server data down as props (serializable data only)

### Props boundary
Client Components receive props that cross the server/client boundary. These must be serializable:
- Strings, numbers, booleans, null
- Arrays and plain objects of the above
- Date (serialized as string)
- NOT: functions, class instances, Symbols, Streams

## Component Design Principles

### 1. Single responsibility
Each component should do one thing well. If you need "and" to describe it, split it.

### 2. Composition over configuration
Prefer children and slots over complex prop APIs:

```tsx
// Prefer this
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>

// Over this
<Card title="Title" body="Content" headerIcon={...} footerAction={...} />
```

### 3. Props interface
- Use TypeScript interfaces for props
- Prefer specific types over `any` or `unknown`
- Use `React.ComponentProps<"element">` to extend native elements
- Make optional props truly optional — provide sensible defaults

### 4. Co-location
Keep related files together:
```
components/
  UserCard/
    UserCard.tsx
    UserCard.test.tsx
    useUserCard.ts (if needed)
```

## States Every Component Should Handle

### Loading state
- Use `loading.tsx` at route level
- Use Suspense boundaries for component-level loading
- Provide skeleton UIs that match the final layout

### Error state
- Use `error.tsx` at route level
- Use error boundaries for component-level errors
- Show actionable error messages, not stack traces
- Include retry mechanisms where appropriate

### Empty state
- Handle empty arrays/null data explicitly
- Provide helpful messages and CTAs
- Never render blank whitespace without explanation

## Accessibility Checklist

Every component must:
- Use semantic HTML elements (`button`, `nav`, `main`, `article`, etc.)
- Have visible focus indicators
- Support keyboard navigation where interactive
- Include `alt` text for images
- Use `aria-label` only when visible text is insufficient
- Never use `div` with `onClick` — use `button` or `a`
- Ensure sufficient color contrast
- Associate labels with form controls

## What to Detect and Flag

- **Overly large components**: >200 lines suggests decomposition needed
- **Prop drilling**: >3 levels deep suggests context or composition change
- **Unnecessary Client Components**: `"use client"` on components without interactivity
- **Mixed concerns**: Database queries inside presentation components
- **Duplicated UI patterns**: Same card/list/table structure repeated
- **Accessibility violations**: Missing labels, non-semantic elements, click handlers on divs
- **Complex conditional rendering**: >3 nested ternaries suggest a component split
- **Unstable keys**: Using array index as key for dynamic lists
- **Missing TypeScript**: Props without interface definitions
- **Over-abstraction**: Generic components that are harder to understand than the original code
