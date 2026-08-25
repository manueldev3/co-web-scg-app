# Next.js Production Power

> Turn Kiro into a Senior Next.js Engineer + Software Architect + Production Code Reviewer.

This Power transforms Kiro from a code generator into an opinionated engineering partner that understands modern Next.js architecture, performance, security, and production readiness.

## What problems does this solve?

- **Architecture decisions**: Server vs Client Components, route structure, module boundaries
- **Performance blind spots**: Bundle bloat, render waterfalls, missing optimizations
- **Security vulnerabilities**: Auth bypass, data exposure, input validation gaps
- **SEO gaps**: Missing metadata, broken sitemaps, client-rendered content
- **API design**: Proper Route Handlers, Server Actions, error handling
- **Code quality**: Comprehensive production reviews before deployment
- **Testing strategy**: What to test, how to test, and when tests add value

## Skills Included

| Skill | Purpose |
|-------|---------|
| `nextjs-architecture` | App Router structure, Server/Client boundaries, module organization |
| `nextjs-components` | Component design, composition, accessibility, state management |
| `nextjs-data-fetching` | Caching, revalidation, streaming, waterfall detection |
| `nextjs-performance` | Core Web Vitals, bundle size, images, fonts, hydration |
| `nextjs-security` | Auth, input validation, secrets, XSS/CSRF, data exposure |
| `nextjs-seo` | Metadata, sitemaps, structured data, indexability |
| `nextjs-api` | Route Handlers, Server Actions, HTTP contracts, error handling |
| `nextjs-testing` | Unit/integration/E2E strategy, what to test, test patterns |
| `nextjs-review` | Full production code review across all dimensions |

## Installation

### From local folder
1. Open Kiro
2. Powers panel → **Add Custom Power**
3. Select **Import power from a folder**
4. Navigate to this directory and confirm

### From GitHub
1. Push this directory to a GitHub repository
2. Powers panel → **Add Custom Power**
3. Select **Import power from GitHub**
4. Enter the repository URL

## Usage

The power activates automatically when your conversation involves Next.js topics. You can also invoke skills directly:

### Architecture guidance
```
Is this Server Component architecture correct?
Should this be a Server Action or Route Handler?
How should I structure this feature in the App Router?
```

### Performance optimization
```
Review this page for performance issues.
Why is my LCP slow on this page?
Help me reduce the client bundle size.
```

### Security review
```
Audit this Route Handler for security problems.
Is this Server Action secure?
Check if any secrets are exposed to the client.
```

### SEO implementation
```
Add proper metadata to this dynamic page.
Is my sitemap configured correctly?
Review the SEO setup for this application.
```

### API design
```
Design a Route Handler for this endpoint.
Should this be a Server Action or API route?
Review my API error handling.
```

### Testing
```
What should I test in this Server Action?
Write integration tests for this Route Handler.
How should I test this component?
```

### Full code review
```
Review this application before production deployment.
Do a code review of this page.
Audit this PR for production readiness.
```

## How to verify it's working

1. Start a conversation about Next.js (e.g., "Review this Server Component")
2. Kiro should activate the power based on keywords
3. The response should reflect the skill's instructions:
   - Inspects the project first
   - Considers the Next.js version
   - Uses structured analysis
   - Provides specific, actionable guidance

If Kiro gives generic Next.js advice without project context, the power may not be activated. Try using specific keywords from the skills.

## How to extend

### Add a new skill

1. Create a directory: `skills/my-new-skill/`
2. Create `skills/my-new-skill/SKILL.md` with frontmatter:
   ```yaml
   ---
   name: my-new-skill
   description: Description of when this skill should activate.
   ---
   ```
3. Write actionable instructions (not documentation)
4. Add relevant keywords to `plugin.json`

### Add reference material

For detailed patterns, examples, or checklists that shouldn't load in every context:
```
skills/my-skill/references/detailed-patterns.md
```

Reference files are loaded only when the skill explicitly directs Kiro to consult them.

## Design principles

1. **Inspect first**: Every skill requires reading the project before making changes
2. **Version-aware**: Adapts recommendations to the installed Next.js version
3. **Respect existing patterns**: Never replaces architecture without justification
4. **Progressive disclosure**: Core instructions load first; references load on demand
5. **Actionable, not academic**: Instructions tell Kiro what to DO, not just what to KNOW

## License

MIT
