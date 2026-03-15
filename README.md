# Nano Banana Video

Nano Banana Video is a multilingual AI generation product built with Next.js 16, React 19, better-auth, Drizzle, and PostgreSQL. The current public-facing product is centered on Nano Banana image workflows, prompt generation, and AI video generation with Sora 2 and Veo 3.1 Fast.

## Status Snapshot

Last verified: March 15, 2026

- The default home route `/` renders the Nano Banana Video marketing/product page.
- The main public routes in active use are `/`, `/nanabananvideo`, `/video-generation`, `/prompt-generator`, `/blog`, `/login`, and the localized pricing/payment flows.
- Public SEO/internal-link routes now include `/nano-banana-video-generator`, `/nano-banana-image-to-video`, `/nano-banana-text-to-video`, `/nano-banana-video-free`, `/nano-banana-video-prompts`, `/nano-banana-video-pricing-limits`, plus 3 `/guides/*` pages under localized routes.
- Video generation supports Sora 2, Sora 2 Pro, and Veo 3.1 Fast in the current codebase.
- Internal-link content has been upgraded from generic landing copy to keyword-intent-driven pages with workflow guidance, pricing/limit explanations, model comparison blocks, and prompt/case examples.
- Image generation, prompt generation, Google login, credits, pricing, Stripe checkout, Stripe webhook handling, blog/CMS, and admin pricing management are all present in the repository.
- Music generation, Studio, Remotion editing, and Creem payment support still exist in code, but they are not the primary public product surface and some navigation was intentionally hidden.
- Internationalization currently includes 12 locale directories under `i18n/messages`, with the new SEO/internal-link content explicitly localized for `en`, `zh`, `ja`, and `es` and falling back to English for other locales.
- This repository still contains historical boilerplate metadata and older planning documents. Treat this README, `docs/NANO_BANANA_VIDEO_KEYWORD_INTENT_ANALYSIS.md`, `docs/SEO_INTERNAL_LINK_LANGUAGE_ROLLOUT.md`, `STRIPE_CLI_SETUP.md`, and `.kiro/specs/veo-3-1-integration/` as the most relevant current references.

## Current Product Surface

- Marketing and SEO landing pages for Nano Banana to Video
- Internal-link topic pages and guide pages for video workflows, prompts, free-trial intent, and pricing/limits
- Prompt generator UI and API
- Image generation flows
- Video generation UI and API
- Task polling and generation history
- Credit-based billing and pricing plans
- Google sign-in
- Stripe checkout and webhook processing
- Admin pages for users, orders, pricing, blogs, and storage resources

## Current Engineering Status

- `pnpm lint` passes
- `pnpm exec tsc --noEmit` passes
- `pnpm exec next build --webpack --debug` completes successfully
- Default `pnpm build` still hangs under Next.js 16 Turbopack after `Creating an optimized production build ...`; webpack build is the currently verified fallback
- Some boilerplate-era metadata and docs still exist elsewhere in the repo and should be cleaned progressively

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- next-intl
- Zustand
- Drizzle ORM
- PostgreSQL
- better-auth
- Stripe
- Cloudflare R2 / S3-compatible storage

## Key Paths

- `app/[locale]/(basic-layout)/page.tsx`: default localized home route
- `app/[locale]/(basic-layout)/nanabananvideo/page.tsx`: canonical Nano Banana landing route
- `app/[locale]/(basic-layout)/video-generation/page.tsx`: public video generation page
- `app/[locale]/(basic-layout)/prompt-generator/page.tsx`: public prompt generator page
- `app/[locale]/(basic-layout)/nano-banana-video-generator/page.tsx`: SEO hub page for broad Nano Banana video intent
- `app/[locale]/(basic-layout)/nano-banana-video-pricing-limits/page.tsx`: SEO page for limits, duration, quality, and credits intent
- `app/[locale]/(basic-layout)/guides/`: guide pages for workflow, prompt, and settings intent
- `app/api/generation/video/route.ts`: unified video generation API
- `app/api/payment/checkout-session/route.ts`: payment session creation
- `app/api/stripe/webhook/route.ts`: Stripe webhook handler
- `components/nanabananvideo/`: current main marketing page components
- `components/seo/`: reusable SEO/internal-link page sections and templates
- `lib/seo/`: internal-link configuration, localization, and metadata helpers

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Common Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:studio
pnpm db:seed
```

## Environment Notes

The project depends on a larger env set than a typical Next.js app. At minimum, local work usually needs values for:

- database connection
- better-auth secret and OAuth credentials
- Stripe keys and webhook secret
- KIE API key
- R2/S3 storage credentials
- Resend mail credentials

See `.env.example` for the full template.

## Important Docs

- `docs/NANO_BANANA_VIDEO_KEYWORD_INTENT_ANALYSIS.md`: keyword-intent summary and page mapping for the Nano Banana video SEO work
- `docs/SEO_INTERNAL_LINK_LANGUAGE_ROLLOUT.md`: first-batch language rollout notes for internal-link pages
- `STRIPE_CLI_SETUP.md`: local Stripe webhook tooling notes
- `.kiro/specs/veo-3-1-integration/README.md`: Veo 3.1 Fast implementation overview
- `.kiro/specs/veo-3-1-integration/COMPLETION_SUMMARY.md`: Veo 3.1 completion notes
- `LAUNCH-TODO.md`: historical launch checklist, partially outdated
- `GALLERY_TODO.md`: historical gallery planning doc, no longer reflects actual implementation progress

## Repository Notes

- This project was adapted from a SaaS boilerplate and still contains some legacy naming and documentation.
- Not every document in the repository reflects the current product state.
- If you need a current status baseline, start from the active routes, recent commits, and the docs listed above instead of older TODO files.
