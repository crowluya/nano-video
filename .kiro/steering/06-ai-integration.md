---
inclusion: manual
---
# AI Integration Guidelines

This project integrates multiple AI providers via `ai` and `@ai-sdk/*` packages for chat and media generation.

## Providers and Keys

- Supported: OpenAI, Anthropic, Google, DeepSeek, XAI, OpenRouter, Replicate.
- Keys must be provided via env: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `DEEPSEEK_API_KEY`, `XAI_API_KEY`, `OPENROUTER_API_KEY`, `REPLICATE_API_TOKEN`.
- Do not import keys client-side. All provider initialization happens in server route handlers.

## API Routes

- Chat: `app/api/ai-demo/single-chat/route.ts`, `.../multi-chat/route.ts`.
- Images/Video: `app/api/ai-demo/text-to-image/route.ts`, `image-to-image/route.ts`, `image-to-video/route.ts`.
- Validate presence of required provider keys and return descriptive errors. Follow existing patterns in these files.

## Client Usage

- Use `@ai-sdk/react` hooks (`useChat`, `useCompletion`) in UI. See `components/ai-demo/` for examples.
- Stream responses when possible; provide cancel/stop controls in the UI.

## Performance & Cost

- Guard production routes if necessary (`NODE_ENV === 'production'` checks already present in demos).
- Keep token usage reasonable and consider caching for repeatable prompts.

## Config Surface

- Feature toggles via env: e.g., `NEXT_PUBLIC_AI_MODEL_ID`, `NEXT_PUBLIC_AI_PROVIDER` used in admin forms for visibility; do not rely on them for server-side access control.
