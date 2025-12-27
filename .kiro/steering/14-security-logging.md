---
inclusion: manual
---

Security:
- Never expose secrets to the client. Only `NEXT_PUBLIC_*` vars may be used in client code.
- Validate all inputs with `zod` or equivalent. Return 4xx for user errors.
- Use `getSession()` and `isAdmin()` for authz checks in server code. Do not trust client state.
- Sanitize and bound uploads. Enforce size/type limits (see avatar constraints in `lib/validations.ts`).
- Avoid logging PII. Redact tokens/IDs in logs.

Logging & Errors:
- Use descriptive errors with `apiResponse.*` in API routes. Do not leak stack traces to clients.
- Log operational errors on the server with context; prefer `console.error` in server code only.
- For background webhook processing, wrap with try/catch and log failures (see Stripe webhook route).

Environment:
- Keep `.env*` files out of version control. Provide `.env.example` when introducing new vars.
- Prefer feature flags via env for optional integrations.
