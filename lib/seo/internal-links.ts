export interface InternalLinkItem {
  href: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export type InternalLinkId =
  | "videoGenerator"
  | "imageToVideo"
  | "textToVideo"
  | "videoFree"
  | "videoPrompts"
  | "videoPricingLimits"
  | "videoGenerationTool"
  | "promptGeneratorTool"
  | "blog"
  | "guideHowTo"
  | "guideBestPrompts"
  | "guideSettingsLimits";

interface LandingPageCard {
  title: string;
  description: string;
}

export interface ContentBlock {
  title: string;
  description: string;
  bullets: string[];
}

export interface ComparisonCard {
  title: string;
  summary: string;
  bullets: string[];
}

export interface ExampleCard {
  title: string;
  scenario: string;
  prompt: string;
  whyItWorks: string;
  nextStep: string;
}

interface LandingPageFaq {
  question: string;
  answer: string;
}

export interface SeoLandingPageConfig {
  href: string;
  metaTitle: string;
  metaDescription: string;
  title: string;
  description: string;
  badge: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  highlights: string[];
  audienceTitle: string;
  audienceDescription: string;
  audienceCards: LandingPageCard[];
  workflowTitle: string;
  workflowDescription: string;
  workflowSteps: string[];
  contentBlocksTitle?: string;
  contentBlocksDescription?: string;
  contentBlocks?: ContentBlock[];
  comparisonTitle?: string;
  comparisonDescription?: string;
  comparisonCards?: ComparisonCard[];
  exampleTitle?: string;
  exampleDescription?: string;
  exampleCards?: ExampleCard[];
  relatedLinkIds: InternalLinkId[];
  faqItems: LandingPageFaq[];
}

export interface GuidePageConfig {
  href: string;
  metaTitle: string;
  metaDescription: string;
  title: string;
  description: string;
  intro: string;
  steps: LandingPageCard[];
  tips: string[];
  contentBlocksTitle?: string;
  contentBlocksDescription?: string;
  contentBlocks?: ContentBlock[];
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  relatedLinkIds: InternalLinkId[];
}

const internalLinkMap: Record<InternalLinkId, InternalLinkItem> = {
  videoGenerator: {
    href: "/nano-banana-video-generator",
    title: "Nano Banana Video Generator",
    description:
      "The core landing page for Nano Banana video creation, workflows, and commercial use cases.",
    ctaLabel: "Explore the generator",
  },
  imageToVideo: {
    href: "/nano-banana-image-to-video",
    title: "Nano Banana Image to Video",
    description:
      "Learn how to turn still images, product shots, and scenes into short AI videos.",
    ctaLabel: "See image-to-video",
  },
  textToVideo: {
    href: "/nano-banana-text-to-video",
    title: "Nano Banana Text to Video",
    description:
      "Go from prompts to motion with a text-first workflow for ads, explainers, and social clips.",
    ctaLabel: "See text-to-video",
  },
  videoFree: {
    href: "/nano-banana-video-free",
    title: "Nano Banana Video Free",
    description:
      "Clarify what can be previewed without login and what free trial credits unlock after sign up.",
    ctaLabel: "Review free access",
  },
  videoPrompts: {
    href: "/nano-banana-video-prompts",
    title: "Nano Banana Video Prompts",
    description:
      "Prompt frameworks, examples, and reusable structures for better Nano Banana videos.",
    ctaLabel: "Browse prompt examples",
  },
  videoPricingLimits: {
    href: "/nano-banana-video-pricing-limits",
    title: "Nano Banana Pricing and Limits",
    description:
      "See credit usage, expected limits, length constraints, and practical settings guidance.",
    ctaLabel: "Check pricing and limits",
  },
  videoGenerationTool: {
    href: "/video-generation",
    title: "Video Generation Tool",
    description:
      "Open the production workflow and generate videos after sign in with available credits.",
    ctaLabel: "Open video tool",
  },
  promptGeneratorTool: {
    href: "/prompt-generator",
    title: "Prompt Generator Tool",
    description:
      "Draft stronger prompts, refine scene direction, and turn ideas into generation-ready inputs.",
    ctaLabel: "Open prompt tool",
  },
  blog: {
    href: "/blog",
    title: "Nano Banana Blog",
    description:
      "Read updates, experiments, examples, and supporting content tied back to the main workflow pages.",
    ctaLabel: "Read the blog",
  },
  guideHowTo: {
    href: "/guides/how-to-make-videos-with-nano-banana",
    title: "How to Make Videos With Nano Banana",
    description:
      "A step-by-step guide for moving from idea to first usable video output.",
    ctaLabel: "Read the guide",
  },
  guideBestPrompts: {
    href: "/guides/best-nano-banana-video-prompts",
    title: "Best Nano Banana Video Prompts",
    description:
      "Prompt formulas, examples, and adjustments for better motion, framing, and clarity.",
    ctaLabel: "Read prompt guide",
  },
  guideSettingsLimits: {
    href: "/guides/nano-banana-video-settings-and-limits",
    title: "Nano Banana Video Settings and Limits",
    description:
      "Understand length, quality, and settings tradeoffs before you spend credits on generation.",
    ctaLabel: "Read settings guide",
  },
};

export const p0LandingPageIds: InternalLinkId[] = [
  "videoGenerator",
  "imageToVideo",
  "textToVideo",
  "videoFree",
  "videoPrompts",
  "videoPricingLimits",
];

export const guidePageIds: InternalLinkId[] = [
  "guideHowTo",
  "guideBestPrompts",
  "guideSettingsLimits",
];

export function getInternalLinks(ids: InternalLinkId[]): InternalLinkItem[] {
  return ids.map((id) => internalLinkMap[id]);
}

export const seoLandingPages: Record<
  | "videoGenerator"
  | "imageToVideo"
  | "textToVideo"
  | "videoFree"
  | "videoPrompts"
  | "videoPricingLimits",
  SeoLandingPageConfig
> = {
  videoGenerator: {
    href: "/nano-banana-video-generator",
    metaTitle: "Nano Banana Video Generator - Create AI Videos Online",
    metaDescription:
      "Create AI videos with Nano Banana using text-to-video and image-to-video workflows. Preview the workflow without login, then sign up to start your free trial credits.",
    title: "Nano Banana Video Generator",
    description:
      "Use Nano Banana to move from ideas, prompts, and images to short AI videos. This page is the main overview for the full video workflow and the best entry point if you are still deciding where to start.",
    badge: "Core workflow page",
    primaryCtaHref: "/video-generation",
    primaryCtaLabel: "Try the video generator",
    secondaryCtaHref: "/prompt-generator",
    secondaryCtaLabel: "Open the prompt generator",
    highlights: [
      "Preview available without login",
      "Free to try after sign up",
      "Supports prompt-led and image-led workflows",
    ],
    audienceTitle: "What this page covers",
    audienceDescription:
      "Keep this page focused on the broad Nano Banana video intent and use supporting pages for narrower searches.",
    audienceCards: [
      {
        title: "Brand intent",
        description:
          "Capture users searching for Nano Banana video, generator, maker, or creator language.",
      },
      {
        title: "Workflow orientation",
        description:
          "Send users deeper into image-to-video, text-to-video, prompt help, or pricing details.",
      },
      {
        title: "Commercial conversion",
        description:
          "Make the next step obvious with direct links into the real tool and supporting proof pages.",
      },
    ],
    workflowTitle: "Recommended flow",
    workflowDescription:
      "A simple path keeps this page useful as both a landing page and a routing hub.",
    workflowSteps: [
      "Review the high-level workflow and choose whether you are starting from text or from images.",
      "Open the prompt generator if you need help structuring camera, motion, and scene direction.",
      "Move into the video generation tool to generate once you are signed in and have credits.",
    ],
    relatedLinkIds: [
      "videoGenerationTool",
      "imageToVideo",
      "textToVideo",
      "videoFree",
      "videoPrompts",
      "videoPricingLimits",
    ],
    faqItems: [
      {
        question: "What is Nano Banana video generator?",
        answer:
          "It is the main Nano Banana workflow for creating AI videos from prompts or from source images, with preview access before login and generation after sign up.",
      },
      {
        question: "Can Nano Banana create videos from text and images?",
        answer:
          "Yes. The broader workflow supports both prompt-led text-to-video and image-to-video paths depending on how you want to start.",
      },
      {
        question: "Is Nano Banana video generator free to try?",
        answer:
          "The product can be previewed without login. Generation is free to try after sign up when trial credits are available.",
      },
      {
        question: "Where should I start if I need help writing prompts?",
        answer:
          "Start on the prompt-focused page or open the prompt generator directly, then come back to the video tool when your prompt structure is ready.",
      },
    ],
  },
  imageToVideo: {
    href: "/nano-banana-image-to-video",
    metaTitle: "Nano Banana Image to Video - Turn Images Into AI Videos",
    metaDescription:
      "Turn Nano Banana images into AI videos online. Preview the workflow without login, then sign up to use trial credits, add motion prompts, and generate videos.",
    title: "Nano Banana Image to Video",
    description:
      "Use this page when your entry point is a still image. It focuses on how to add motion, preserve composition, and improve the first generation pass.",
    badge: "Image-led workflow",
    primaryCtaHref: "/video-generation",
    primaryCtaLabel: "Start image to video",
    secondaryCtaHref: "/nano-banana-video-prompts",
    secondaryCtaLabel: "Review prompt examples",
    highlights: [
      "Best for product shots, portraits, and still scenes",
      "Preview available without login",
      "Add motion prompts before spending credits",
    ],
    audienceTitle: "Best fit use cases",
    audienceDescription:
      "This page should answer the exact image-led intent instead of competing with broader brand terms.",
    audienceCards: [
      {
        title: "Product pages",
        description:
          "Turn catalog or landing page images into motion clips for demos and ad creative.",
      },
      {
        title: "Visual storytelling",
        description:
          "Start from concept art, character frames, or scene stills and add camera movement.",
      },
      {
        title: "Prompt-assisted generation",
        description:
          "Use a short motion prompt to define the action, pacing, and framing around the input image.",
      },
    ],
    workflowTitle: "How to approach image-to-video",
    workflowDescription:
      "A focused workflow reduces failed generations and makes the image page useful as a conversion page.",
    workflowSteps: [
      "Pick a clear source image with a strong subject and stable composition.",
      "Describe only the motion and camera move you want to add instead of rewriting the whole scene.",
      "Use the video generation tool after sign up, then refine the prompt if the first motion pass is too broad.",
    ],
    relatedLinkIds: [
      "videoGenerationTool",
      "videoGenerator",
      "textToVideo",
      "videoPrompts",
      "guideHowTo",
      "guideSettingsLimits",
    ],
    faqItems: [
      {
        question: "What images work best for Nano Banana image to video?",
        answer:
          "Clear focal subjects, strong lighting, and simple composition usually lead to better motion and more stable first outputs.",
      },
      {
        question: "Do I need a long prompt for image to video?",
        answer:
          "Usually no. Start with the motion, camera direction, and emotional tone, then refine only what is missing.",
      },
      {
        question: "Can I preview the workflow before login?",
        answer:
          "Yes. You can inspect the flow before login, then sign up to use available trial credits for generation.",
      },
      {
        question: "What should I do if I actually need prompt-only generation?",
        answer:
          "Move to the text-to-video page or the prompt generator so the page intent stays clear and the workflow matches your starting point.",
      },
    ],
  },
  textToVideo: {
    href: "/nano-banana-text-to-video",
    metaTitle: "Nano Banana Text to Video - Generate AI Videos From Prompts",
    metaDescription:
      "Generate AI videos from text prompts with Nano Banana. Preview the workflow without login, then sign up to use trial credits and create videos online.",
    title: "Nano Banana Text to Video",
    description:
      "This page is for prompt-first users who want to turn a written scene idea into a usable short-form video concept with better camera direction and clearer motion.",
    badge: "Prompt-led workflow",
    primaryCtaHref: "/video-generation",
    primaryCtaLabel: "Start text to video",
    secondaryCtaHref: "/prompt-generator",
    secondaryCtaLabel: "Build a stronger prompt",
    highlights: [
      "Prompt-first video workflow",
      "Useful for ads, explainers, and scene concepts",
      "Free to try after sign up",
    ],
    audienceTitle: "Where this page helps most",
    audienceDescription:
      "The text-to-video page should stay centered on prompt quality and production-ready scene direction.",
    audienceCards: [
      {
        title: "Draft faster",
        description:
          "Start with a scene idea, camera move, and subject action instead of wrestling with empty prompts.",
      },
      {
        title: "Improve clarity",
        description:
          "Make pacing, composition, and movement explicit so the model has clearer instructions.",
      },
      {
        title: "Bridge into production",
        description:
          "Use prompt examples here, then move directly into the video tool when you are ready to generate.",
      },
    ],
    workflowTitle: "A practical text-to-video path",
    workflowDescription:
      "Keep the next step obvious so this page supports both search intent and tool conversion.",
    workflowSteps: [
      "Write the scene in one sentence, then add motion, camera, and mood as separate details.",
      "Use the prompt generator if your prompt is vague or if you need examples by use case.",
      "Generate in the main video tool and compare the result with your intended framing before refining again.",
    ],
    relatedLinkIds: [
      "videoGenerationTool",
      "promptGeneratorTool",
      "videoGenerator",
      "imageToVideo",
      "videoPrompts",
      "guideBestPrompts",
    ],
    faqItems: [
      {
        question: "Can Nano Banana generate videos from text?",
        answer:
          "Yes. This page focuses on prompt-led video creation, where the written scene is the starting point instead of an uploaded source image.",
      },
      {
        question: "How detailed should a prompt be?",
        answer:
          "Detailed enough to define subject, action, camera, and tone, but not so long that it repeats itself or conflicts.",
      },
      {
        question: "Should I use the prompt generator first?",
        answer:
          "Use it whenever you need structure, examples, or a cleaner prompt before spending credits in the video tool.",
      },
      {
        question: "Is the workflow available before login?",
        answer:
          "The interface can be previewed without login. Generation is unlocked after sign up when trial or paid credits are available.",
      },
    ],
  },
  videoFree: {
    href: "/nano-banana-video-free",
    metaTitle: "Nano Banana Video Free - Free AI Video Generator Online",
    metaDescription:
      "Try Nano Banana video generation online with preview access before login. Sign up to unlock trial credits and create AI videos from text and images.",
    title: "Nano Banana Video Free",
    description:
      "Use this page to explain the free entry path clearly without overpromising anonymous generation. It is the bridge between curiosity traffic and qualified sign ups.",
    badge: "Free-trial intent page",
    primaryCtaHref: "/video-generation",
    primaryCtaLabel: "See the free workflow",
    secondaryCtaHref: "/nano-banana-video-pricing-limits",
    secondaryCtaLabel: "Check credits and limits",
    highlights: [
      "Preview available without login",
      "Free to try after sign up",
      "Useful for free, online, and no-install intent",
    ],
    audienceTitle: "Questions this page should answer",
    audienceDescription:
      "Keep the promise accurate so the free page builds trust instead of creating mismatch with the actual product.",
    audienceCards: [
      {
        title: "What is free",
        description:
          "Explain preview access, sign-up flow, and trial-credit access without implying unrestricted anonymous use.",
      },
      {
        title: "What still has limits",
        description:
          "Set expectations around credits, generation volume, and when paid usage becomes necessary.",
      },
      {
        title: "Where to go next",
        description:
          "Push users either into the main video tool or into pricing details depending on their intent.",
      },
    ],
    workflowTitle: "How to position the free experience",
    workflowDescription:
      "This page works best when it sends high-intent users to the tool and cautious users to the limits page.",
    workflowSteps: [
      "Show that the workflow can be previewed without login so the product is not a black box.",
      "Clarify that sign up unlocks trial access and real generation once credits are available.",
      "Link to pricing and limits for users who are already comparing usage volume or paid expectations.",
    ],
    relatedLinkIds: [
      "videoGenerationTool",
      "videoGenerator",
      "videoPrompts",
      "videoPricingLimits",
      "guideSettingsLimits",
    ],
    faqItems: [
      {
        question: "Is Nano Banana video free?",
        answer:
          "The workflow can be previewed without login and is free to try after sign up when trial credits are available.",
      },
      {
        question: "Can I use it online without installing anything?",
        answer:
          "Yes. The product is web-based, so the normal path is to open the tool in the browser and sign in before generating.",
      },
      {
        question: "Where do I see credit usage and limits?",
        answer:
          "Use the pricing and limits page for a cleaner explanation of credits, quality settings, and likely constraints.",
      },
      {
        question: "What if I only need help writing prompts?",
        answer:
          "Go to the prompt page or the prompt generator first, then return to the main tool for generation.",
      },
    ],
  },
  videoPrompts: {
    href: "/nano-banana-video-prompts",
    metaTitle: "Nano Banana Video Prompts - Best Prompt Examples for AI Videos",
    metaDescription:
      "Explore the best Nano Banana video prompts for text-to-video and image-to-video workflows. Use examples and prompt patterns to generate better videos.",
    title: "Nano Banana Video Prompts",
    description:
      "This page pairs instructional content with the actual prompt generator. It should rank for prompt intent while sending the most qualified traffic into the tool.",
    badge: "Prompt education page",
    primaryCtaHref: "/prompt-generator",
    primaryCtaLabel: "Open the prompt generator",
    secondaryCtaHref: "/video-generation",
    secondaryCtaLabel: "Generate a video now",
    highlights: [
      "Built for prompt and example intent",
      "Strong bridge into the prompt generator",
      "Supports both text-to-video and image-to-video",
    ],
    audienceTitle: "What users need here",
    audienceDescription:
      "Prompt pages perform best when they teach structure and still keep the next tool step obvious.",
    audienceCards: [
      {
        title: "Prompt formula",
        description:
          "Show users how to combine subject, action, camera, style, and constraints in a useful order.",
      },
      {
        title: "Examples by scenario",
        description:
          "Cover product demos, cinematic scenes, creator content, and image-guided motion prompts.",
      },
      {
        title: "Direct tool access",
        description:
          "Hand off to the prompt generator or video tool without forcing users to hunt for the next action.",
      },
    ],
    workflowTitle: "A simple prompt workflow",
    workflowDescription:
      "Users searching for prompt help are usually close to conversion if you remove uncertainty quickly.",
    workflowSteps: [
      "Start with a prompt formula that separates scene, action, camera, and style.",
      "Compare a few examples to decide whether your output should be text-first or image-guided.",
      "Open the prompt generator for a cleaner draft, then continue in the video tool.",
    ],
    relatedLinkIds: [
      "promptGeneratorTool",
      "videoGenerationTool",
      "imageToVideo",
      "textToVideo",
      "videoGenerator",
      "guideBestPrompts",
    ],
    faqItems: [
      {
        question: "What makes a good Nano Banana video prompt?",
        answer:
          "A good prompt clearly defines subject, movement, camera behavior, and tone without cramming in conflicting ideas.",
      },
      {
        question: "Can one prompt work for text to video and image to video?",
        answer:
          "Yes, but image-guided prompts usually only need motion and camera instructions, while text-only prompts must describe the full scene.",
      },
      {
        question: "Is there a Nano Banana prompt generator?",
        answer:
          "Yes. This page should route prompt-search traffic directly into the prompt generator when users are ready to draft.",
      },
      {
        question: "Where should I go after building a prompt?",
        answer:
          "Move into the main video generation tool once the prompt structure is stable and you are ready to generate.",
      },
    ],
  },
  videoPricingLimits: {
    href: "/nano-banana-video-pricing-limits",
    metaTitle: "Nano Banana Video Pricing and Limits - Credits, Length, Quality",
    metaDescription:
      "Learn Nano Banana video pricing, credit usage, video length limits, quality options, and generation settings before you start using credits.",
    title: "Nano Banana Video Pricing and Limits",
    description:
      "Use this page to consolidate credit, quality, length, and settings questions so they do not dilute the broader feature pages.",
    badge: "Support and decision page",
    primaryCtaHref: "/video-generation",
    primaryCtaLabel: "Open the video tool",
    secondaryCtaHref: "/nano-banana-video-free",
    secondaryCtaLabel: "Review free access",
    highlights: [
      "Dedicated page for credits and limits intent",
      "Supports pricing, length, and settings searches",
      "Keeps constraint content off the broader landing pages",
    ],
    audienceTitle: "What this page should answer",
    audienceDescription:
      "Users landing here are usually comparing costs, settings, or feasibility before they commit to generation.",
    audienceCards: [
      {
        title: "Credit expectations",
        description:
          "Explain where users should look before they spend credits or commit to a paid path.",
      },
      {
        title: "Output constraints",
        description:
          "Capture questions around length, quality, and what settings are likely to matter most.",
      },
      {
        title: "Decision support",
        description:
          "Push free-intent users to the free page and action-ready users back into the main tool.",
      },
    ],
    workflowTitle: "How to use this page",
    workflowDescription:
      "Keep users moving instead of trapping them in research mode.",
    workflowSteps: [
      "Review the likely constraints around credits, length, and quality before your first serious generation run.",
      "If cost or trial access matters most, move to the free page for a cleaner entry explanation.",
      "If you are already ready to test, go straight into the video generation tool and refine from there.",
    ],
    relatedLinkIds: [
      "videoGenerationTool",
      "videoGenerator",
      "videoFree",
      "textToVideo",
      "imageToVideo",
      "guideSettingsLimits",
    ],
    faqItems: [
      {
        question: "Where should I look for Nano Banana credit usage?",
        answer:
          "Use this page as the central place for pricing, limits, and settings questions, then move into the product once you understand the tradeoffs.",
      },
      {
        question: "Does this page replace the free page?",
        answer:
          "No. The free page explains access and onboarding, while this page exists for deeper constraint and cost questions.",
      },
      {
        question: "Should users start here or on the main generator page?",
        answer:
          "Users with general product intent should start on the main generator page. Users who are already comparing limits or costs should land here.",
      },
      {
        question: "What is the next best step after reading this?",
        answer:
          "Either review the free access page or move directly into the video tool if you already understand the constraints.",
      },
    ],
  },
};

export const guidePages: Record<
  "guideHowTo" | "guideBestPrompts" | "guideSettingsLimits",
  GuidePageConfig
> = {
  guideHowTo: {
    href: "/guides/how-to-make-videos-with-nano-banana",
    metaTitle: "How to Make Videos With Nano Banana - Step by Step Guide",
    metaDescription:
      "A practical walkthrough for making videos with Nano Banana, from choosing a workflow to refining the first output.",
    title: "How to Make Videos With Nano Banana",
    description:
      "Use this guide when you want a straight path from idea to first output without bouncing between scattered pages.",
    intro:
      "Start with the simplest version of the workflow, then branch into image-led or prompt-led pages only when you need more detail.",
    steps: [
      {
        title: "Choose the starting point",
        description:
          "If you have a source image, use image-to-video. If you only have an idea, use text-to-video or the prompt generator first.",
      },
      {
        title: "Draft the prompt with structure",
        description:
          "Separate subject, action, camera, and mood so you can change one variable at a time after the first result.",
      },
      {
        title: "Generate and refine",
        description:
          "Use the video tool after sign up, compare the output to your intent, and tighten only the missing parts.",
      },
    ],
    tips: [
      "Keep the first generation narrow and testable.",
      "Avoid stacking multiple camera moves in one short prompt.",
      "Use the prompt generator when your draft feels vague.",
    ],
    primaryCtaHref: "/video-generation",
    primaryCtaLabel: "Open the video tool",
    secondaryCtaHref: "/nano-banana-video-generator",
    secondaryCtaLabel: "Back to the main workflow page",
    relatedLinkIds: [
      "videoGenerator",
      "imageToVideo",
      "textToVideo",
      "promptGeneratorTool",
    ],
  },
  guideBestPrompts: {
    href: "/guides/best-nano-banana-video-prompts",
    metaTitle: "Best Nano Banana Video Prompts - Prompt Formulas and Examples",
    metaDescription:
      "Learn better Nano Banana prompt structures and examples for text-to-video and image-to-video workflows.",
    title: "Best Nano Banana Video Prompts",
    description:
      "Use this guide to tighten prompts before spending credits on new generations.",
    intro:
      "The goal is not longer prompts. The goal is prompts with cleaner structure, fewer contradictions, and a clearer motion plan.",
    steps: [
      {
        title: "Write the scene in one line",
        description:
          "Define who or what is on screen and what the moment should feel like before adding technical detail.",
      },
      {
        title: "Add motion and camera separately",
        description:
          "Describe subject motion and camera motion as separate instructions so the output stays more stable.",
      },
      {
        title: "Refine from the result",
        description:
          "If the scene is right but the framing is wrong, adjust only the camera language rather than rewriting everything.",
      },
    ],
    tips: [
      "Short, clear prompts usually outperform bloated prompts.",
      "Use one style direction at a time.",
      "Treat examples as structures, not scripts to copy blindly.",
    ],
    primaryCtaHref: "/prompt-generator",
    primaryCtaLabel: "Use the prompt generator",
    secondaryCtaHref: "/nano-banana-video-prompts",
    secondaryCtaLabel: "Back to prompt page",
    relatedLinkIds: [
      "videoPrompts",
      "textToVideo",
      "imageToVideo",
      "videoGenerationTool",
    ],
  },
  guideSettingsLimits: {
    href: "/guides/nano-banana-video-settings-and-limits",
    metaTitle: "Nano Banana Video Settings and Limits - Practical Guide",
    metaDescription:
      "A practical guide to Nano Banana video settings, quality tradeoffs, and limits to review before generation.",
    title: "Nano Banana Video Settings and Limits",
    description:
      "Use this guide when you are already close to generation and want fewer surprises around quality, credits, or feasibility.",
    intro:
      "The point of settings guidance is to reduce wasted runs, not to turn every generation into a research project.",
    steps: [
      {
        title: "Define the output goal",
        description:
          "Know whether you are optimizing for speed, social proof, ad creativity, or visual polish before changing settings.",
      },
      {
        title: "Check limits first",
        description:
          "Review credit and output expectations before testing multiple variations, especially for client-facing work.",
      },
      {
        title: "Adjust one variable at a time",
        description:
          "If the result changes, you should know whether length, prompt, or quality guidance caused it.",
      },
    ],
    tips: [
      "Research mode should lead to a tool action, not replace it.",
      "Keep notes on which prompt changes actually improved output.",
      "Use the free page for onboarding questions and the pricing page for constraint questions.",
    ],
    primaryCtaHref: "/video-generation",
    primaryCtaLabel: "Open the video tool",
    secondaryCtaHref: "/nano-banana-video-pricing-limits",
    secondaryCtaLabel: "Back to pricing and limits",
    relatedLinkIds: [
      "videoPricingLimits",
      "videoFree",
      "imageToVideo",
      "videoGenerationTool",
    ],
  },
};
