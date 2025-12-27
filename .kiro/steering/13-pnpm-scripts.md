---
inclusion: manual
---

- Use pnpm, not npm or yarn.
- Common scripts from `package.json`:
  - `pnpm dev` — start Next.js dev server
  - `pnpm build` — build production
  - `pnpm start` — start production server
  - `pnpm lint` — run ESLint
  - `pnpm analyze` — build with bundle analyzer
  - Drizzle:
    - `pnpm db:generate` — generate migrations from schema
    - `pnpm db:migrate` — apply migrations
    - `pnpm db:push` — push schema directly
    - `pnpm db:studio` — open Drizzle studio
    - `pnpm db:seed` — run seed script

- Prefer exact scripts over ad-hoc commands to keep consistency.
