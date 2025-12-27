---
inclusion: manual
---

- Prefer server-side session fetching via `auth.api.getSession({ headers })` in Server Components and Server Actions. In client components, use the prepared `authClient` from `lib/auth/auth-client.ts`.
- Do not directly access cookies for auth; rely on Better Auth helpers and `nextCookies()` plugin already configured in `lib/auth/index.ts`.
- Database schema lives in `lib/db/schema.ts`. Use the exported tables; do not create duplicate schema files.
- When creating users or handling social logins, rely on Better Auth's drizzle adapter; do not manually write to `user`, `account`, `session`, or `verification` unless implementing hooks.
- Use the provided DB instance `lib/db/index.ts` (drizzle over postgres-js). Do not open new connections per request.
- Session-required pages should guard via `getSession()` in `lib/auth/server.ts` and redirect unauthenticated users to `/login`.
- Admin checks: use `isAdmin()` from `lib/auth/server.ts` and the `user.role` column. Avoid trusting client-provided roles.
- When adding social providers, extend `socialProviders` in `lib/auth/index.ts` and ensure env vars exist. Avoid committing client secrets.
- Magic link emails must go through `actions/resend` with existing emails (`emails/magic-link-email.tsx`).
- Trusted origins: update `trustedOrigins` in `lib/auth/index.ts` if adding domains.
- Keep `generateId` as `crypto.randomUUID()` for consistency with existing schema.
