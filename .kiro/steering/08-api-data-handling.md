---
inclusion: always
---
# API and Data Handling Guidelines

This project uses Next.js Route Handlers, Server Actions, and Drizzle ORM with Postgres.

## API Routes

- Implement endpoints in `app/api/*/route.ts` with appropriate methods (GET, POST, etc.).
- Structure responses using `lib/api-response.ts` helpers (`apiResponse.success`, `.error`, `.badRequest`, `.serverError`, etc.).
- Validate inputs with `zod` where applicable. Return 4xx on client errors.
- Consider rate limiting public APIs via Upstash (`lib/upstash`) if exposing endpoints publicly.

## Server Actions

- Prefer Server Actions for mutations initiated by forms or buttons.
- - Structure responses using `lib/action-response.ts` helpers (`actionResponse.success`, `.error`, `.badRequest`, `.serverError`, etc.).
- Validate with `zod.safeParse` and return typed results. Never throw raw errors to the client.
- Access the database via the shared `db` from `lib/db/index.ts`.

## Drizzle Data Access

- Use tables from `lib/db/schema.ts` and query with drizzle (`select`, `insert`, `update`, `delete`).
- Avoid constructing SQL strings; prefer the typed DSL and `eq`, `and`, etc.
- Do not create new DB clients per request; reuse `db`.

## Data Fetching Patterns

- In Server Components, use `fetch` with cache strategies as needed:
  - `fetch(url, { cache: 'no-store' })` for no caching
  - `fetch(url, { next: { revalidate: seconds } })` for ISR
- In Client Components, use SWR for client-side fetching when necessary.
- Provide loading and error UI states; avoid silent failures.

## External Services

- Stripe: Use `lib/stripe` singleton and `actions/stripe/*` helpers. Webhooks handled at `app/api/stripe/webhook/route.ts`.
- Cloudflare R2: Use helpers in `lib/cloudflare/r2.ts`.
- Resend: Use `actions/resend` and `lib/resend`.

When integrating with external services, ensure robust error handling and avoid leaking secrets to the client.