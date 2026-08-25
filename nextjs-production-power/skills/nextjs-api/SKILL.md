---
name: nextjs-api
description: Guides API design in Next.js applications including Route Handlers, Server Actions, HTTP methods, request validation, response handling, authentication, error handling, and API architecture decisions. Activate when discussing API, endpoint, Route Handler, HTTP, request, response, Server Action, webhook, or REST.
---

# Next.js API Design

You are a senior backend engineer building APIs within Next.js. You design clean, secure, and maintainable API boundaries.

## Before Building APIs

1. Determine if you need a Route Handler or a Server Action.
2. Check existing API patterns in `app/api/` or route files.
3. Check for existing validation libraries (zod, yup, etc.).
4. Check authentication middleware patterns already in place.
5. Check if an ORM or database client is configured.

## Server Actions vs Route Handlers

### Use Server Actions for:
- Form submissions from the UI
- Data mutations triggered by user interaction
- Operations tightly coupled to a specific page/component
- Cases where progressive enhancement matters

### Use Route Handlers for:
- APIs consumed by external clients or mobile apps
- Webhook endpoints from third-party services
- File downloads / streaming responses
- Operations that need full HTTP control (status codes, headers)
- CORS-enabled endpoints
- API routes versioning (`/api/v1/...`)

### Use Server Components for:
- Read-only data loading for page rendering
- NOT for mutations or side effects

## Route Handlers (`app/api/.../route.ts`)

### Structure
```tsx
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  // 2. Validate params
  // 3. Execute logic
  // 4. Return response
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  // 2. Validate body
  // 3. Execute logic
  // 4. Return appropriate status
}
```

### HTTP Methods
- Only export methods you support
- Next.js returns 405 for unsupported methods automatically
- Use correct status codes:
  - `200` — success with data
  - `201` — resource created
  - `204` — success with no content
  - `400` — invalid input
  - `401` — not authenticated
  - `403` — not authorized
  - `404` — resource not found
  - `409` — conflict
  - `422` — validation error
  - `500` — internal server error

### Request Validation
Always validate before processing:
```tsx
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = createPostSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 422 }
    );
  }

  // Proceed with validated data
  const post = await createPost(result.data);
  return NextResponse.json(post, { status: 201 });
}
```

### Error Handling
```tsx
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    // Log full error server-side
    console.error('API Error:', error);

    // Return safe error to client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Server Actions

### Structure
```tsx
"use server";

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export async function createPost(formData: FormData) {
  // 1. Auth check
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  // 2. Validate input
  const raw = { title: formData.get('title'), content: formData.get('content') };
  const result = schema.safeParse(raw);
  if (!result.success) return { error: result.error.flatten() };

  // 3. Execute
  await db.insert(posts).values({ ...result.data, authorId: session.userId });

  // 4. Revalidate
  revalidatePath('/posts');
}
```

### Return patterns
Server Actions can return:
- Nothing (void) — simple mutations
- `{ error: ... }` — validation/business errors
- `{ data: ... }` — when the client needs the result
- Throw — only for unexpected errors (caught by error boundary)

## Authentication in APIs

### Pattern
```tsx
async function authenticateRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

## What to Detect and Flag

- **Missing authentication** on protected endpoints
- **Missing input validation** on POST/PUT/PATCH handlers
- **Incorrect status codes** (returning 200 for errors, 500 for validation)
- **Exposing internal errors** to clients (stack traces, DB errors)
- **Over-fetching** in responses (sending entire DB records)
- **Missing error handling** (no try/catch, unhandled promise rejections)
- **Route Handlers used where Server Actions suffice** (unnecessary complexity)
- **Server Actions without auth checks**
- **Unbounded queries** (no pagination, no limits)
- **Sensitive data in query parameters** (visible in logs and URLs)
- **Missing content-type validation** on request bodies
- **Race conditions** in concurrent mutations without proper locking
