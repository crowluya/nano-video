export const LANGUAGE_MODELS = [
  {
    provider: "openrouter",
    name: "OpenRouter",
    models: [
      {
        id: "x-ai/grok-3-mini-beta",
        name: "Grok 3 Mini (OpenRouter)",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"],
      },
      {
        id: "openai/gpt-4o-mini",
        name: "OpenAI GPT 4o mini (OpenRouter)",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      {
        id: "anthropic/claude-sonnet-4",
        name: "Anthropic Claude 4 Sonnet (OpenRouter)",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"],
      }
    ]
  },
  {
    provider: "deepseek",
    name: "DeepSeek",
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat(V3)",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek R1",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"]
      },
    ],
  },
  {
    provider: "openai",
    name: "OpenAI",
    models: [
      {
        id: "gpt-4o-mini",
        name: "GPT 4o mini",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
      {
        id: "gpt-4o",
        name: "GPT 4o",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
      {
        id: "gpt-4.5-preview",
        name: "GPT 4.5 Preview",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
      {
        id: "o1",
        name: "GPT o1",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"]
      },
      {
        id: "o3-mini",
        name: "GPT o3 mini",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"]
      },
    ],
  },
  {
    provider: "anthropic",
    name: "Anthropic",
    models: [
      {
        id: "claude-4-sonnet",
        name: "Claude 4 Sonnet",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
      {
        id: "claude-3-7-sonnet",
        name: "Claude 3.7 Sonnet",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"]
      },
      {
        id: "claude-3-5-haiku",
        name: "Claude 3.5 Haiku",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
    ],
  },
  {
    provider: "google",
    name: "Google",
    models: [
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
      {
        id: "gemini-1-5-pro",
        name: "Gemini 1.5 Pro",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
    ],
  },
  {
    provider: "xai",
    name: "XAI",
    models: [
      {
        id: "grok-3",
        name: "Grok 3",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
      {
        id: "grok-3-mini",
        name: "Grok 3 Mini",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"]
      },
      {
        id: "grok-2",
        name: "Grok 2",
        inputSupport: ["text"],
        outputSupport: ["text"]
      },
    ],
  }
];

export const TEXT_TO_IMAGE_MODELS = [
  {
    // size: 1024x1024, 1536x1024, 1024x1536
    provider: "openai",
    name: "GPT Image",
    id: "gpt-image-1",
  },
  {
    // https://replicate.com/black-forest-labs/flux-schnell
    provider: "replicate",
    name: "Flux Schnell",
    id: "black-forest-labs/flux-schnell",
  },
  {
    // not support size, and default is 1024x768
    provider: "xai",
    name: "Grok 2 Image",
    id: "grok-2-image",
  },
]

export const IMAGE_TO_IMAGE_MODELS = [
  {
    // https://replicate.com/black-forest-labs/flux-schnell
    provider: "replicate",
    name: "Flux 1.1 Pro",
    id: "black-forest-labs/flux-1.1-pro",
  },
]

export const IMAGE_TO_VIDEO_MODELS = [
  {
    // https://replicate.com/kwaivgi/kling-v1.6-standard
    provider: "replicate",
    name: "Kling 1.6 Standard",
    id: "kwaivgi/kling-v1.6-standard",
  },
  {
    // https://replicate.com/kwaivgi/kling-v1.6-pro
    provider: "replicate",
    name: "Kling 1.6 Pro",
    id: "kwaivgi/kling-v1.6-pro",
  },
]

// =============================================================================
// Kie.ai Image Generation Models
// =============================================================================

export const KIE_IMAGE_MODELS = [
  {
    provider: "kie",
    id: "google/nano-banana",
    name: "Nano Banana",
    description: "Google Gemini Image - Standard",
    features: ["text-to-image"],
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "auto"] as const,
    outputFormats: ["png", "jpg"] as const,
    creditsPerGeneration: 5,
  },
  {
    provider: "kie",
    id: "google/nano-banana-edit",
    name: "Nano Banana Edit",
    description: "Google Gemini Image - Editing",
    features: ["image-to-image"],
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "auto"] as const,
    outputFormats: ["png", "jpg"] as const,
    creditsPerGeneration: 8,
  },
  {
    provider: "kie",
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    description: "Google Gemini Image - Pro/4K",
    features: ["text-to-image", "image-to-image"],
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "auto"] as const,
    outputFormats: ["png", "jpg"] as const,
    resolutions: ["1K", "2K", "4K"] as const,
    creditsPerGeneration: 15,
  },
  {
    provider: "kie",
    id: "midjourney",
    name: "Midjourney",
    description: "Midjourney Image Generation",
    features: ["text-to-image", "image-to-image", "style-reference"],
    taskTypes: ["mj_txt2img", "mj_img2img", "mj_video", "mj_style_reference", "mj_omni_reference"] as const,
    versions: ["7", "6.1", "6", "5.2", "niji6"] as const,
    speeds: ["relaxed", "fast", "turbo"] as const,
    aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2"] as const,
    creditsPerGeneration: 15,
  },
  {
    provider: "kie",
    id: "flux-kontext-pro",
    name: "Flux Kontext Pro",
    description: "Flux Kontext - Pro",
    features: ["text-to-image", "image-to-image"],
    aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "16:21"] as const,
    outputFormats: ["jpeg", "png"] as const,
    creditsPerGeneration: 10,
  },
  {
    provider: "kie",
    id: "flux-kontext-max",
    name: "Flux Kontext Max",
    description: "Flux Kontext - Max Quality",
    features: ["text-to-image", "image-to-image"],
    aspectRatios: ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "16:21"] as const,
    outputFormats: ["jpeg", "png"] as const,
    creditsPerGeneration: 15,
  },
  {
    provider: "kie",
    id: "gpt4o-image",
    name: "GPT-4o Image",
    description: "OpenAI GPT-4o Image Generation",
    features: ["text-to-image", "image-to-image"],
    sizes: ["1:1", "3:2", "2:3"] as const,
    variants: [1, 2, 4] as const,
    creditsPerGeneration: 10,
  },
] as const;

// =============================================================================
// Kie.ai Video Generation Models
// =============================================================================

export const KIE_VIDEO_MODELS = [
  {
    provider: "kie",
    id: "sora-2-text-to-video",
    name: "Sora 2",
    description: "OpenAI Sora 2 - Text to Video",
    features: ["text-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const,
    creditsPerGeneration: 100,
  },
  {
    provider: "kie",
    id: "sora-2-image-to-video",
    name: "Sora 2 Image",
    description: "OpenAI Sora 2 - Image to Video",
    features: ["image-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const,
    creditsPerGeneration: 100,
  },
  {
    provider: "kie",
    id: "sora-2-pro-text-to-video",
    name: "Sora 2 Pro",
    description: "OpenAI Sora 2 Pro - Text to Video",
    features: ["text-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const,
    creditsPerGeneration: 150,
  },
  {
    provider: "kie",
    id: "sora-2-pro-image-to-video",
    name: "Sora 2 Pro Image",
    description: "OpenAI Sora 2 Pro - Image to Video",
    features: ["image-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const,
    creditsPerGeneration: 150,
  },
  {
    provider: "kie",
    id: "veo3",
    name: "Veo 3.1 Quality",
    description: "Google Veo 3.1 - Quality Mode",
    features: ["text-to-video", "image-to-video", "first-last-frame"],
    generationTypes: ["TEXT_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO"] as const,
    aspectRatios: ["16:9", "9:16", "Auto"] as const,
    creditsPerGeneration: 80,
  },
  {
    provider: "kie",
    id: "veo3_fast",
    name: "Veo 3.1 Fast",
    description: "Google Veo 3.1 - Fast Mode",
    features: ["text-to-video", "image-to-video", "first-last-frame", "reference-to-video"],
    generationTypes: ["TEXT_2_VIDEO", "FIRST_AND_LAST_FRAMES_2_VIDEO", "REFERENCE_2_VIDEO"] as const,
    aspectRatios: ["16:9", "9:16", "Auto"] as const,
    creditsPerGeneration: 60,
  },
  {
    provider: "kie",
    id: "runway-gen3",
    name: "Runway Gen-3 Alpha",
    description: "Runway Gen-3 Alpha Video Generation",
    features: ["text-to-video", "image-to-video", "extend"],
    qualities: ["720p", "1080p"] as const,
    durations: [5, 10] as const,
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"] as const,
    creditsPerGeneration: 80,
  },
  {
    provider: "kie",
    id: "wan/2-5-text-to-video",
    name: "Wan 2.5 Text",
    description: "Wan 2.5 - Text to Video",
    features: ["text-to-video"],
    resolutions: ["720p", "1080p"] as const,
    durations: ["5", "10"] as const,
    creditsPerGeneration: 50,
  },
  {
    provider: "kie",
    id: "wan/2-5-image-to-video",
    name: "Wan 2.5 Image",
    description: "Wan 2.5 - Image to Video",
    features: ["image-to-video"],
    resolutions: ["720p", "1080p"] as const,
    durations: ["5", "10"] as const,
    creditsPerGeneration: 50,
  },
] as const;

// =============================================================================
// Kie.ai Music Generation Models (Suno)
// =============================================================================

export const KIE_MUSIC_MODELS = [
  {
    provider: "kie",
    id: "V3_5",
    name: "Suno V3.5",
    description: "Suno Music Generation - V3.5",
    features: ["text-to-music", "lyrics"],
    creditsPerGeneration: 15,
  },
  {
    provider: "kie",
    id: "V4",
    name: "Suno V4",
    description: "Suno Music Generation - V4",
    features: ["text-to-music", "lyrics", "extend"],
    creditsPerGeneration: 20,
  },
  {
    provider: "kie",
    id: "V4_5",
    name: "Suno V4.5",
    description: "Suno Music Generation - V4.5",
    features: ["text-to-music", "lyrics", "extend"],
    creditsPerGeneration: 25,
  },
  {
    provider: "kie",
    id: "V4_5_Plus",
    name: "Suno V4.5 Plus",
    description: "Suno Music Generation - V4.5 Plus",
    features: ["text-to-music", "lyrics", "extend"],
    creditsPerGeneration: 30,
  },
  {
    provider: "kie",
    id: "V5",
    name: "Suno V5",
    description: "Suno Music Generation - V5 (Latest)",
    features: ["text-to-music", "lyrics", "extend"],
    creditsPerGeneration: 35,
  },
] as const;

// =============================================================================
// Type Exports
// =============================================================================

export type KieImageModel = typeof KIE_IMAGE_MODELS[number];
export type KieVideoModel = typeof KIE_VIDEO_MODELS[number];
export type KieMusicModel = typeof KIE_MUSIC_MODELS[number];

export type KieImageModelId = KieImageModel['id'];
export type KieVideoModelId = KieVideoModel['id'];
export type KieMusicModelId = KieMusicModel['id'];

// Helper functions
export function getKieImageModel(id: string): KieImageModel | undefined {
  return KIE_IMAGE_MODELS.find(m => m.id === id);
}

export function getKieVideoModel(id: string): KieVideoModel | undefined {
  return KIE_VIDEO_MODELS.find(m => m.id === id);
}

export function getKieMusicModel(id: string): KieMusicModel | undefined {
  return KIE_MUSIC_MODELS.find(m => m.id === id);
}