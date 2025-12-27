---
inclusion: manual
---

- Initialize Resend via `lib/resend/index.ts` (reads `RESEND_API_KEY`). Do not instantiate clients ad-hoc.
- Send emails through `actions/resend` helpers to standardize from/reply-to and templates.
- Use React templates in `emails/*`. Keep props serializable and light.
- For auth: magic link emails use `emails/magic-link-email.tsx`. Welcome emails use `emails/user-welcome.tsx`.
- Provide absolute URLs using `NEXT_PUBLIC_SITE_URL`. Avoid relative links in emails. Avoid use lucide-react icon.
