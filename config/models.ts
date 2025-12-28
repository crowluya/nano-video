export const LANGUAGE_MODELS = [
  {
    provider: "openrouter",
    name: "OpenRouter",
    models: [
      // 先放出的模型
      {
        id: "deepseek/deepseek-v3.2",
        name: "DeepSeek V3.2",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      {
        id: "tngtech/deepseek-r1t2-chimera",
        name: "DeepSeek R1T2 Chimera",
        inputSupport: ["text"],
        outputSupport: ["text", "reasoning"],
      },
      {
        id: "google/gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      {
        id: "google/gemini-2.0-flash-001",
        name: "Gemini 2.0 Flash",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      {
        id: "google/gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash Lite",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      {
        id: "openai/gpt-5-mini",
        name: "GPT-5 Mini",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      {
        id: "anthropic/claude-haiku-4.5",
        name: "Claude Haiku 4.5",
        inputSupport: ["text"],
        outputSupport: ["text"],
      },
      // 后续会添加的模型（暂时注释）
      // {
      //   id: "deepseek/deepseek-chat-v3-0324",
      //   name: "DeepSeek Chat V3-0324",
      //   inputSupport: ["text"],
      //   outputSupport: ["text"],
      // },
      // {
      //   id: "deepseek/deepseek-r1-0528",
      //   name: "DeepSeek R1-0528",
      //   inputSupport: ["text"],
      //   outputSupport: ["text", "reasoning"],
      // },
      // {
      //   id: "deepseek/deepseek-r1",
      //   name: "DeepSeek R1",
      //   inputSupport: ["text"],
      //   outputSupport: ["text", "reasoning"],
      // },
      // {
      //   id: "openai/gpt-oss-120b",
      //   name: "GPT OSS 120B",
      //   inputSupport: ["text"],
      //   outputSupport: ["text"],
      // },
      // {
      //   id: "openai/gpt-5-nano",
      //   name: "GPT-5 Nano",
      //   inputSupport: ["text"],
      //   outputSupport: ["text"],
      // },
      // {
      //   id: "x-ai/grok-code-fast-1",
      //   name: "Grok Code Fast 1",
      //   inputSupport: ["text"],
      //   outputSupport: ["text"],
      // },
      // {
      //   id: "z-ai/glm-4.6",
      //   name: "GLM 4.6",
      //   inputSupport: ["text"],
      //   outputSupport: ["text"],
      // },
    ]
  },
];

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
    features: ["text-to-image", "image-to-image"],
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
    aspectRatios: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "auto"] as const,
    outputFormats: ["png", "jpg"] as const,
    resolutions: ["1K", "2K", "4K"] as const,
    creditsPerGeneration: 15,
  },
  {
    provider: "kie",
    id: "z-image",
    name: "Z-Image",
    description: "Tongyi-MAI Z-Image Turbo - Photorealistic & Fast",
    features: ["text-to-image"],
    aspectRatios: ["1:1", "4:3", "3:4", "16:9", "9:16"] as const,
    creditsPerGeneration: 8,
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
  // Sora 2 Models (Fast Mode)
  {
    provider: "kie",
    id: "sora-2-text-to-video",
    name: "Sora 2 (Fast)",
    description: "OpenAI Sora 2 - Text to Video (Fast Mode)",
    features: ["text-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const, // Sora 2 supports 10s and 15s
    resolutions: ["720p"] as const, // Sora 2 only supports 720p
  },
  {
    provider: "kie",
    id: "sora-2-image-to-video",
    name: "Sora 2 Image (Fast)",
    description: "OpenAI Sora 2 - Image to Video (Fast Mode)",
    features: ["image-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const, // Sora 2 supports 10s and 15s
    resolutions: ["720p"] as const, // Sora 2 only supports 720p
  },
  // Sora 2 Pro Models (Quality Mode)
  {
    provider: "kie",
    id: "sora-2-pro-text-to-video",
    name: "Sora 2 Pro (Quality)",
    description: "OpenAI Sora 2 Pro - Text to Video (Quality Mode)",
    features: ["text-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const,
    resolutions: ["720p", "1080p"] as const,
  },
  {
    provider: "kie",
    id: "sora-2-pro-image-to-video",
    name: "Sora 2 Pro Image (Quality)",
    description: "OpenAI Sora 2 Pro - Image to Video (Quality Mode)",
    features: ["image-to-video"],
    aspectRatios: ["portrait", "landscape"] as const,
    durations: ["10", "15"] as const,
    resolutions: ["720p", "1080p"] as const,
  },
  // Veo 3.1 Models
  {
    provider: "kie",
    id: "veo-3.1-fast",
    name: "Veo 3.1 Fast",
    description: "Google Veo 3.1 Fast - Text/Image to Video",
    features: ["text-to-video", "image-to-video", "start-end-frame-to-video", "reference-to-video"],
    aspectRatios: ["16:9", "9:16"] as const,
    durations: ["8"] as const,
    resolutions: ["720p"] as const,
  },
  {
    provider: "kie",
    id: "veo-3.1-start-end-frame",
    name: "Veo 3.1 (Start & End Frame)",
    description: "Google Veo 3.1 - Start & End Frame to Video",
    features: ["start-end-frame-to-video"],
    aspectRatios: ["16:9", "9:16"] as const,
    durations: ["8"] as const,
    resolutions: ["720p"] as const,
  },
  {
    provider: "kie",
    id: "veo-3.1-reference",
    name: "Veo 3.1 (Reference)",
    description: "Google Veo 3.1 - Reference Images to Video",
    features: ["reference-to-video"],
    aspectRatios: ["16:9", "9:16"] as const,
    durations: ["8"] as const,
    resolutions: ["720p"] as const,
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

// =============================================================================
// Text to Image models - using kie.ai
// =============================================================================

export const TEXT_TO_IMAGE_MODELS = KIE_IMAGE_MODELS.filter(
  (model): model is typeof KIE_IMAGE_MODELS[number] =>
    (model.features as readonly string[]).includes("text-to-image")
).map((model) => ({
  provider: model.provider,
  name: model.name,
  id: model.id,
}));

// =============================================================================
// Image to Image models - using kie.ai
// =============================================================================

export const IMAGE_TO_IMAGE_MODELS = KIE_IMAGE_MODELS.filter(
  (model): model is typeof KIE_IMAGE_MODELS[number] =>
    (model.features as readonly string[]).includes("image-to-image")
).map((model) => ({
  provider: model.provider,
  name: model.name,
  id: model.id,
}));

// =============================================================================
// Image/Text to Video models - using kie.ai
// =============================================================================

export const IMAGE_TO_VIDEO_MODELS = KIE_VIDEO_MODELS.map((model) => ({
  provider: model.provider,
  name: model.name,
  id: model.id,
}));