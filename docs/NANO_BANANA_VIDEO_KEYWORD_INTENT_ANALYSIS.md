# Nano Banana Video Keyword Intent Analysis

## Scope

Source file: `keyword-data-nano-banana-video-all.csv`

Rows analyzed: `381`

Goal: turn internal-link pages from generic landing copy into pages that answer the concrete questions hidden behind high-volume search terms.

## What the keyword data says

Top head terms are broad, but the demand underneath is not broad at all. The biggest clusters are:

| Cluster | Approx. 28-day volume sum | Representative keywords | What users actually need |
| --- | ---: | --- | --- |
| Generator / broad video intent | 26.7K | `nano banana video generator`, `nano banana ai video generator` | Which workflow to start with, what the tool can actually do, where to click next |
| Free / pricing / cost | 13.6K | `nano banana video generator free`, `nano banana video free` | What is free, what needs credits, how to avoid wasting early runs |
| Pro / 2 / version confusion | 13.8K | `nano banana pro video`, `nano banana 2 video`, `nano banana pro video limit` | Which model or mode does what, and what the tradeoffs are |
| Image to video | 3.35K | `nano banana image to video`, `nano banana photo to video` | How to animate an existing image without destroying composition |
| Limits / duration / resolution | 2.35K | `nano banana video length`, `nano banana video resolution` | Hard limits, output duration, quality choices, per-run costs |
| Can it make videos | 1.9K | `can nano banana make videos` | A clear yes/no plus supported workflows |
| Prompts | 1.1K | `nano banana video prompt`, `nano banana video prompts examples` | Prompt formulas, examples, and failure fixes |
| Text to video | 1.04K | `nano banana text to video` | When text-first is better than image-first, and how to structure the prompt |

## What SERP inspection adds

I also checked current search results for:

- `nano banana video generator`
- `can nano banana make videos`
- `nano banana image to video`
- `nano banana text to video`
- `nano banana pro video limit`

The recurring SERP pattern is consistent:

1. Broad queries are still won by pages that immediately explain workflow choice, not by brand-story copy.
2. Image-to-video pages tend to win when they give concrete source-image advice and motion-prompt guidance.
3. Prompt-intent pages rank by examples and prompt formulas, not by abstract “prompt engineering matters” sections.
4. Pricing / limits queries lean heavily toward duration, resolution, credits, and output constraints.

## How this maps to site pages

| Page | Primary user need to answer |
| --- | --- |
| `/nano-banana-video-generator` | Which workflow should I use, and what can this tool actually do right now? |
| `/nano-banana-image-to-video` | How do I animate an existing image while preserving composition? |
| `/nano-banana-text-to-video` | How do I turn a vague idea into a controllable prompt? |
| `/nano-banana-video-free` | What is free to inspect or try, and how do I avoid wasting credits? |
| `/nano-banana-video-prompts` | Give me prompt structures, examples, and fast fixes for weak outputs |
| `/nano-banana-video-pricing-limits` | What are the live duration, quality, and credit tradeoffs? |
| `guides/how-to-make-videos-with-nano-banana` | Give me the shortest practical path from zero to first usable output |
| `guides/best-nano-banana-video-prompts` | Teach me prompt structure that maps to the actual tool |
| `guides/nano-banana-video-settings-and-limits` | Help me choose settings without wasting paid runs |

## Queries that specifically need comparison content

These are the searches that should not be answered with normal FAQ copy. They need direct comparison or clarification blocks inside the landing page body.

| Query pattern | Real question behind it | Best page |
| --- | --- | --- |
| `nano banana pro video` | Is there a higher-quality or higher-cost mode, and when should I use it? | `/nano-banana-video-generator` and `/nano-banana-video-pricing-limits` |
| `nano banana 2 video` | Is this a different model, version, or naming variant? | `/nano-banana-video-generator` |
| `best video ai generator nano banana or sora` | Which option is better for my use case? | `/nano-banana-video-generator` |
| `nano banana pro video limit` | What are the actual limits on duration, resolution, and credits? | `/nano-banana-video-pricing-limits` |
| `nano banana video length` | How long can outputs be right now? | `/nano-banana-video-pricing-limits` |
| `nano banana video resolution` | Which quality modes are available? | `/nano-banana-video-pricing-limits` |

## Product-reality checks used in content

To keep the SEO pages aligned with the actual product, the new content uses live constraints from the codebase instead of inventing generic claims:

- Video models exposed in the product: `Sora 2`, `Sora 2 Pro`, `Veo 3.1 Fast`
- Public workflow supports both `text-to-video` and `image-to-video`
- Current tool exposes `16:9` and `9:16` framing
- `Veo 3.1 Fast`: `8s`, `720p`, `100 credits`
- `Sora 2 Fast`: `10s / 15s`, `720p`, `80 / 120 credits`
- `Sora 2 Pro`: `10s / 15s`, `720p / 1080p`, `150 / 300 / 300 / 600 credits` depending on duration and quality
- Prompt optimization route already uses a cinematic structure: mood, subject, lighting, camera angle, camera movement, lens, and negative instructions

## Content changes made

The internal-link pages now include practical content blocks instead of generic overviews:

- workflow selection guidance
- source-image advice for image-to-video
- prompt formulas and reusable examples
- concrete limits and credit-cost snapshots
- model comparison and version-clarification blocks
- direct prompt case blocks for product, creator, and image-animation scenarios
- first-run and iteration checklists

## Next content expansions

The next highest-value additions are:

1. Add real case-study style prompt/result pairs from the blog or product.
2. Add model-specific comparison blocks for `Sora 2` vs `Veo 3.1`.
3. Add FAQ entries for version-confusion queries around `pro`, `2`, and `video limit`.
