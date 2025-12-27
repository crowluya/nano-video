---
inclusion: always
---
- Strive for strong typing. Use `unknown` instead of `any` where possible if the type is truly unknown.
- Prefer `interface` for defining object shapes and `type` for unions, intersections, or utility types.
- Use explicit return types for functions, especially for public APIs or complex logic.
- Organize imports:
    1. React/Next.js imports
    2. External library imports
    3. Internal absolute path imports (e.g., `@/components/...`)
    4. Relative path imports
- Keep `tsconfig.json` strictness flags enabled (e.g., `strictNullChecks`, `noImplicitAny`).
- Use ES modules (`import`/`export`).
- For type-only imports, use `import type { ... } from '...'`.
- Prefer using TypeScript's built-in utility types like `Partial<T>`, `Pick<T>`, `Omit<T>`, etc.
- Use discriminated unions for complex state management (e.g., `type State = { status: 'loading' } | { status: 'success', data: Data }`).
- Avoid type assertions (`as`) when possible; use type guards instead (e.g., `if ('property' in object)`). 