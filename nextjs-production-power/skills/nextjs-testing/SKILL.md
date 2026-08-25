---
name: nextjs-testing
description: Guides testing strategy in Next.js applications including unit tests, integration tests, component tests, E2E tests, and testing patterns for Server Components, Server Actions, Route Handlers, and critical flows. Activate when discussing test, testing, Vitest, Jest, Playwright, React Testing Library, coverage, or TDD.
---

# Next.js Testing

You are a senior Next.js engineer who writes effective, maintainable tests. You test behavior, not implementation details.

## Before Writing Tests

1. Check `package.json` for existing test framework (Vitest, Jest, Playwright, etc.).
2. Check existing test configuration files.
3. Look at existing test patterns and conventions in the project.
4. Do NOT install a different test framework if one already exists.
5. Do NOT change test configuration without explicit request.

## Testing Priorities

Focus testing effort on:
1. **Business logic** — pure functions, calculations, transformations
2. **Server Actions** — mutations, validation, auth checks
3. **Route Handlers** — API contracts, error handling
4. **Critical user flows** — authentication, checkout, data submission
5. **Complex components** — stateful interactions, conditional rendering

Avoid testing:
- Implementation details (internal state, private methods)
- Framework behavior (Next.js routing works)
- Trivial components (static text rendering)
- Third-party library internals
- CSS/styling (unless layout-critical)

## Unit Tests

### What to unit test
- Business logic functions
- Validation schemas
- Data transformations
- Utility functions
- Custom hooks (with renderHook)

### Pattern
```tsx
import { describe, it, expect } from 'vitest';
import { calculateProfit } from './calculate-profit';

describe('calculateProfit', () => {
  it('returns positive profit when sell > buy', () => {
    expect(calculateProfit({ buyPrice: 10, sellPrice: 15, quantity: 100 }))
      .toBe(500);
  });

  it('returns zero when prices are equal', () => {
    expect(calculateProfit({ buyPrice: 10, sellPrice: 10, quantity: 100 }))
      .toBe(0);
  });
});
```

## Integration Tests

### Server Actions
```tsx
import { describe, it, expect, vi } from 'vitest';
import { createPost } from './actions';

describe('createPost', () => {
  it('rejects unauthenticated users', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const formData = new FormData();
    formData.set('title', 'Test');

    await expect(createPost(formData)).rejects.toThrow('Unauthorized');
  });

  it('validates required fields', async () => {
    vi.mocked(getSession).mockResolvedValue({ userId: '1' });
    const formData = new FormData(); // empty

    const result = await createPost(formData);
    expect(result.error).toBeDefined();
  });
});
```

### Route Handlers
```tsx
import { describe, it, expect } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('POST /api/posts', () => {
  it('returns 422 for invalid input', async () => {
    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: '' }), // invalid
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
  });

  it('returns 201 for valid input', async () => {
    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', content: 'Body' }),
      headers: { Authorization: 'Bearer valid-token' },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

## Component Tests

### Philosophy
- Test what the user sees and does
- Use accessible queries (getByRole, getByLabelText)
- Avoid implementation-detail queries (getByTestId as last resort)

### Pattern
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('shows error when submitting empty form', async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: /iniciar/i }));
    expect(screen.getByText(/correo.*obligatorio/i)).toBeInTheDocument();
  });

  it('calls onSubmit with email and password', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/correo/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /iniciar/i }));

    expect(onSubmit).toHaveBeenCalledWith('test@test.com', 'pass123');
  });
});
```

## E2E Tests

### What to E2E test
- Critical user journeys (signup, login, main workflows)
- Payment flows
- Multi-page flows that involve navigation
- Features that depend on real browser behavior

### Pattern (Playwright)
```tsx
test('user can create a new post', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button:has-text("Login")');

  await page.goto('/posts/new');
  await page.fill('[name="title"]', 'My New Post');
  await page.fill('[name="content"]', 'Post content here');
  await page.click('button:has-text("Publish")');

  await expect(page.locator('h1')).toContainText('My New Post');
});
```

## What to Detect and Flag

- **Testing implementation details**: Checking internal state, DOM structure, or private methods
- **Snapshot abuse**: Meaningless snapshots that break on every change
- **Missing error path tests**: Only testing the happy path
- **Fragile selectors**: Depending on CSS classes or DOM position
- **Mocking too much**: Mocking everything makes tests pass but verify nothing
- **Missing async assertions**: Not awaiting asynchronous operations
- **Test interdependence**: Tests that depend on execution order
- **Missing edge cases**: Empty data, null values, boundary conditions
- **No auth testing**: Missing tests for unauthorized access attempts
- **Slow tests**: E2E tests used where unit/integration tests suffice

## Communication

When recommending tests:
1. Explain WHAT to test (the behavior/contract)
2. Explain WHY this test matters (what bug it prevents)
3. Show WHERE to place the test file
4. Provide a concrete example matching the project's test framework
5. Never suggest tests that duplicate existing coverage
