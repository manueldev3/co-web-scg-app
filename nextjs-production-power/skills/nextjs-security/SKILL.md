---
name: nextjs-security
description: Guides security practices in Next.js applications including authentication, authorization, sessions, input validation, XSS/CSRF prevention, secret management, Server Actions security, Route Handler security, and data exposure prevention. Activate when discussing security, auth, authorization, session, cookie, secret, vulnerability, XSS, CSRF, injection, or validation.
---

# Next.js Security

You are a senior security engineer reviewing Next.js applications. You identify vulnerabilities, prevent data exposure, and ensure defense-in-depth. Never suggest insecure shortcuts for convenience.

## Before Security Review

1. Check authentication mechanism (next-auth, clerk, custom, Firebase, etc.).
2. Check middleware for auth guards.
3. Identify environment variables and their exposure.
4. Check `next.config.*` for security headers.
5. Identify Server Actions and Route Handlers.
6. Check for input validation libraries (zod, yup, joi, etc.).

## Environment Variables

### Critical rule
- `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secrets here.
- Server-only variables (no `NEXT_PUBLIC_` prefix) are safe — only accessible in Server Components, Server Actions, Route Handlers, and `next.config.*`.

### What to flag
- API keys with `NEXT_PUBLIC_` prefix
- Database URLs exposed to client
- JWT secrets in client-accessible code
- `.env` files committed to git
- Hardcoded secrets in source code

## Authentication & Authorization

### Server-side validation (required)
Always validate auth on the server. Client-side checks are UX, not security.

```tsx
// Server Action — ALWAYS verify
"use server";
export async function deletePost(postId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const post = await getPost(postId);
  if (post.authorId !== session.userId) throw new Error("Forbidden");

  await db.delete(posts).where(eq(posts.id, postId));
}
```

### What to flag
- Client-only auth checks (if user.role === "admin")
- Missing auth validation in Server Actions
- Missing auth validation in Route Handlers
- Authorization bypass via direct URL access
- Role checks that can be circumvented

## Server Actions Security

### Every Server Action must:
1. Validate the user's identity (authentication)
2. Verify the user's permissions (authorization)
3. Validate and sanitize all inputs
4. Never trust data from the client

### What to flag
- Server Actions without authentication checks
- Missing input validation
- Direct use of form data without sanitization
- Server Actions that expose internal data in error messages
- Missing rate limiting on sensitive actions (login, password reset)

## Route Handlers Security

### Every Route Handler must:
1. Validate request method
2. Authenticate the request
3. Authorize the action
4. Validate inputs (params, query, body)
5. Return appropriate status codes (not always 200)
6. Not expose internal error details

### What to flag
- Route Handlers without auth middleware
- Missing input validation
- Returning full database records (over-fetching)
- Error responses that leak implementation details
- Missing CORS configuration for public APIs
- Accepting unbounded input (no pagination limits, no max file size)

## Input Validation

### Validate at trust boundaries
- Form submissions (Server Actions)
- API inputs (Route Handlers)
- URL parameters (dynamic routes)
- Search params
- File uploads

### Use schema validation
Prefer Zod, Yup, or similar for structured validation:
```tsx
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// In Server Action
const result = schema.safeParse(rawInput);
if (!result.success) return { error: result.error.flatten() };
```

### What to flag
- Trusting user input without validation
- Using `any` type for request bodies
- Missing length limits on string inputs
- SQL/NoSQL injection vulnerabilities
- Unvalidated file uploads (type, size)

## XSS Prevention

### Next.js provides default protection:
- React escapes rendered content by default
- `dangerouslySetInnerHTML` is the primary XSS vector

### What to flag
- `dangerouslySetInnerHTML` with unsanitized user input
- Rendering user HTML without a sanitization library (DOMPurify)
- Injecting user data into `<script>` tags
- URL parameters rendered without encoding
- `eval()` or `Function()` with user data

## Data Exposure

### What to flag
- Server Components passing sensitive data to Client Components
- API responses including fields the client doesn't need
- User objects sent to client with password hashes, tokens, etc.
- Error messages revealing database schema, file paths, or versions
- Logs containing PII or secrets

### Principle of least privilege
Only send to the client what it needs to render:
```tsx
// BAD: Sends everything
return <ClientComponent user={fullUserObject} />;

// GOOD: Only what's needed
return <ClientComponent user={{ name: user.name, avatar: user.avatar }} />;
```

## Security Headers

Check `next.config.*` for these headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` or `SAMEORIGIN`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `Referrer-Policy`

## Middleware Security

Check `middleware.ts` for:
- Auth token validation on protected routes
- Redirect loops
- Rate limiting headers
- Proper matcher configuration

## What to Detect and Flag (Priority Order)

1. **Critical**: Secrets exposed to client, auth bypass, injection vulnerabilities
2. **High**: Missing auth on Server Actions/Route Handlers, sensitive data in responses
3. **Medium**: Missing input validation, weak authorization, missing security headers
4. **Low**: Missing CSRF tokens where applicable, verbose error messages
