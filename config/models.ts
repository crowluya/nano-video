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
