import { Locale } from "@/i18n/routing";
import {
  GuidePageConfig,
  guidePages,
  getInternalLinks,
  InternalLinkId,
  InternalLinkItem,
  SeoLandingPageConfig,
  seoLandingPages,
} from "@/lib/seo/internal-links";

type SupportedSeoLocale = "en" | "zh" | "ja" | "es";
type LandingPageKey = keyof typeof seoLandingPages;
type GuidePageKey = keyof typeof guidePages;

interface HomeSectionCopy {
  eyebrow: string;
  title: string;
  description: string;
}

interface BlogDetailCtaCopy {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
}

interface InternalLinksUiCopy {
  navExplore: string;
  navGuides: string;
  homeExplore: HomeSectionCopy;
  homeGuides: HomeSectionCopy;
  homeStart: HomeSectionCopy;
  promptTool: HomeSectionCopy;
  videoTool: HomeSectionCopy;
  blogList: HomeSectionCopy;
  blogDetailRelated: HomeSectionCopy;
  blogDetailCta: BlogDetailCtaCopy;
  landingTemplate: {
    relatedEyebrow: string;
    relatedTitle: string;
    relatedDescription: string;
    faqTitle: string;
    faqDescription: string;
    stepLabel: string;
  };
  guideTemplate: {
    badge: string;
    notesTitle: string;
    relatedEyebrow: string;
    relatedTitle: string;
    relatedDescription: string;
    stepLabel: string;
  };
}

type PageOverride<T> = Partial<Omit<T, "href" | "relatedLinkIds">>;
interface SharedContentSection {
  contentBlocksTitle?: string;
  contentBlocksDescription?: string;
  contentBlocks?: SeoLandingPageConfig["contentBlocks"];
}

interface LandingPageComparisonSection {
  comparisonTitle?: string;
  comparisonDescription?: string;
  comparisonCards?: SeoLandingPageConfig["comparisonCards"];
}

interface LandingPageExampleSection {
  exampleTitle?: string;
  exampleDescription?: string;
  exampleCards?: SeoLandingPageConfig["exampleCards"];
}

type LandingPageContentSection = SharedContentSection;
type GuidePageContentSection = SharedContentSection;

const supportedLocales = new Set<SupportedSeoLocale>(["en", "zh", "ja", "es"]);

function resolveLocale(locale: Locale | string): SupportedSeoLocale {
  return supportedLocales.has(locale as SupportedSeoLocale)
    ? (locale as SupportedSeoLocale)
    : "en";
}

const defaultUiCopy: InternalLinksUiCopy = {
  navExplore: "Explore",
  navGuides: "Guides",
  homeExplore: {
    eyebrow: "Explore more pages",
    title: "Explore Nano Banana Video Workflows",
    description:
      "Move from the broad homepage into the exact workflow page that matches the user's search intent, whether that is image-to-video, text-to-video, prompts, free access, or current limits.",
  },
  homeGuides: {
    eyebrow: "Popular guides",
    title: "Learn before you generate",
    description:
      "These guide pages answer workflow, prompt, and settings questions while routing users back into the real product flow.",
  },
  homeStart: {
    eyebrow: "Start here",
    title: "Move from research into the product",
    description:
      "Once users understand the workflow, the best next step is usually to open the prompt tool, generate a video, or continue reading in the blog.",
  },
  promptTool: {
    eyebrow: "Learn before you generate",
    title: "Related pages for prompt-led workflows",
    description:
      "The prompt tool should route visitors into the supporting pages for prompts, workflow choice, and onboarding instead of becoming a dead end.",
  },
  videoTool: {
    eyebrow: "Related pages",
    title: "Supporting pages for the video tool",
    description:
      "Use these pages to move from direct generation into prompts, workflow selection, pricing details, and setup guides.",
  },
  blogList: {
    eyebrow: "Recommended pages",
    title: "Use the blog as a route into the workflow",
    description:
      "The blog should support discovery, but the supporting topic pages are what carry the core Nano Banana search intents.",
  },
  blogDetailRelated: {
    eyebrow: "Recommended pages",
    title: "Related topic pages",
    description:
      "Use these supporting pages and guides to move from content consumption into the actual Nano Banana workflow.",
  },
  blogDetailCta: {
    title: "Continue with the product workflow",
    description:
      "Every blog article should point readers back to a topic page and to the real tool flow, not just to more articles.",
    primaryLabel: "Open the prompt generator",
    secondaryLabel: "Explore Nano Banana Video Generator",
  },
  landingTemplate: {
    relatedEyebrow: "Related pages",
    relatedTitle: "Keep exploring the Nano Banana workflow",
    relatedDescription:
      "These supporting pages handle adjacent search intents and route traffic back into the product tools.",
    faqTitle: "FAQ",
    faqDescription:
      "Keep the page intent narrow, answer the core objections, and send users to the right next step.",
    stepLabel: "Step",
  },
  guideTemplate: {
    badge: "Guide",
    notesTitle: "Practical notes",
    relatedEyebrow: "Related pages",
    relatedTitle: "Continue with the right next page",
    relatedDescription:
      "Guides should feed users back into the main workflow pages and the actual product tools.",
    stepLabel: "Step",
  },
};

const uiOverrides: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<InternalLinksUiCopy>
> = {
  zh: {
    navExplore: "探索",
    navGuides: "指南",
    homeExplore: {
      eyebrow: "更多页面",
      title: "探索 Nano Banana Video 工作流",
      description:
        "从首页分发到更精确的承接页，覆盖图生视频、文生视频、提示词、免费试用和限制说明等不同搜索意图。",
    },
    homeGuides: {
      eyebrow: "热门指南",
      title: "先看清流程，再开始生成",
      description:
        "这些指南页负责回答工作流、提示词和参数问题，并把用户导回真实产品路径。",
    },
    homeStart: {
      eyebrow: "开始使用",
      title: "从调研进入产品",
      description:
        "当用户理解了流程，下一步通常就是打开提示词工具、开始生成视频，或者继续阅读博客。",
    },
    promptTool: {
      eyebrow: "生成前先了解",
      title: "适合提示词工作流的相关页面",
      description:
        "提示词工具页不应该成为死胡同，而应该把用户导向提示词、工作流和上手说明相关页面。",
    },
    videoTool: {
      eyebrow: "相关页面",
      title: "视频工具页的支撑页面",
      description:
        "通过这些页面，把直接进入生成器的用户导向提示词、工作流选择、价格限制和上手指南。",
    },
    blogList: {
      eyebrow: "推荐页面",
      title: "把博客作为进入工作流的入口",
      description:
        "博客负责发现与教育，真正承接核心搜索意图的仍然是这些专题页。",
    },
    blogDetailRelated: {
      eyebrow: "推荐页面",
      title: "相关专题页",
      description:
        "通过这些专题页和指南，把用户从内容阅读继续导向真实的 Nano Banana 工作流。",
    },
    blogDetailCta: {
      title: "继续进入产品工作流",
      description:
        "每篇博客都应该把读者导回专题页和真实工具路径，而不只是继续读更多文章。",
      primaryLabel: "打开提示词生成器",
      secondaryLabel: "查看 Nano Banana Video Generator",
    },
    landingTemplate: {
      relatedEyebrow: "相关页面",
      relatedTitle: "继续探索 Nano Banana 工作流",
      relatedDescription:
        "这些支撑页承接相邻搜索意图，并把流量重新导回产品工具。",
      faqTitle: "常见问题",
      faqDescription: "让页面意图保持单一，回答核心疑问，并给出清晰的下一步。",
      stepLabel: "步骤",
    },
    guideTemplate: {
      badge: "指南",
      notesTitle: "实用提示",
      relatedEyebrow: "相关页面",
      relatedTitle: "继续进入正确的下一页",
      relatedDescription:
        "指南页应该把用户重新导回核心工作流页面和真实工具。",
      stepLabel: "步骤",
    },
  },
  ja: {
    navExplore: "探索",
    navGuides: "ガイド",
    homeExplore: {
      eyebrow: "関連ページ",
      title: "Nano Banana Video のワークフローを探す",
      description:
        "トップページから、画像から動画、テキストから動画、プロンプト、無料トライアル、制限説明など、意図に合うページへ分配します。",
    },
    homeGuides: {
      eyebrow: "人気ガイド",
      title: "生成前に流れを理解する",
      description:
        "これらのガイドはワークフロー、プロンプト、設定に関する疑問を受け止め、実際の製品フローへ戻します。",
    },
    homeStart: {
      eyebrow: "ここから開始",
      title: "調査から製品利用へ進む",
      description:
        "流れを理解したあとは、プロンプトツールを開くか、動画生成を始めるか、補助的にブログを読むのが自然な次の行動です。",
    },
    promptTool: {
      eyebrow: "生成前に学ぶ",
      title: "プロンプト主導のワークフロー向け関連ページ",
      description:
        "プロンプトツールは行き止まりではなく、プロンプト、ワークフロー、導入説明のページへ送るべきです。",
    },
    videoTool: {
      eyebrow: "関連ページ",
      title: "動画ツールを支えるページ",
      description:
        "これらのページを通じて、直接生成に来たユーザーをプロンプト、フロー選択、料金・制限、導入ガイドへ回します。",
    },
    blogList: {
      eyebrow: "おすすめページ",
      title: "ブログをワークフローへの入口にする",
      description:
        "ブログは発見を支えますが、主要な検索意図を受け止めるのはこれらのトピックページです。",
    },
    blogDetailRelated: {
      eyebrow: "おすすめページ",
      title: "関連トピックページ",
      description:
        "これらの補助ページとガイドを使って、記事閲覧から Nano Banana の実際のワークフローへ進めます。",
    },
    blogDetailCta: {
      title: "製品ワークフローへ進む",
      description:
        "各ブログ記事は、読者を別の記事だけでなく、トピックページと実際のツールにも戻すべきです。",
      primaryLabel: "プロンプトジェネレーターを開く",
      secondaryLabel: "Nano Banana Video Generator を見る",
    },
    landingTemplate: {
      relatedEyebrow: "関連ページ",
      relatedTitle: "Nano Banana のワークフローをさらに確認する",
      relatedDescription:
        "これらの支援ページは隣接する検索意図を受け止め、製品ツールへ戻します。",
      faqTitle: "FAQ",
      faqDescription:
        "ページ意図を絞り込み、主要な疑問に答え、次の行動を明確にします。",
      stepLabel: "ステップ",
    },
    guideTemplate: {
      badge: "ガイド",
      notesTitle: "実践メモ",
      relatedEyebrow: "関連ページ",
      relatedTitle: "次に進むべきページへつなぐ",
      relatedDescription:
        "ガイドはユーザーを主要ワークフローページと実際のツールへ戻すべきです。",
      stepLabel: "ステップ",
    },
  },
  es: {
    navExplore: "Explorar",
    navGuides: "Guias",
    homeExplore: {
      eyebrow: "Mas paginas",
      title: "Explora los flujos de Nano Banana Video",
      description:
        "Desde la home, envia a cada usuario a la pagina que mejor coincide con su intencion: imagen a video, texto a video, prompts, acceso gratis o limites.",
    },
    homeGuides: {
      eyebrow: "Guias populares",
      title: "Entiende el flujo antes de generar",
      description:
        "Estas guias responden dudas sobre prompts, flujo y configuracion, y devuelven al usuario al camino real del producto.",
    },
    homeStart: {
      eyebrow: "Empieza aqui",
      title: "Pasa de investigar a usar el producto",
      description:
        "Cuando el usuario entiende el flujo, el siguiente paso natural es abrir la herramienta de prompts, generar un video o seguir leyendo en el blog.",
    },
    promptTool: {
      eyebrow: "Aprende antes de generar",
      title: "Paginas relacionadas para flujos guiados por prompts",
      description:
        "La herramienta de prompts no debe ser un callejon sin salida. Debe llevar a paginas de prompts, flujo y onboarding.",
    },
    videoTool: {
      eyebrow: "Paginas relacionadas",
      title: "Paginas de apoyo para la herramienta de video",
      description:
        "Usa estas paginas para mover a usuarios desde la generacion directa hacia prompts, eleccion de flujo, precios y guias de inicio.",
    },
    blogList: {
      eyebrow: "Paginas recomendadas",
      title: "Usa el blog como ruta hacia el flujo",
      description:
        "El blog ayuda al descubrimiento, pero las paginas tematicas son las que capturan la intencion principal de busqueda.",
    },
    blogDetailRelated: {
      eyebrow: "Paginas recomendadas",
      title: "Paginas tematicas relacionadas",
      description:
        "Usa estas paginas y guias para mover al lector desde el contenido hacia el flujo real de Nano Banana.",
    },
    blogDetailCta: {
      title: "Continua con el flujo del producto",
      description:
        "Cada articulo debe devolver al lector a una pagina tematica y a la ruta real de la herramienta, no solo a mas articulos.",
      primaryLabel: "Abrir el generador de prompts",
      secondaryLabel: "Ver Nano Banana Video Generator",
    },
    landingTemplate: {
      relatedEyebrow: "Paginas relacionadas",
      relatedTitle: "Sigue explorando el flujo de Nano Banana",
      relatedDescription:
        "Estas paginas de apoyo cubren intenciones cercanas y devuelven trafico a las herramientas del producto.",
      faqTitle: "FAQ",
      faqDescription:
        "Mantén la intencion de la pagina enfocada, responde objeciones clave y muestra el siguiente paso.",
      stepLabel: "Paso",
    },
    guideTemplate: {
      badge: "Guia",
      notesTitle: "Notas practicas",
      relatedEyebrow: "Paginas relacionadas",
      relatedTitle: "Continua hacia la pagina correcta",
      relatedDescription:
        "Las guias deben devolver al usuario a las paginas principales del flujo y a las herramientas reales.",
      stepLabel: "Paso",
    },
  },
};

const itemOverrides: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<Record<InternalLinkId, Partial<InternalLinkItem>>>
> = {
  zh: {
    videoGenerator: {
      title: "Nano Banana Video Generator",
      description: "承接 Nano Banana 视频总词和核心生成意图的主专题页。",
      ctaLabel: "查看主生成页",
    },
    imageToVideo: {
      title: "Nano Banana 图生视频",
      description: "围绕静态图、商品图和场景图转视频的专题页。",
      ctaLabel: "查看图生视频",
    },
    textToVideo: {
      title: "Nano Banana 文生视频",
      description: "围绕提示词驱动的视频生成工作流和转化意图。",
      ctaLabel: "查看文生视频",
    },
    videoFree: {
      title: "Nano Banana 免费试用",
      description: "说明免登录预览和注册后试用 credits 的入口页。",
      ctaLabel: "查看免费入口",
    },
    videoPrompts: {
      title: "Nano Banana 视频提示词",
      description: "提供提示词结构、示例和改写方向的内容页。",
      ctaLabel: "查看提示词示例",
    },
    videoPricingLimits: {
      title: "Nano Banana 定价与限制",
      description: "集中解释 credits、时长、质量和设置限制。",
      ctaLabel: "查看价格与限制",
    },
    videoGenerationTool: {
      title: "视频生成工具",
      description: "进入真实视频生成流程，登录后使用 credits 提交生成。",
      ctaLabel: "打开视频工具",
    },
    promptGeneratorTool: {
      title: "提示词生成器",
      description: "用来整理提示词结构、镜头语言和场景细节的工具。",
      ctaLabel: "打开提示词工具",
    },
    blog: {
      title: "Nano Banana 博客",
      description: "承接资讯、实验、案例和补充内容的博客入口。",
      ctaLabel: "阅读博客",
    },
    guideHowTo: {
      title: "如何用 Nano Banana 做视频",
      description: "从想法到第一条视频的步骤式入门指南。",
      ctaLabel: "阅读指南",
    },
    guideBestPrompts: {
      title: "最佳 Nano Banana 视频提示词",
      description: "整理提示词公式、范例和优化方向的指南页。",
      ctaLabel: "阅读提示词指南",
    },
    guideSettingsLimits: {
      title: "Nano Banana 视频设置与限制",
      description: "帮助理解时长、质量和参数取舍的说明页。",
      ctaLabel: "阅读设置指南",
    },
  },
  ja: {
    videoGenerator: {
      title: "Nano Banana Video Generator",
      description: "Nano Banana の動画生成全体を受け止める中心ページ。",
      ctaLabel: "メインページを見る",
    },
    imageToVideo: {
      title: "Nano Banana 画像から動画",
      description: "静止画像や商品画像から動画へ進む意図向けのページです。",
      ctaLabel: "画像から動画を見る",
    },
    textToVideo: {
      title: "Nano Banana テキストから動画",
      description: "プロンプト主導で動画を作る検索意図を受け止めます。",
      ctaLabel: "テキストから動画を見る",
    },
    videoFree: {
      title: "Nano Banana 無料トライアル",
      description: "ログイン前プレビューと登録後トライアルを説明するページです。",
      ctaLabel: "無料導線を見る",
    },
    videoPrompts: {
      title: "Nano Banana 動画プロンプト",
      description: "プロンプト構造、例、改善の方向をまとめたページです。",
      ctaLabel: "プロンプト例を見る",
    },
    videoPricingLimits: {
      title: "Nano Banana 料金と制限",
      description: "credits、尺、品質、設定制限をまとめて説明します。",
      ctaLabel: "料金と制限を見る",
    },
    videoGenerationTool: {
      title: "動画生成ツール",
      description: "実際の動画生成フローを開き、ログイン後に生成できます。",
      ctaLabel: "動画ツールを開く",
    },
    promptGeneratorTool: {
      title: "プロンプトジェネレーター",
      description: "プロンプト構造やカメラ指示を整理するためのツールです。",
      ctaLabel: "プロンプトツールを開く",
    },
    blog: {
      title: "Nano Banana ブログ",
      description: "更新情報、検証、事例を読むためのブログ入口です。",
      ctaLabel: "ブログを読む",
    },
    guideHowTo: {
      title: "Nano Banana で動画を作る方法",
      description: "アイデアから最初の動画までの実践ガイドです。",
      ctaLabel: "ガイドを読む",
    },
    guideBestPrompts: {
      title: "Nano Banana のおすすめ動画プロンプト",
      description: "プロンプトの型、例、改善方法をまとめたガイドです。",
      ctaLabel: "プロンプトガイドを読む",
    },
    guideSettingsLimits: {
      title: "Nano Banana の設定と制限",
      description: "長さ、品質、設定のトレードオフを理解するページです。",
      ctaLabel: "設定ガイドを読む",
    },
  },
  es: {
    videoGenerator: {
      title: "Nano Banana Video Generator",
      description: "La pagina principal para la intencion general de video con Nano Banana.",
      ctaLabel: "Ver pagina principal",
    },
    imageToVideo: {
      title: "Nano Banana Imagen a Video",
      description: "Pagina enfocada en convertir imagenes fijas y fotos de producto en video.",
      ctaLabel: "Ver imagen a video",
    },
    textToVideo: {
      title: "Nano Banana Texto a Video",
      description: "Pagina enfocada en prompts como punto de partida para crear video.",
      ctaLabel: "Ver texto a video",
    },
    videoFree: {
      title: "Nano Banana Gratis",
      description: "Explica la vista previa sin login y el acceso de prueba tras registrarse.",
      ctaLabel: "Ver acceso gratis",
    },
    videoPrompts: {
      title: "Prompts de Nano Banana Video",
      description: "Pagina con estructuras, ejemplos y mejoras para prompts de video.",
      ctaLabel: "Ver ejemplos de prompts",
    },
    videoPricingLimits: {
      title: "Precios y limites de Nano Banana",
      description: "Explica credits, duracion, calidad y limites de configuracion.",
      ctaLabel: "Ver precios y limites",
    },
    videoGenerationTool: {
      title: "Herramienta de video",
      description: "Abre el flujo real de generacion y genera despues de iniciar sesion.",
      ctaLabel: "Abrir herramienta de video",
    },
    promptGeneratorTool: {
      title: "Generador de prompts",
      description: "Herramienta para ordenar prompts, camara y direccion de escena.",
      ctaLabel: "Abrir generador de prompts",
    },
    blog: {
      title: "Blog de Nano Banana",
      description: "Entrada al blog con novedades, pruebas y contenido de apoyo.",
      ctaLabel: "Leer el blog",
    },
    guideHowTo: {
      title: "Como hacer videos con Nano Banana",
      description: "Guia paso a paso desde la idea hasta el primer video util.",
      ctaLabel: "Leer guia",
    },
    guideBestPrompts: {
      title: "Mejores prompts de Nano Banana",
      description: "Guia con formulas, ejemplos y mejoras para prompts.",
      ctaLabel: "Leer guia de prompts",
    },
    guideSettingsLimits: {
      title: "Ajustes y limites de Nano Banana",
      description: "Explica duracion, calidad y ajustes antes de gastar credits.",
      ctaLabel: "Leer guia de ajustes",
    },
  },
};

const landingPageOverrides: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<Record<LandingPageKey, PageOverride<SeoLandingPageConfig>>>
> = {
  zh: {
    videoGenerator: {
      metaTitle: "Nano Banana Video Generator - 在线创建 AI 视频",
      metaDescription:
        "使用 Nano Banana 通过文生视频和图生视频工作流创建 AI 视频。无需登录即可预览，注册后可用试用 credits 开始生成。",
      title: "Nano Banana Video Generator",
      description:
        "这个页面承接最宽泛的 Nano Banana 视频搜索意图，负责把用户分发到图生视频、文生视频、提示词和价格限制等更具体的页面。",
      badge: "核心工作流页",
      primaryCtaLabel: "试用视频生成器",
      secondaryCtaLabel: "打开提示词生成器",
      highlights: [
        "无需登录即可预览",
        "注册后可免费试用",
        "同时支持提示词和图片驱动工作流",
      ],
      audienceTitle: "这个页面负责什么",
      audienceDescription:
        "保持品牌总词意图清晰，把更窄的搜索问题交给相应的专题页处理。",
      audienceCards: [
        { title: "品牌总词", description: "承接 Nano Banana video、generator、maker 等广义搜索。" },
        { title: "工作流分发", description: "把用户导向图生视频、文生视频、提示词或价格限制页。" },
        { title: "商业转化", description: "把高意图用户直接导向真实工具和辅助说明页。" },
      ],
      workflowTitle: "推荐路径",
      workflowDescription: "把这个页面做成总入口和路由页，而不是承载所有细节的长页。",
      workflowSteps: [
        "先判断你是从文本开始，还是已经有图片素材。",
        "如果提示词不清晰，先去提示词生成器整理镜头、动作和场景语言。",
        "准备好之后进入视频生成工具，在登录并拥有 credits 后提交生成。",
      ],
      faqItems: [
        { question: "什么是 Nano Banana Video Generator？", answer: "它是 Nano Banana 视频能力的总入口，覆盖图生视频、文生视频和相关工作流说明。" },
        { question: "它支持文本和图片两种视频生成吗？", answer: "支持。更细分的场景分别由文生视频页和图生视频页承接。" },
        { question: "可以免费试用吗？", answer: "可以先无登录预览，注册后在有试用 credits 的情况下开始生成。" },
        { question: "如果我不会写提示词，应该先去哪？", answer: "先看提示词页或直接打开提示词生成器，再回到视频工具生成。" },
      ],
    },
    imageToVideo: {
      metaTitle: "Nano Banana 图生视频 - 把图片变成 AI 视频",
      metaDescription:
        "在线使用 Nano Banana 把图片转换为 AI 视频。无需登录即可预览，注册后使用试用 credits、补充动作提示词并开始生成。",
      title: "Nano Banana 图生视频",
      description:
        "这个页面专门承接“从静态图片生成视频”的需求，强调如何保留主体和构图，同时通过动作提示词补充镜头运动。",
      badge: "图片驱动工作流",
      primaryCtaLabel: "开始图生视频",
      secondaryCtaLabel: "查看提示词示例",
      highlights: [
        "适合商品图、人像图和静态场景图",
        "无需登录即可预览流程",
        "先写动作提示词，再消耗 credits",
      ],
      audienceTitle: "最适合的场景",
      audienceDescription: "这个页面只聚焦图片起步的明确意图，不和品牌总词页抢定位。",
      audienceCards: [
        { title: "商品展示", description: "把商品图、详情页图或广告素材图转成短视频。" },
        { title: "视觉叙事", description: "从概念图、角色图或静态镜头出发，补充运动。" },
        { title: "动作提示词辅助", description: "用简洁提示词描述运动、镜头和氛围，而不是重写整张图。" },
      ],
      workflowTitle: "如何做图生视频",
      workflowDescription: "聚焦图片驱动流程，能减少第一次生成失败和动作不足的问题。",
      workflowSteps: [
        "选择主体清晰、构图稳定的原图。",
        "提示词重点写动作和镜头，不要把整张图全部重复描述。",
        "注册后进入视频工具生成，如果动作不够，再精修提示词。",
      ],
      faqItems: [
        { question: "什么样的图片更适合？", answer: "主体清楚、光线稳定、背景不太混乱的图片通常更容易得到稳定结果。" },
        { question: "图生视频一定要写很长的提示词吗？", answer: "不需要。通常只要补充动作、镜头和氛围即可。" },
        { question: "可以先不登录看看流程吗？", answer: "可以。预览无需登录，真实生成在注册后使用可用 credits。" },
        { question: "如果我其实更适合文生视频怎么办？", answer: "直接切换到文生视频页或提示词生成器即可。" },
      ],
    },
    textToVideo: {
      metaTitle: "Nano Banana 文生视频 - 用提示词生成 AI 视频",
      metaDescription:
        "使用 Nano Banana 从文本提示词生成 AI 视频。无需登录即可预览，注册后可使用试用 credits 在线创建视频。",
      title: "Nano Banana 文生视频",
      description:
        "这个页面服务于以提示词为起点的用户，重点不是堆词，而是把场景、动作、镜头和氛围写清楚。",
      badge: "提示词驱动工作流",
      primaryCtaLabel: "开始文生视频",
      secondaryCtaLabel: "先生成提示词",
      highlights: [
        "适合广告、讲解和创意场景",
        "提示词优先的视频工作流",
        "注册后可免费试用",
      ],
      audienceTitle: "这个页面解决什么问题",
      audienceDescription: "页面聚焦提示词质量和执行路径，不去抢图片驱动场景。",
      audienceCards: [
        { title: "更快起稿", description: "把空白想法快速转成可执行的场景提示词。" },
        { title: "提高表达清晰度", description: "把动作、镜头和氛围拆开写，减少模糊输出。" },
        { title: "连接真实工具", description: "看完示例后，直接进入提示词工具或视频工具。" },
      ],
      workflowTitle: "实用的文生视频路径",
      workflowDescription: "让页面既能承接搜索意图，也能把用户快速送到真实工具。",
      workflowSteps: [
        "先用一句话写出场景，再补动作、镜头和氛围。",
        "如果提示词太空泛，先用提示词生成器整理结构。",
        "进入视频工具生成，并根据结果只调整缺失的部分。",
      ],
      faqItems: [
        { question: "Nano Banana 支持文生视频吗？", answer: "支持。这个页面就是承接提示词驱动的视频生成意图。" },
        { question: "提示词要写多详细？", answer: "要足够明确主体、动作、镜头和氛围，但不要堆太多互相冲突的信息。" },
        { question: "我应该先用提示词生成器吗？", answer: "如果你缺少结构或示例，先用提示词生成器通常更稳。" },
        { question: "不登录可以先看看吗？", answer: "可以先预览界面，生成需要注册并拥有可用 credits。" },
      ],
    },
    videoFree: {
      metaTitle: "Nano Banana 免费试用 - 在线 AI 视频生成器",
      metaDescription:
        "在线体验 Nano Banana 视频生成。支持免登录预览，注册后解锁试用 credits，开始从文字和图片生成 AI 视频。",
      title: "Nano Banana 免费试用",
      description:
        "这个页面专门解释“免费”和“在线使用”意图，避免把实际产品行为写错成匿名直接生成。",
      badge: "免费试用意图页",
      primaryCtaLabel: "查看免费流程",
      secondaryCtaLabel: "查看 credits 与限制",
      highlights: [
        "无需登录即可预览",
        "注册后可免费试用",
        "适合 free、online 等高转化搜索词",
      ],
      audienceTitle: "这个页面要回答的问题",
      audienceDescription:
        "免费页的核心是把试用边界讲清楚，让用户建立正确预期。",
      audienceCards: [
        { title: "什么是免费的", description: "说明预览、注册和试用 credits 之间的关系。" },
        { title: "哪些仍有限制", description: "说明 credits、生成次数和付费使用的界限。" },
        { title: "下一步怎么走", description: "把用户导向真实工具或价格限制页。" },
      ],
      workflowTitle: "如何表达免费体验",
      workflowDescription: "这个页面既要服务转化，也不能和当前产品行为冲突。",
      workflowSteps: [
        "先说明可以免登录预览，不必先注册才能理解流程。",
        "再说明注册后会解锁试用 credits 并开始真实生成。",
        "如果用户已经在比较成本和额度，就继续导向价格限制页。",
      ],
      faqItems: [
        { question: "Nano Banana 是免费的吗？", answer: "可以免登录预览，注册后在有试用 credits 时开始免费试用。" },
        { question: "需要安装软件吗？", answer: "不需要，正常路径就是网页访问并在登录后生成。" },
        { question: "哪里看 credits 和限制？", answer: "继续查看定价与限制页，那里更适合集中解释这些问题。" },
        { question: "如果我只想先研究提示词怎么办？", answer: "可以先去提示词页或提示词生成器，再返回视频工具。" },
      ],
    },
    videoPrompts: {
      metaTitle: "Nano Banana 视频提示词 - 最佳 AI 视频 Prompt 示例",
      metaDescription:
        "查看 Nano Banana 视频提示词的最佳结构和示例，覆盖文生视频与图生视频工作流，并帮助你生成更好的视频。",
      title: "Nano Banana 视频提示词",
      description:
        "这个页面和提示词生成器配合使用，负责承接 prompt 搜索意图，并把高意图用户导入真实工具。",
      badge: "提示词教育页",
      primaryCtaLabel: "打开提示词生成器",
      secondaryCtaLabel: "现在生成视频",
      highlights: [
        "承接 prompt 和示例类搜索词",
        "重点导向提示词生成器",
        "同时支持文生视频和图生视频",
      ],
      audienceTitle: "用户在这里需要什么",
      audienceDescription: "提示词页的重点是教会结构，而不是只堆一堆模板。",
      audienceCards: [
        { title: "提示词公式", description: "把主体、动作、镜头、风格和限制按正确顺序组织起来。" },
        { title: "按场景给例子", description: "覆盖商品视频、电影感镜头、创作者内容和图像驱动提示词。" },
        { title: "直接连到工具", description: "看完内容后直接进入提示词工具或视频工具。" },
      ],
      workflowTitle: "一个简单的提示词流程",
      workflowDescription: "搜索提示词的人通常离转化已经很近，关键是减少不确定感。",
      workflowSteps: [
        "先按公式写出场景、动作、镜头和风格。",
        "再通过几个案例决定你更适合文生视频还是图生视频。",
        "最后打开提示词生成器整理输入，并进入视频工具生成。",
      ],
      faqItems: [
        { question: "什么样的提示词更好？", answer: "主体、动作、镜头和氛围足够明确，且没有互相冲突的信息，就是更好的提示词。" },
        { question: "文生视频和图生视频能共用提示词吗？", answer: "可以，但图生视频通常只需要补充动作和镜头，文生视频则要写完整场景。" },
        { question: "有 Nano Banana 提示词生成器吗？", answer: "有，这个页面就是为了把 prompt 搜索流量导向那个工具。" },
        { question: "写好提示词后下一步去哪？", answer: "进入主视频工具，开始真实生成和迭代。" },
      ],
    },
    videoPricingLimits: {
      metaTitle: "Nano Banana 定价与限制 - Credits、时长与画质说明",
      metaDescription:
        "了解 Nano Banana 视频的价格、credits 使用、时长限制、质量选项和生成设置，在开始消耗 credits 前先看清楚。",
      title: "Nano Banana 定价与限制",
      description:
        "这个页面统一承接价格、额度、时长、清晰度和设置相关问题，避免把这些限制信息塞进所有专题页。",
      badge: "支持与决策页",
      primaryCtaLabel: "打开视频工具",
      secondaryCtaLabel: "查看免费入口",
      highlights: [
        "集中承接 pricing、limit、length 等问题词",
        "帮助解释 credits、画质和限制",
        "把限制类内容从主专题页中剥离出来",
      ],
      audienceTitle: "这个页面负责回答什么",
      audienceDescription:
        "落到这里的用户通常已经进入比较和决策阶段，想先弄清成本和边界。",
      audienceCards: [
        { title: "credits 预期", description: "帮助用户在真正生成前先看清 credits 和付费边界。" },
        { title: "输出限制", description: "承接时长、质量和设置影响等问题。" },
        { title: "转化分流", description: "把免费意图继续送到免费页，把执行意图送回视频工具。" },
      ],
      workflowTitle: "如何使用这个页面",
      workflowDescription: "它应该帮助决策，而不是把用户困在研究阶段。",
      workflowSteps: [
        "先看清 credits、时长和质量的大致边界。",
        "如果你更关心试用和入门，继续去免费页。",
        "如果你已经知道边界，就直接回到视频工具开始测试。",
      ],
      faqItems: [
        { question: "在哪里看 Nano Banana 的 credits 使用？", answer: "这个页面就是集中解释价格、限制和设置的入口。" },
        { question: "它会替代免费页吗？", answer: "不会。免费页讲的是上手路径，这个页讲的是限制和成本。" },
        { question: "用户应该从这里开始，还是先看主生成页？", answer: "通用产品意图应该先看主生成页；比较成本和限制的人更适合直接落在这里。" },
        { question: "看完这里之后的下一步是什么？", answer: "去免费页，或者直接进入视频工具开始测试。" },
      ],
    },
  },
  ja: {
    videoGenerator: {
      metaTitle: "Nano Banana Video Generator - AI動画をオンラインで作成",
      metaDescription:
        "Nano Banana でテキストから動画、画像から動画のAIワークフローを使って動画を作成。ログイン前にプレビューでき、登録後にトライアルcreditsで生成を開始できます。",
      title: "Nano Banana Video Generator",
      description:
        "このページは Nano Banana の動画に関する最も広い検索意図を受け止め、画像から動画、テキストから動画、プロンプト、料金・制限ページへ振り分けます。",
      badge: "コアワークフローページ",
      primaryCtaLabel: "動画ジェネレーターを試す",
      secondaryCtaLabel: "プロンプトジェネレーターを開く",
      highlights: [
        "ログイン前にプレビュー可能",
        "登録後に無料トライアル",
        "プロンプト主導と画像主導の両方に対応",
      ],
      audienceTitle: "このページの役割",
      audienceDescription:
        "ブランド全体の意図を受け止めつつ、より狭い検索意図は各専用ページに渡します。",
      audienceCards: [
        { title: "ブランド全体の意図", description: "Nano Banana video、generator、maker などの広い検索を受け止めます。" },
        { title: "ワークフローの振り分け", description: "画像から動画、テキストから動画、プロンプト、料金制限へ案内します。" },
        { title: "商用転換", description: "高意図ユーザーを実際のツールへ直接送ります。" },
      ],
      workflowTitle: "おすすめの流れ",
      workflowDescription:
        "このページは総合入口として機能し、すべての細部を抱え込まない構成が適しています。",
      workflowSteps: [
        "まず、出発点がテキストか画像かを決めます。",
        "プロンプトが曖昧なら、先にプロンプトジェネレーターでカメラ、動き、シーンを整理します。",
        "準備ができたら動画ツールに進み、ログイン後に生成を開始します。",
      ],
      faqItems: [
        { question: "Nano Banana Video Generator とは何ですか？", answer: "Nano Banana の動画機能全体を案内する中心ページで、画像から動画、テキストから動画、関連ワークフローをまとめます。" },
        { question: "テキストと画像の両方から動画を作れますか？", answer: "はい。詳細な意図は各専用ページで分けて受け止めます。" },
        { question: "無料で試せますか？", answer: "ログイン前にプレビューでき、登録後に利用可能なトライアルcreditsで生成できます。" },
        { question: "プロンプト作成に自信がない場合は？", answer: "プロンプトページかプロンプトジェネレーターを先に使うのが最も自然です。" },
      ],
    },
    imageToVideo: {
      metaTitle: "Nano Banana 画像から動画 - 画像をAI動画に変換",
      metaDescription:
        "Nano Banana で画像をAI動画に変換。ログイン前にフローを確認でき、登録後にトライアルcreditsとモーション指示で生成を開始できます。",
      title: "Nano Banana 画像から動画",
      description:
        "静止画像を出発点にしたいユーザー向けのページで、構図や被写体を保ちながらモーションを加える方法に集中します。",
      badge: "画像主導のワークフロー",
      primaryCtaLabel: "画像から動画を始める",
      secondaryCtaLabel: "プロンプト例を見る",
      highlights: [
        "商品画像、人物写真、静止シーンに向く",
        "ログイン前にフロー確認可能",
        "まずモーション指示を書いてからcreditsを使う",
      ],
      audienceTitle: "向いている利用シーン",
      audienceDescription:
        "このページは画像起点の明確な意図に絞り、ブランド総合ページとは役割を分けます。",
      audienceCards: [
        { title: "商品紹介", description: "商品画像や販促素材を短い動画に変えたいケースです。" },
        { title: "ビジュアル演出", description: "コンセプトアートや静止シーンにカメラや動きを足したいケースです。" },
        { title: "短いモーション指示", description: "シーン全体ではなく、動きとカメラだけを補足します。" },
      ],
      workflowTitle: "画像から動画の進め方",
      workflowDescription:
        "画像起点の流れに集中すると、最初の失敗生成を減らしやすくなります。",
      workflowSteps: [
        "被写体が明確で、構図が安定した画像を選びます。",
        "プロンプトでは動きとカメラだけを追加し、画像全体を繰り返して説明しません。",
        "登録後に動画ツールで生成し、動きが弱ければプロンプトを絞って調整します。",
      ],
      faqItems: [
        { question: "どんな画像が向いていますか？", answer: "主題がはっきりし、背景が過度に複雑でない画像ほど安定しやすいです。" },
        { question: "長いプロンプトは必要ですか？", answer: "通常は不要です。動き、カメラ、雰囲気を足す程度で十分なことが多いです。" },
        { question: "ログイン前に確認できますか？", answer: "はい。プレビューは可能で、生成は登録後に始められます。" },
        { question: "実はテキスト起点の方が合う場合は？", answer: "その場合はテキストから動画ページかプロンプトジェネレーターへ進んでください。" },
      ],
    },
    textToVideo: {
      metaTitle: "Nano Banana テキストから動画 - プロンプトからAI動画を生成",
      metaDescription:
        "Nano Banana でテキストプロンプトからAI動画を生成。ログイン前にプレビューでき、登録後にトライアルcreditsでオンライン生成できます。",
      title: "Nano Banana テキストから動画",
      description:
        "プロンプトを起点に動画を作りたいユーザー向けのページで、シーン、動き、カメラ、雰囲気をどう整理するかに集中します。",
      badge: "プロンプト主導のワークフロー",
      primaryCtaLabel: "テキストから動画を始める",
      secondaryCtaLabel: "まずプロンプトを作る",
      highlights: [
        "広告、解説、演出シーンに向く",
        "プロンプト優先の動画フロー",
        "登録後に無料トライアル可能",
      ],
      audienceTitle: "このページが解決すること",
      audienceDescription:
        "画像起点ではなく、言葉から動画へ進むユーザーの意図を深く受け止めます。",
      audienceCards: [
        { title: "下書きを速くする", description: "何もない状態から、実行可能なシーン記述に変えます。" },
        { title: "表現を明確にする", description: "動きやカメラを分離して書くことで出力のブレを減らします。" },
        { title: "実際のツールへ接続", description: "例を見たあと、プロンプトツールや動画ツールへ進めます。" },
      ],
      workflowTitle: "実用的なテキストから動画の流れ",
      workflowDescription:
        "検索意図の受け皿でありつつ、実際の生成行動にすぐつなげる構成にします。",
      workflowSteps: [
        "まず一文でシーンを書き、次に動き、カメラ、雰囲気を足します。",
        "曖昧ならプロンプトジェネレーターで整理します。",
        "動画ツールで生成し、欠けている要素だけを直します。",
      ],
      faqItems: [
        { question: "Nano Banana はテキストから動画を作れますか？", answer: "はい。このページはその検索意図専用です。" },
        { question: "どれくらい詳細に書くべきですか？", answer: "被写体、動き、カメラ、雰囲気が明確になる程度で十分です。" },
        { question: "先にプロンプトジェネレーターを使うべきですか？", answer: "構造が曖昧なら先に使う方が安定します。" },
        { question: "ログイン前に何ができますか？", answer: "プレビューは可能で、生成は登録後に開始します。" },
      ],
    },
    videoFree: {
      metaTitle: "Nano Banana 無料トライアル - オンラインAI動画ジェネレーター",
      metaDescription:
        "Nano Banana の動画生成をオンラインで体験。ログイン前プレビューに対応し、登録後にトライアルcreditsでテキストと画像から動画を作成できます。",
      title: "Nano Banana 無料トライアル",
      description:
        "無料やオンライン利用の意図を受け止めるページで、匿名で即生成できるかのような誤解を避けながら導線を説明します。",
      badge: "無料意図ページ",
      primaryCtaLabel: "無料フローを見る",
      secondaryCtaLabel: "credits と制限を見る",
      highlights: [
        "ログイン前にプレビュー可能",
        "登録後に無料トライアル",
        "free や online 系検索語に対応",
      ],
      audienceTitle: "このページで答えるべきこと",
      audienceDescription:
        "無料ページの役割は、実際の利用条件を正確に伝え、期待値のズレを防ぐことです。",
      audienceCards: [
        { title: "何が無料か", description: "プレビュー、登録、トライアルcredits の関係を説明します。" },
        { title: "何に制限があるか", description: "credits や生成量、課金境界を整理します。" },
        { title: "次の導線", description: "ユーザーを動画ツールまたは制限ページへ送ります。" },
      ],
      workflowTitle: "無料体験の伝え方",
      workflowDescription:
        "このページは転換を助けつつ、現在の製品挙動とも矛盾しないことが重要です。",
      workflowSteps: [
        "まずログイン前にプレビューできることを示します。",
        "次に、登録後にトライアルcreditsで実際の生成が始まることを説明します。",
        "コストや制限が気になるユーザーは、制限ページに送ります。",
      ],
      faqItems: [
        { question: "Nano Banana は無料ですか？", answer: "プレビューはログイン前に可能で、登録後にトライアルcreditsで試せます。" },
        { question: "アプリのインストールは必要ですか？", answer: "不要です。通常はブラウザから利用します。" },
        { question: "credits や制限はどこで確認できますか？", answer: "料金と制限ページでまとめて確認できます。" },
        { question: "まずプロンプトだけ考えたい場合は？", answer: "プロンプトページまたはプロンプトジェネレーターを先に使ってください。" },
      ],
    },
    videoPrompts: {
      metaTitle: "Nano Banana 動画プロンプト - AI動画のための最適な例",
      metaDescription:
        "Nano Banana の動画プロンプト構造と例を確認し、テキストから動画と画像から動画の両方でより良い結果を目指します。",
      title: "Nano Banana 動画プロンプト",
      description:
        "このページはプロンプト検索意図を受け止め、最も近い次の行動としてプロンプトジェネレーターへ送る役割を持ちます。",
      badge: "プロンプト教育ページ",
      primaryCtaLabel: "プロンプトジェネレーターを開く",
      secondaryCtaLabel: "今すぐ動画を生成する",
      highlights: [
        "prompt と examples の検索意図を受け止める",
        "プロンプトジェネレーターへの導線が強い",
        "テキストから動画と画像から動画の両方を支援",
      ],
      audienceTitle: "このページで必要なもの",
      audienceDescription:
        "プロンプトページは型を教え、次に使うべきツールを明確にするのが役割です。",
      audienceCards: [
        { title: "プロンプトの型", description: "被写体、動き、カメラ、スタイル、制約を整理します。" },
        { title: "用途別の例", description: "商品動画、映画風シーン、クリエイター向け、画像誘導型の例を扱います。" },
        { title: "ツールへの接続", description: "見たあとすぐにプロンプトツールや動画ツールへ進めます。" },
      ],
      workflowTitle: "シンプルなプロンプト作成フロー",
      workflowDescription:
        "プロンプト検索のユーザーは転換に近いため、不確実性を減らすことが重要です。",
      workflowSteps: [
        "まず、シーン、動き、カメラ、スタイルを型に沿って整理します。",
        "次に、テキスト起点か画像起点かを例を見て決めます。",
        "その後、プロンプトジェネレーターで整理し、動画ツールで生成します。",
      ],
      faqItems: [
        { question: "良いプロンプトとは何ですか？", answer: "被写体、動き、カメラ、雰囲気が明確で、矛盾が少ないプロンプトです。" },
        { question: "同じプロンプトを両方のワークフローで使えますか？", answer: "使えますが、画像から動画では動きとカメラ中心、テキストから動画ではシーン全体も必要です。" },
        { question: "Nano Banana にプロンプトジェネレーターはありますか？", answer: "あります。このページはそのツールへ流すための受け皿です。" },
        { question: "プロンプトを作ったあと、次は？", answer: "主動画ツールへ進んで生成を開始します。" },
      ],
    },
    videoPricingLimits: {
      metaTitle: "Nano Banana 料金と制限 - Credits、長さ、品質",
      metaDescription:
        "Nano Banana 動画の価格、credits 利用、長さ制限、品質設定を確認し、生成前に必要な前提を把握します。",
      title: "Nano Banana 料金と制限",
      description:
        "価格、credits、長さ、解像度、設定に関する質問を一か所で受け止めるためのページです。",
      badge: "支援と比較のページ",
      primaryCtaLabel: "動画ツールを開く",
      secondaryCtaLabel: "無料導線を見る",
      highlights: [
        "pricing、limit、length 系検索意図に対応",
        "credits、品質、設定の説明を集約",
        "制約の話を主ページから切り分ける",
      ],
      audienceTitle: "このページが答えること",
      audienceDescription:
        "ここに来るユーザーは、すでに比較や判断段階に入っていることが多いです。",
      audienceCards: [
        { title: "credits の期待値", description: "生成前にコスト感と境界を把握します。" },
        { title: "出力制限", description: "長さ、品質、設定の影響に関する疑問を受け止めます。" },
        { title: "転換分岐", description: "無料意図は無料ページへ、実行意図は動画ツールへ戻します。" },
      ],
      workflowTitle: "このページの使い方",
      workflowDescription:
        "研究のためだけで終わらず、次の行動を決めるためのページとして使います。",
      workflowSteps: [
        "まず credits、長さ、品質の大まかな制約を確認します。",
        "無料トライアルが気になる場合は無料ページへ進みます。",
        "前提が理解できたら、動画ツールへ戻ってテストします。",
      ],
      faqItems: [
        { question: "credits の使い方はどこで確認できますか？", answer: "このページが価格、制限、設定をまとめて扱う入口です。" },
        { question: "無料ページの代わりになりますか？", answer: "なりません。無料ページは導入、こちらは制限とコストが中心です。" },
        { question: "最初に見るべきはここですか？", answer: "一般的な製品意図なら主生成ページ、制限比較ならこのページが向いています。" },
        { question: "読んだ後はどうすべきですか？", answer: "無料ページを見るか、動画ツールに戻って実際に試します。" },
      ],
    },
  },
  es: {
    videoGenerator: {
      metaTitle: "Nano Banana Video Generator - Crea videos con IA online",
      metaDescription:
        "Crea videos con IA con Nano Banana usando flujos de texto a video e imagen a video. Puedes previsualizar sin login y generar despues de registrarte con credits de prueba.",
      title: "Nano Banana Video Generator",
      description:
        "Esta pagina captura la intencion mas amplia sobre Nano Banana video y distribuye al usuario hacia imagen a video, texto a video, prompts y precios o limites.",
      badge: "Pagina central del flujo",
      primaryCtaLabel: "Probar el generador de video",
      secondaryCtaLabel: "Abrir el generador de prompts",
      highlights: [
        "Previsualizacion sin login",
        "Prueba gratis despues del registro",
        "Compatible con flujos guiados por prompts e imagenes",
      ],
      audienceTitle: "Que cubre esta pagina",
      audienceDescription:
        "Mantiene clara la intencion general de marca y deja las dudas mas especificas para paginas tematicas.",
      audienceCards: [
        { title: "Intencion de marca", description: "Captura busquedas amplias como Nano Banana video, generator o maker." },
        { title: "Distribucion del flujo", description: "Lleva al usuario a imagen a video, texto a video, prompts o limites." },
        { title: "Conversion comercial", description: "Empuja a usuarios de alta intencion hacia las herramientas reales." },
      ],
      workflowTitle: "Flujo recomendado",
      workflowDescription:
        "Esta pagina funciona mejor como hub y distribuidor, no como una pagina que intente explicarlo todo.",
      workflowSteps: [
        "Primero decide si empiezas desde texto o desde una imagen.",
        "Si el prompt aun es debil, usa antes el generador de prompts para ordenar camara, movimiento y escena.",
        "Despues entra en la herramienta de video y genera tras iniciar sesion.",
      ],
      faqItems: [
        { question: "Que es Nano Banana Video Generator?", answer: "Es la pagina central que resume el flujo de video de Nano Banana y conecta con las rutas especializadas." },
        { question: "Permite crear videos desde texto e imagenes?", answer: "Si. Las intenciones mas especificas se desarrollan en sus paginas correspondientes." },
        { question: "Se puede probar gratis?", answer: "Puedes ver el flujo sin login y generar tras registrarte cuando tengas credits disponibles." },
        { question: "Que hago si no se escribir prompts?", answer: "Empieza por la pagina de prompts o por el generador de prompts y luego vuelve al flujo principal." },
      ],
    },
    imageToVideo: {
      metaTitle: "Nano Banana Imagen a Video - Convierte imagenes en video con IA",
      metaDescription:
        "Convierte imagenes en videos con IA usando Nano Banana. Revisa el flujo sin login y genera despues de registrarte con credits de prueba.",
      title: "Nano Banana Imagen a Video",
      description:
        "Esta pagina sirve para usuarios que ya tienen una imagen y quieren conservar sujeto y composicion mientras añaden movimiento.",
      badge: "Flujo guiado por imagen",
      primaryCtaLabel: "Empezar imagen a video",
      secondaryCtaLabel: "Ver ejemplos de prompts",
      highlights: [
        "Ideal para fotos de producto, retratos y escenas fijas",
        "Previsualizacion disponible sin login",
        "Primero define movimiento, luego usa credits",
      ],
      audienceTitle: "Casos mas adecuados",
      audienceDescription:
        "La pagina se centra en una intencion muy clara: empezar desde una imagen, no desde un prompt vacio.",
      audienceCards: [
        { title: "Producto", description: "Convertir imagenes de ecommerce o anuncios en clips de video." },
        { title: "Narrativa visual", description: "Partir de arte conceptual, personajes o escenas fijas y añadir movimiento." },
        { title: "Prompt de movimiento", description: "Usar un prompt corto para definir movimiento, camara y ambiente." },
      ],
      workflowTitle: "Como abordar imagen a video",
      workflowDescription:
        "Un flujo enfocado reduce fallos y hace que la primera generacion sea mas util.",
      workflowSteps: [
        "Elige una imagen con sujeto claro y composicion estable.",
        "Describe solo movimiento y camara; no reescribas toda la escena.",
        "Genera en la herramienta de video despues del registro y ajusta el prompt si el movimiento sale demasiado amplio.",
      ],
      faqItems: [
        { question: "Que imagenes funcionan mejor?", answer: "Sujeto claro, buena luz y composicion simple suelen dar resultados mas estables." },
        { question: "Necesito un prompt largo?", answer: "No normalmente. Empieza con movimiento, camara y tono." },
        { question: "Puedo revisar el flujo sin login?", answer: "Si. La vista previa esta abierta y la generacion empieza tras registrarte." },
        { question: "Y si en realidad necesito texto a video?", answer: "Entonces cambia a la pagina de texto a video o al generador de prompts." },
      ],
    },
    textToVideo: {
      metaTitle: "Nano Banana Texto a Video - Genera videos con IA desde prompts",
      metaDescription:
        "Genera videos con IA desde prompts usando Nano Banana. Previsualiza sin login y genera online despues de registrarte con credits de prueba.",
      title: "Nano Banana Texto a Video",
      description:
        "Esta pagina sirve a usuarios que quieren partir de una idea escrita y transformarla en una escena con movimiento, camara y tono mas claros.",
      badge: "Flujo guiado por prompts",
      primaryCtaLabel: "Empezar texto a video",
      secondaryCtaLabel: "Crear un mejor prompt",
      highlights: [
        "Util para anuncios, explicaciones y escenas creativas",
        "Flujo centrado en prompts",
        "Prueba gratis despues del registro",
      ],
      audienceTitle: "Que resuelve esta pagina",
      audienceDescription:
        "Se centra en la calidad del prompt y en el paso siguiente, sin competir con la pagina de imagen a video.",
      audienceCards: [
        { title: "Borrador rapido", description: "Convierte una idea vacia en una escena accionable." },
        { title: "Mas claridad", description: "Separa accion, camara y tono para reducir ambiguedad." },
        { title: "Puente a la herramienta", description: "Lleva a ejemplos, al generador de prompts y al flujo real de video." },
      ],
      workflowTitle: "Flujo practico de texto a video",
      workflowDescription:
        "Debe servir como pagina de SEO y como puerta rapida hacia la herramienta real.",
      workflowSteps: [
        "Escribe la escena en una frase y añade movimiento, camara y ambiente por separado.",
        "Usa el generador de prompts si tu prompt sigue demasiado vago.",
        "Genera en la herramienta principal y ajusta solo lo que falte.",
      ],
      faqItems: [
        { question: "Nano Banana permite texto a video?", answer: "Si. Esta pagina esta dedicada a esa intencion de busqueda." },
        { question: "Cuanto detalle necesita el prompt?", answer: "Lo suficiente para aclarar sujeto, accion, camara y tono, sin crear contradicciones." },
        { question: "Debo usar primero el generador de prompts?", answer: "Si te falta estructura o ejemplos, suele ser la mejor opcion." },
        { question: "Que puedo hacer sin login?", answer: "Puedes revisar la interfaz; la generacion empieza despues del registro." },
      ],
    },
    videoFree: {
      metaTitle: "Nano Banana Gratis - Generador de video con IA online",
      metaDescription:
        "Prueba la generacion de video de Nano Banana online. Hay vista previa sin login y credits de prueba despues del registro.",
      title: "Nano Banana Gratis",
      description:
        "Esta pagina explica la entrada gratuita y online sin prometer generacion anonima ilimitada, que no coincide con el producto real.",
      badge: "Pagina de intencion gratis",
      primaryCtaLabel: "Ver el flujo gratis",
      secondaryCtaLabel: "Ver credits y limites",
      highlights: [
        "Vista previa sin login",
        "Prueba gratis tras el registro",
        "Pensada para consultas free y online",
      ],
      audienceTitle: "Que debe responder esta pagina",
      audienceDescription:
        "La prioridad es dejar claro el limite entre previsualizacion, registro y uso real de credits.",
      audienceCards: [
        { title: "Que es gratis", description: "Explica la relacion entre preview, registro y credits de prueba." },
        { title: "Que sigue limitado", description: "Aclara volumen, credits y cuando empieza el uso de pago." },
        { title: "Siguiente paso", description: "Envia al usuario a la herramienta real o a la pagina de limites." },
      ],
      workflowTitle: "Como posicionar la experiencia gratis",
      workflowDescription:
        "Debe ayudar a convertir sin generar expectativas incorrectas.",
      workflowSteps: [
        "Explica primero que el flujo se puede ver sin login.",
        "Aclara despues que el registro desbloquea el uso de credits de prueba y la generacion real.",
        "Si el usuario compara costes o volumen, envialo a la pagina de precios y limites.",
      ],
      faqItems: [
        { question: "Nano Banana es gratis?", answer: "Puedes ver el flujo sin login y probar la generacion tras registrarte cuando haya credits disponibles." },
        { question: "Necesito instalar algo?", answer: "No. El uso normal es desde el navegador." },
        { question: "Donde veo los credits y limites?", answer: "En la pagina de precios y limites, que centraliza esas dudas." },
        { question: "Y si primero solo quiero trabajar el prompt?", answer: "Empieza por la pagina de prompts o por el generador de prompts." },
      ],
    },
    videoPrompts: {
      metaTitle: "Prompts de Nano Banana Video - Mejores ejemplos para video con IA",
      metaDescription:
        "Explora estructuras y ejemplos de prompts para Nano Banana Video, tanto para texto a video como para imagen a video.",
      title: "Prompts de Nano Banana Video",
      description:
        "Esta pagina trabaja junto al generador de prompts y captura la intencion de busqueda sobre prompts para llevarla a la herramienta real.",
      badge: "Pagina educativa de prompts",
      primaryCtaLabel: "Abrir el generador de prompts",
      secondaryCtaLabel: "Generar un video ahora",
      highlights: [
        "Captura consultas sobre prompts y ejemplos",
        "Empuja con fuerza hacia el generador de prompts",
        "Sirve para texto a video e imagen a video",
      ],
      audienceTitle: "Que necesita el usuario aqui",
      audienceDescription:
        "Una buena pagina de prompts enseña estructura y deja claro el siguiente paso hacia la herramienta.",
      audienceCards: [
        { title: "Formula del prompt", description: "Ordena sujeto, accion, camara, estilo y restricciones." },
        { title: "Ejemplos por uso", description: "Incluye producto, escena cinematografica, contenido creator e imagen guiada." },
        { title: "Acceso directo a la herramienta", description: "Lleva al usuario al generador de prompts o a la herramienta de video." },
      ],
      workflowTitle: "Un flujo simple para prompts",
      workflowDescription:
        "Los usuarios que buscan prompts suelen estar cerca de convertir si se reduce la incertidumbre.",
      workflowSteps: [
        "Empieza con una formula clara para escena, accion, camara y estilo.",
        "Usa ejemplos para decidir si tu flujo es texto a video o imagen a video.",
        "Abre el generador de prompts y luego continua en la herramienta de video.",
      ],
      faqItems: [
        { question: "Que hace que un prompt sea bueno?", answer: "Que aclare sujeto, movimiento, camara y tono sin meter ideas que se contradigan." },
        { question: "Sirve el mismo prompt para ambos flujos?", answer: "Puede servir, pero imagen a video suele necesitar solo movimiento y camara." },
        { question: "Existe un generador de prompts para Nano Banana?", answer: "Si. Esta pagina existe para enviar trafico hacia esa herramienta." },
        { question: "Cual es el siguiente paso despues del prompt?", answer: "Entrar en la herramienta principal de video y generar." },
      ],
    },
    videoPricingLimits: {
      metaTitle: "Precios y limites de Nano Banana - Credits, duracion y calidad",
      metaDescription:
        "Revisa precios, uso de credits, limites de duracion y opciones de calidad de Nano Banana antes de empezar a generar.",
      title: "Precios y limites de Nano Banana",
      description:
        "Esta pagina concentra las preguntas sobre precio, credits, duracion, resolucion y configuracion para no mezclar ese contenido con todas las landing pages.",
      badge: "Pagina de soporte y decision",
      primaryCtaLabel: "Abrir la herramienta de video",
      secondaryCtaLabel: "Ver el acceso gratis",
      highlights: [
        "Captura consultas de pricing, limit y length",
        "Explica credits, calidad y configuracion",
        "Saca el contenido de restricciones fuera de las landings principales",
      ],
      audienceTitle: "Que responde esta pagina",
      audienceDescription:
        "Quien llega aqui suele estar comparando coste, limites o viabilidad antes de generar.",
      audienceCards: [
        { title: "Expectativa de credits", description: "Ayuda a entender costes y limites antes de gastar." },
        { title: "Restricciones de salida", description: "Responde dudas sobre duracion, calidad y ajustes." },
        { title: "Distribucion de conversion", description: "Mueve la intencion gratis a la pagina gratis y la intencion de accion a la herramienta." },
      ],
      workflowTitle: "Como usar esta pagina",
      workflowDescription:
        "Debe ayudar a decidir y luego devolver al usuario al flujo, no dejarlo atrapado en investigacion.",
      workflowSteps: [
        "Revisa primero credits, duracion y calidad esperada.",
        "Si la duda principal es la prueba gratuita, ve a la pagina gratis.",
        "Si ya entiendes los limites, vuelve a la herramienta de video y prueba.",
      ],
      faqItems: [
        { question: "Donde se ve el uso de credits?", answer: "Esta pagina es el punto central para precios, limites y ajustes." },
        { question: "Sustituye a la pagina gratis?", answer: "No. La pagina gratis explica acceso y onboarding; esta explica restricciones y costes." },
        { question: "Debo empezar aqui o en la landing principal?", answer: "Si tu busqueda es general, empieza en la landing principal. Si comparas limites, empieza aqui." },
        { question: "Cual es el siguiente paso despues de leerla?", answer: "Ir a la pagina gratis o volver a la herramienta de video para probar." },
      ],
    },
  },
};

const guidePageOverrides: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<Record<GuidePageKey, PageOverride<GuidePageConfig>>>
> = {
  zh: {
    guideHowTo: {
      metaTitle: "如何用 Nano Banana 做视频 - 分步指南",
      metaDescription:
        "一个实用的 Nano Banana 视频制作指南，从选择工作流到完成第一条可用视频。",
      title: "如何用 Nano Banana 做视频",
      description:
        "当用户不想在多个页面之间来回跳转时，这个指南负责给出从想法到第一条视频的最短路径。",
      intro:
        "先从最简单的流程开始，只有在需要更具体帮助时，再分流到图生视频、文生视频或提示词页面。",
      steps: [
        { title: "先选起点", description: "如果你已经有图，就走图生视频；如果只有想法，就先走文生视频或提示词生成器。" },
        { title: "按结构整理提示词", description: "把主体、动作、镜头和氛围拆开写，这样更容易在第一轮结果后调整。" },
        { title: "生成并迭代", description: "注册后进入视频工具，根据结果只改缺失的部分，不要每次都全部重写。" },
      ],
      tips: [
        "第一轮生成尽量保持目标单一。",
        "不要一次写太多镜头运动。",
        "提示词太空时，先用提示词生成器。",
      ],
      primaryCtaLabel: "打开视频工具",
      secondaryCtaLabel: "回到主工作流页",
    },
    guideBestPrompts: {
      metaTitle: "最佳 Nano Banana 视频提示词 - 公式与示例",
      metaDescription:
        "学习更好的 Nano Banana 视频提示词结构和案例，适用于文生视频与图生视频。",
      title: "最佳 Nano Banana 视频提示词",
      description:
        "这个指南帮助用户在消耗 credits 之前，把提示词先整理成更稳定、可执行的结构。",
      intro:
        "目标不是把提示词写得更长，而是让结构更清楚、冲突更少、动作表达更稳定。",
      steps: [
        { title: "先用一句话定义场景", description: "先明确主体和时刻，再补充技术细节。" },
        { title: "把动作和镜头分开写", description: "主体运动和镜头运动分开描述，通常更稳定。" },
        { title: "根据结果微调", description: "如果场景对了但镜头不对，就只改镜头语言。" },
      ],
      tips: [
        "短而清楚的提示词通常比冗长提示词更有效。",
        "一次只给一种风格方向。",
        "把示例当结构，不要机械照抄。",
      ],
      primaryCtaLabel: "使用提示词生成器",
      secondaryCtaLabel: "回到提示词专题页",
    },
    guideSettingsLimits: {
      metaTitle: "Nano Banana 视频设置与限制 - 实用说明",
      metaDescription:
        "开始生成前，先理解 Nano Banana 视频的设置、质量取舍和限制。",
      title: "Nano Banana 视频设置与限制",
      description:
        "这个指南适合已经接近生成阶段的用户，帮助他们减少对质量、额度和可行性的误判。",
      intro:
        "设置说明的目标不是让用户陷入研究，而是减少无效测试和 credits 浪费。",
      steps: [
        { title: "先定义目标", description: "明确你更在意速度、画质、广告产出还是社媒短视频。" },
        { title: "先看限制", description: "在大量测试前先了解 credits 和输出边界。" },
        { title: "一次只改一个变量", description: "这样你才能知道变化是由设置还是提示词带来的。" },
      ],
      tips: [
        "研究模式应该最终指向工具操作。",
        "记录哪些提示词和设置真的提高了结果。",
        "入门问题看免费页，限制问题看价格页。",
      ],
      primaryCtaLabel: "打开视频工具",
      secondaryCtaLabel: "回到定价与限制页",
    },
  },
  ja: {
    guideHowTo: {
      metaTitle: "Nano Banana で動画を作る方法 - ステップガイド",
      metaDescription:
        "ワークフローの選択から最初の使える動画までを説明する Nano Banana の実用ガイドです。",
      title: "Nano Banana で動画を作る方法",
      description:
        "複数のページを行き来せず、アイデアから最初の動画までの最短ルートを知りたい人向けです。",
      intro:
        "まず最も単純な流れから始め、必要に応じて画像から動画、テキストから動画、プロンプトページへ分岐します。",
      steps: [
        { title: "出発点を決める", description: "画像があるなら画像から動画、アイデアだけならテキストから動画かプロンプトジェネレーターを使います。" },
        { title: "プロンプトを構造化する", description: "被写体、動き、カメラ、雰囲気を分けて書くと後の調整が楽になります。" },
        { title: "生成して調整する", description: "登録後に動画ツールで生成し、足りない部分だけを修正します。" },
      ],
      tips: [
        "最初の生成は目的を絞る。",
        "一度に多くのカメラ動作を書かない。",
        "曖昧なら先にプロンプトジェネレーターを使う。",
      ],
      primaryCtaLabel: "動画ツールを開く",
      secondaryCtaLabel: "メインワークフローページに戻る",
    },
    guideBestPrompts: {
      metaTitle: "Nano Banana のおすすめ動画プロンプト - 型と例",
      metaDescription:
        "テキストから動画と画像から動画の両方に使える Nano Banana プロンプトの構造と例を学びます。",
      title: "Nano Banana のおすすめ動画プロンプト",
      description:
        "credits を使う前に、より安定したプロンプト構造へ整えたいユーザー向けのガイドです。",
      intro:
        "重要なのは長さではなく、構造が明確で、矛盾が少なく、動きの指示が整理されていることです。",
      steps: [
        { title: "一文でシーンを書く", description: "まず誰が何をしているかを決めてから、技術的な補足を加えます。" },
        { title: "動きとカメラを分ける", description: "被写体の動きとカメラの動きを分離すると安定しやすくなります。" },
        { title: "結果を見て微調整する", description: "場面が合っていてフレーミングだけ違うなら、カメラ表現だけを修正します。" },
      ],
      tips: [
        "長いよりも明確なプロンプトが有効です。",
        "スタイル指示は一度に一つに絞る。",
        "例はそのままコピーせず、構造として使う。",
      ],
      primaryCtaLabel: "プロンプトジェネレーターを使う",
      secondaryCtaLabel: "プロンプトページに戻る",
    },
    guideSettingsLimits: {
      metaTitle: "Nano Banana の設定と制限 - 実用ガイド",
      metaDescription:
        "生成前に Nano Banana の設定、品質のトレードオフ、制限を理解するための実用ガイドです。",
      title: "Nano Banana の設定と制限",
      description:
        "生成直前のユーザーが品質、credits、実現可能性の認識ズレを減らすためのガイドです。",
      intro:
        "設定ガイドの目的は研究を増やすことではなく、無駄な試行とcredits消費を減らすことです。",
      steps: [
        { title: "出力目的を決める", description: "速度、品質、広告用、SNS用など、何を優先するかを先に決めます。" },
        { title: "制限を先に確認する", description: "多くのパターンを試す前に、credits と出力の境界を把握します。" },
        { title: "一度に一変数だけ変える", description: "変化の原因が設定かプロンプトか分かるようにします。" },
      ],
      tips: [
        "調査は最終的にツール操作につなげる。",
        "改善した設定とプロンプトを記録する。",
        "導入は無料ページ、制限は料金ページを見る。",
      ],
      primaryCtaLabel: "動画ツールを開く",
      secondaryCtaLabel: "料金と制限ページに戻る",
    },
  },
  es: {
    guideHowTo: {
      metaTitle: "Como hacer videos con Nano Banana - Guia paso a paso",
      metaDescription:
        "Guia practica para hacer videos con Nano Banana, desde elegir el flujo correcto hasta obtener el primer resultado util.",
      title: "Como hacer videos con Nano Banana",
      description:
        "Esta guia sirve a usuarios que quieren una ruta corta desde la idea inicial hasta el primer video, sin saltar entre demasiadas paginas.",
      intro:
        "Empieza con el flujo mas simple y solo despues deriva hacia imagen a video, texto a video o prompts si necesitas mas detalle.",
      steps: [
        { title: "Elegir el punto de partida", description: "Si ya tienes una imagen, usa imagen a video. Si solo tienes la idea, empieza por texto a video o por el generador de prompts." },
        { title: "Ordenar el prompt", description: "Separa sujeto, accion, camara y ambiente para que luego sea mas facil ajustar." },
        { title: "Generar y refinar", description: "Despues de registrarte, genera en la herramienta de video y corrige solo lo que falte." },
      ],
      tips: [
        "Haz que la primera generacion tenga un objetivo simple.",
        "No mezcles demasiados movimientos de camara al mismo tiempo.",
        "Si el prompt esta vacio, pasa primero por el generador de prompts.",
      ],
      primaryCtaLabel: "Abrir la herramienta de video",
      secondaryCtaLabel: "Volver a la pagina principal del flujo",
    },
    guideBestPrompts: {
      metaTitle: "Mejores prompts de Nano Banana - Formulas y ejemplos",
      metaDescription:
        "Aprende estructuras y ejemplos de prompts para Nano Banana tanto en texto a video como en imagen a video.",
      title: "Mejores prompts de Nano Banana",
      description:
        "Esta guia ayuda a mejorar el prompt antes de gastar credits en nuevas generaciones.",
      intro:
        "El objetivo no es escribir mas. El objetivo es escribir mejor: con mas estructura, menos contradiccion y mejor control del movimiento.",
      steps: [
        { title: "Define la escena en una linea", description: "Aclara quien o que aparece antes de añadir detalles tecnicos." },
        { title: "Separa movimiento y camara", description: "Describe por separado el movimiento del sujeto y el movimiento de camara." },
        { title: "Ajusta desde el resultado", description: "Si la escena esta bien pero el encuadre no, corrige solo la parte de camara." },
      ],
      tips: [
        "Un prompt claro suele rendir mejor que uno largo.",
        "Usa una sola direccion de estilo cada vez.",
        "Toma los ejemplos como estructura, no como texto fijo.",
      ],
      primaryCtaLabel: "Usar el generador de prompts",
      secondaryCtaLabel: "Volver a la pagina de prompts",
    },
    guideSettingsLimits: {
      metaTitle: "Ajustes y limites de Nano Banana - Guia practica",
      metaDescription:
        "Guia practica para revisar ajustes, calidad y limites de Nano Banana antes de empezar a generar.",
      title: "Ajustes y limites de Nano Banana",
      description:
        "Esta guia esta pensada para usuarios que ya estan cerca de generar y quieren reducir errores sobre calidad, credits o viabilidad.",
      intro:
        "La guia de ajustes no existe para alargar la investigacion, sino para reducir pruebas fallidas y gasto innecesario de credits.",
      steps: [
        { title: "Define el objetivo de salida", description: "Decide si optimizas por velocidad, calidad, contenido social o uso comercial." },
        { title: "Mira primero los limites", description: "Antes de probar muchas variantes, entiende credits y restricciones de salida." },
        { title: "Cambia una variable cada vez", description: "Asi sabras si la diferencia vino del prompt o de la configuracion." },
      ],
      tips: [
        "La investigacion debe terminar en una accion dentro de la herramienta.",
        "Anota que cambios mejoraron de verdad el resultado.",
        "Para onboarding usa la pagina gratis; para restricciones usa la pagina de limites.",
      ],
      primaryCtaLabel: "Abrir la herramienta de video",
      secondaryCtaLabel: "Volver a precios y limites",
    },
  },
};

const landingPageContent: Record<LandingPageKey, LandingPageContentSection> = {
  videoGenerator: {
    contentBlocksTitle: "What people need before they click generate",
    contentBlocksDescription:
      "Broad video queries hide three very different jobs: choosing the workflow, understanding the current model limits, and getting a stable first result.",
    contentBlocks: [
      {
        title: "Choose the right workflow first",
        description:
          "Most users do not need another brand summary. They need to know which path reduces uncertainty fastest.",
        bullets: [
          "Use text-to-video when you only have an idea and need the scene, action, and camera built from scratch.",
          "Use image-to-video when the product, character, or composition is already approved and you only need motion.",
          "Use Veo 3.1 Fast for short 8-second iterations, and use Sora 2 when you need 10-second or 15-second runs.",
        ],
      },
      {
        title: "Understand the live product limits",
        description:
          "This project does not expose one generic black-box model. The available options shape what users can realistically expect.",
        bullets: [
          "The current video tool exposes Sora 2, Sora 2 Pro, and Veo 3.1 Fast rather than a single default video model.",
          "The workflow supports both text-to-video and image-to-video, with 16:9 and 9:16 framing in the public tool.",
          "Generation is not instant: the product warns users to expect roughly 2 to 10 minutes depending on the model.",
        ],
      },
      {
        title: "Get a better first pass",
        description:
          "Most failed first generations come from vague motion direction, not from missing style adjectives.",
        bullets: [
          "Keep the prompt structured around subject, action, camera movement, lighting, and mood.",
          "If the first output has the right scene but weak motion, rewrite only the motion and camera lines instead of replacing everything.",
          "If the result drifts away from your intended framing, switch to image-to-video or use start/end frames for a tighter motion target.",
        ],
      },
    ],
  },
  imageToVideo: {
    contentBlocksTitle: "How to make image-to-video outputs hold together",
    contentBlocksDescription:
      "Image-to-video users care less about brand copy and more about source-image quality, motion wording, and when to switch modes.",
    contentBlocks: [
      {
        title: "Pick source images that survive animation",
        description:
          "Good image-to-video starts with a frame that already looks close to the final composition.",
        bullets: [
          "Use one clear subject with stable composition; crowded collages and weak focal points usually animate poorly.",
          "Start from the image that already matches your final framing, because the motion prompt should add movement, not redesign the scene.",
          "The prompt box accepts uploaded images up to 10MB, so compress oversized files before testing.",
        ],
      },
      {
        title: "Write motion prompts that preserve the image",
        description:
          "The goal is to animate the chosen frame, not to re-describe every visual detail from scratch.",
        bullets: [
          "Describe what moves, how fast it moves, and how the camera behaves; avoid rewriting colors, wardrobe, or background unless they must change.",
          "Good first-pass instructions are small: slow dolly in, subtle head turn, light breeze, steam rising, shallow handheld drift.",
          "When motion feels too aggressive, reduce the number of verbs and remove competing camera directions.",
        ],
      },
      {
        title: "Know when to use single frame or start/end frames",
        description:
          "Different image inputs solve different motion problems.",
        bullets: [
          "Use a single image when you want one static frame to come alive without changing the composition too much.",
          "Use start and end frames when you need a defined transition, reveal, or before-and-after movement target.",
          "If the image is only a loose reference and not a frame lock, text-to-video usually gives more creative freedom.",
        ],
      },
    ],
  },
  textToVideo: {
    contentBlocksTitle: "What makes text-to-video useful instead of vague",
    contentBlocksDescription:
      "Users searching text-to-video usually want a prompt structure, fitting use cases, and a simple way to debug weak outputs.",
    contentBlocks: [
      {
        title: "Use a prompt formula, not a paragraph",
        description:
          "The prompt system in this project already rewards clear cinematic structure.",
        bullets: [
          "Start with subject and action, then add lighting, camera angle, camera movement, and mood.",
          "Call out the shot type or lens when framing matters, such as close-up, wide shot, 35mm, or 85mm portrait lens.",
          "Add one negative instruction when needed, such as no sudden cuts, no unnatural motion, or keep the background stable.",
        ],
      },
      {
        title: "Use text-to-video for the right jobs",
        description:
          "This mode is strongest when you need idea exploration rather than frame preservation.",
        bullets: [
          "Use it for ad concepts, explainer scenes, creator hooks, and storyboard tests when no source image exists.",
          "It is the faster way to compare multiple angles or moods before committing to one approved visual.",
          "Move to image-to-video once one concept frame clearly wins and you want tighter control.",
        ],
      },
      {
        title: "Debug weak prompts in small steps",
        description:
          "Bad first outputs are usually repairable without rewriting everything.",
        bullets: [
          "If the scene is vague, add one concrete action instead of stacking more style words.",
          "If framing is wrong, change the camera line first before rewriting the whole scene.",
          "If the result looks static, specify motion timing such as a 3-second push-in or slow lateral tracking.",
        ],
      },
    ],
  },
  videoFree: {
    contentBlocksTitle: "What users actually mean by free",
    contentBlocksDescription:
      "Free-intent searchers usually want to know whether they can inspect the workflow before paying, how credits work, and how to avoid wasting early tests.",
    contentBlocks: [
      {
        title: "Separate preview access from generation",
        description:
          "This distinction removes most of the confusion behind free-related queries.",
        bullets: [
          "Users can inspect the product flow before login so the tool is not a black box.",
          "Generation starts after sign-up, using available welcome or paid credits rather than unlimited anonymous runs.",
          "If a visitor wants exact per-run costs, this page should send them to pricing and limits instead of repeating vague free claims.",
        ],
      },
      {
        title: "Make free tests count",
        description:
          "The goal of a free page is not to promise everything. It is to help users spend the first few runs intelligently.",
        bullets: [
          "Use the prompt generator or prompt examples before you consume credits on a full run.",
          "Validate framing and motion with the cheaper or faster option before moving to quality mode.",
          "Run one narrow test per idea instead of one giant prompt that mixes multiple scenes and camera moves.",
        ],
      },
    ],
  },
  videoPrompts: {
    contentBlocksTitle: "Prompt guidance that helps users generate better videos",
    contentBlocksDescription:
      "Prompt-focused visitors are usually very close to converting. They need formulas, examples, and quick fixes for common failure modes.",
    contentBlocks: [
      {
        title: "Break prompts into controllable parts",
        description:
          "Prompt quality improves when each instruction has a job instead of one long descriptive blob.",
        bullets: [
          "A strong prompt usually separates mood, subject, lighting, camera angle, camera movement, and texture.",
          "For image-to-video, keep the prompt shorter and focus on motion, camera, and atmosphere rather than re-describing the whole frame.",
          "For text-to-video, add enough scene detail to make pacing and composition unambiguous.",
        ],
      },
      {
        title: "Reuse patterns instead of starting from zero",
        description:
          "Searchers asking for prompts often want examples they can adapt immediately.",
        bullets: [
          "Product ad: close-up of a glass bottle on a wet stone table, slow dolly in, soft rim light, condensation forming, premium commercial look.",
          "Creator clip: handheld medium shot, creator turns toward camera, quick smile, natural morning light, subtle street energy.",
          "Image animation: preserve the uploaded composition, animate hair, fabric, and drifting smoke, gentle push-in, no scene changes.",
        ],
      },
      {
        title: "Fix only the broken part of the prompt",
        description:
          "Most prompt iteration should be surgical, not a complete rewrite.",
        bullets: [
          "If subject identity drifts, remove extra style changes and anchor the character or object earlier in the prompt.",
          "If camera motion feels chaotic, pick one movement verb and one shot size.",
          "If the model adds too much, add a negative instruction like no extra objects, no cuts, or keep the background stable.",
        ],
      },
    ],
  },
  videoPricingLimits: {
    contentBlocksTitle: "The settings and cost questions users ask right before conversion",
    contentBlocksDescription:
      "Pricing and limits traffic is usually trying to answer viability questions: how long, what quality, and how expensive each test is.",
    contentBlocks: [
      {
        title: "Current model and output options",
        description:
          "The best pricing page explains the real output boundaries, not just subscription language.",
        bullets: [
          "Veo 3.1 Fast is exposed for text-to-video and image-to-video, with 8-second outputs at 720p and 16:9 or 9:16 framing.",
          "Sora 2 Fast supports 10-second and 15-second runs at 720p.",
          "Sora 2 Pro adds 1080p quality mode for the same 10-second and 15-second durations.",
        ],
      },
      {
        title: "Credit cost snapshot",
        description:
          "These numbers help users decide whether they are still exploring or ready for higher-quality runs.",
        bullets: [
          "Veo 3.1 Fast is charged at 100 credits per generation in the current tool.",
          "Sora 2 Fast costs 80 credits for 10 seconds and 120 credits for 15 seconds.",
          "Sora 2 Pro costs 150 or 300 credits at 720p, and 300 or 600 credits at 1080p, depending on duration.",
        ],
      },
      {
        title: "Spend fewer credits while learning",
        description:
          "Most users do not need their first run to be the final run.",
        bullets: [
          "Use fast or lower-cost runs to validate framing, motion, and prompt logic before moving to higher quality.",
          "Change one variable at a time: prompt, duration, or quality. Otherwise you cannot tell what improved the output.",
          "If your blocker is onboarding, use the free page; if your blocker is prompt quality, use the prompt page before generating again.",
        ],
      },
    ],
  },
};

const localizedLandingPageContent: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<Record<LandingPageKey, LandingPageContentSection>>
> = {
  zh: {
    videoGenerator: {
      contentBlocksTitle: "用户真正需要先看清的事",
      contentBlocksDescription:
        "品牌总词背后其实藏着三类问题：该走哪条工作流、当前工具到底支持什么、以及怎样让第一次生成更接近可用结果。",
      contentBlocks: [
        {
          title: "先选对工作流",
          description:
            "大多数用户不缺一句“这是什么工具”，而是缺一个能快速降低试错成本的入口判断。",
          bullets: [
            "如果你只有想法，没有现成画面，就先走文生视频，让模型把场景、动作和镜头先搭起来。",
            "如果商品图、角色图或关键构图已经确定，就先走图生视频，把控制重点放在运动和镜头上。",
            "如果你要先快速试方向，优先用 Veo 3.1 Fast 的 8 秒短输出；如果你需要 10 秒或 15 秒时长，再看 Sora 2。",
          ],
        },
        {
          title: "先知道当前真实能力边界",
          description:
            "这个项目不是一个抽象的“视频 AI”，而是明确接了几种不同模型和参数组合。",
          bullets: [
            "当前视频工具接的是 Sora 2、Sora 2 Pro 和 Veo 3.1 Fast，而不是一个默认黑盒模型。",
            "实际流程同时支持文生视频和图生视频，公开工具里也给出了 16:9 和 9:16 两种主流画幅。",
            "生成不是秒出，产品内明确提示不同模型大约需要 2 到 10 分钟，所以内容里应该提前管理预期。",
          ],
        },
        {
          title: "提高第一次生成命中率",
          description:
            "第一次出图不稳，通常不是因为形容词不够多，而是动作、镜头和限制条件写得不够清楚。",
          bullets: [
            "提示词优先写清主体、动作、镜头运动、光线和氛围，而不是堆太多风格词。",
            "如果结果场景对了但运动弱，就只改动作和镜头，不要整段全部推翻重写。",
            "如果画面老是跑偏，优先改走图生视频，或使用起始帧/结束帧把运动目标锁得更紧。",
          ],
        },
      ],
    },
    imageToVideo: {
      contentBlocksTitle: "怎样把图生视频做得更稳",
      contentBlocksDescription:
        "搜图生视频的用户关心的不是一句概述，而是原图怎么选、动作怎么写、什么时候该换模式。",
      contentBlocks: [
        {
          title: "先选能扛住动画的原图",
          description:
            "好的图生视频，第一步不是写 prompt，而是先拿到一张已经接近最终构图的图。",
          bullets: [
            "优先选主体清晰、构图稳定的图片，信息量过大的拼贴图和多主体图更容易动坏。",
            "最好直接用已经接近最终镜头的那张图，因为动作提示词应该是补运动，不是重做画面设计。",
            "当前上传图片有 10MB 限制，过大的原图先压缩，再进入测试流程。",
          ],
        },
        {
          title: "动作提示词只补运动，不重写整张图",
          description:
            "图生视频的 prompt 应该围绕“怎么动”和“镜头怎么走”，而不是把背景、服装、色彩全重描述一遍。",
          bullets: [
            "重点写谁在动、怎么动、速度怎样、镜头怎么走，除非真的需要改动，否则不要改主体设定和背景信息。",
            "第一版最稳的动作通常很克制，比如慢推镜、轻微转头、风吹衣摆、蒸汽上升、细微手持漂移。",
            "如果结果动作过猛或画面乱跳，就减少动词数量，并去掉互相打架的镜头指令。",
          ],
        },
        {
          title: "分清单帧和起止帧两种场景",
          description:
            "不同输入方式解决的是不同的运动问题。",
          bullets: [
            "只有一张图时，适合做“让静态画面活起来”的单帧动画。",
            "如果你需要明确的过渡、前后变化或 reveal，起始帧和结束帧会比单图更稳。",
            "如果图片只是灵感参考，而不是要锁住构图，那往往直接走文生视频更自由。",
          ],
        },
      ],
    },
    textToVideo: {
      contentBlocksTitle: "怎样把文生视频写得可执行",
      contentBlocksDescription:
        "文生视频页面真正该回答的是：提示词怎么拆、什么需求更适合文生视频、结果不对时先改哪里。",
      contentBlocks: [
        {
          title: "用结构，不要用一大段口水话",
          description:
            "项目里的提示词生成逻辑本身就是按电影化结构来优化的。",
          bullets: [
            "先写主体和动作，再补光线、机位、镜头运动和情绪氛围。",
            "如果构图很重要，就直接写 shot type 或 lens，比如 close-up、wide shot、35mm、85mm portrait lens。",
            "必要时加一条负向限制，比如 no sudden cuts、no unnatural motion、keep the background stable。",
          ],
        },
        {
          title: "这些场景更适合文生视频",
          description:
            "当你还没有锁定某一张参考图时，文生视频往往更高效。",
          bullets: [
            "广告创意、讲解场景、创作者开场钩子、分镜草案测试，都更适合先从文生视频开始。",
            "它很适合快速比较不同镜头、不同气质和不同节奏，再决定往哪条方向继续。",
            "一旦某个概念画面已经明显胜出，再切去图生视频，会更利于锁构图。",
          ],
        },
        {
          title: "结果不对时，按最小修改原则修",
          description:
            "第一次结果偏了，大多数情况都不需要全盘重写。",
          bullets: [
            "如果场景太空，就补一个明确动作，而不是继续堆风格形容词。",
            "如果构图不对，先改 camera line，不要先把整段场景推翻。",
            "如果画面太静，就把运动时间写具体，比如 3-second push-in 或 slow lateral tracking。",
          ],
        },
      ],
    },
    videoFree: {
      contentBlocksTitle: "“免费”流量真正想知道什么",
      contentBlocksDescription:
        "大多数搜 free 的用户，不是真的在问“永久免费吗”，而是在问能不能先看流程、要不要先付钱、怎么少浪费前几次测试。",
      contentBlocks: [
        {
          title: "先把预览和生成分开说清",
          description:
            "只要把这层说清，很多 free 相关搜索的疑问就会消失。",
          bullets: [
            "用户可以先看产品流程，了解模型、输入方式和核心控件，而不是登录前完全黑盒。",
            "真正开始生成发生在注册之后，依赖可用的欢迎 credits 或付费 credits，而不是匿名无限免费。",
            "如果用户想看具体每次生成要花多少 credits，这里应该导去价格与限制页，而不是重复模糊地说可免费试用。",
          ],
        },
        {
          title: "让前几次测试更值钱",
          description:
            "免费页最有价值的事，不是承诺一切都免费，而是帮用户把前几次试错花在关键问题上。",
          bullets: [
            "先用提示词生成器或提示词示例把结构整理好，再消耗 credits 跑完整生成。",
            "先用更快或更省的配置验证构图和动作，再考虑切到高质量模式。",
            "每次只验证一个想法，不要把多个场景和多个镜头运动塞进第一次测试。",
          ],
        },
      ],
    },
    videoPrompts: {
      contentBlocksTitle: "真正有用的视频提示词内容应该长什么样",
      contentBlocksDescription:
        "搜 prompts 的用户离转化很近，他们需要的是公式、示例和失败修正，而不是再看一遍“提示词很重要”。",
      contentBlocks: [
        {
          title: "把提示词拆成可控模块",
          description:
            "提示词越能拆分职责，后续迭代越容易。",
          bullets: [
            "一个稳定的视频 prompt 通常会把情绪、主体、光线、机位、镜头运动和材质感分开写。",
            "图生视频时，prompt 更应该聚焦动作、镜头和氛围，而不是重写整张图里已经存在的内容。",
            "文生视频时，则要补足场景信息，让节奏和构图不再模糊。",
          ],
        },
        {
          title: "给用户可直接改写的模式",
          description:
            "很多提示词搜索其实是在找“能不能给我一个起手式”。",
          bullets: [
            "产品广告：close-up of a glass bottle on a wet stone table, slow dolly in, soft rim light, condensation forming, premium commercial look。",
            "创作者短视频：handheld medium shot, creator turns toward camera, quick smile, natural morning light, subtle street energy。",
            "图生视频动画：preserve the uploaded composition, animate hair, fabric, and drifting smoke, gentle push-in, no scene changes。",
          ],
        },
        {
          title: "哪里坏了就修哪里",
          description:
            "多数情况下不需要重写全文，只要修掉最明显的失败点。",
          bullets: [
            "如果主体跑偏，就减少多余风格变化，并把角色或物体锚定信息提前。",
            "如果镜头太乱，就只保留一种运动方式和一种 shot size。",
            "如果模型加戏太多，就补一句 no extra objects、no cuts 或 keep the background stable。",
          ],
        },
      ],
    },
    videoPricingLimits: {
      contentBlocksTitle: "转化前用户最想确认的设置和成本问题",
      contentBlocksDescription:
        "价格与限制流量本质上是在问：当前能出多长、多清晰、每次测试大概要花多少。",
      contentBlocks: [
        {
          title: "当前模型和输出边界",
          description:
            "好的定价/限制页应该先讲清真实可选项，再谈套餐和转化。",
          bullets: [
            "Veo 3.1 Fast 当前支持文生视频和图生视频，输出为 8 秒、720p，画幅是 16:9 或 9:16。",
            "Sora 2 Fast 支持 10 秒和 15 秒，分辨率为 720p。",
            "Sora 2 Pro 在同样 10 秒和 15 秒时长下，增加了 1080p 质量模式。",
          ],
        },
        {
          title: "credits 成本快照",
          description:
            "这些数字能帮用户判断自己现在是在探索阶段，还是已经值得切到更高质量。",
          bullets: [
            "Veo 3.1 Fast 当前每次生成扣 100 credits。",
            "Sora 2 Fast 的 10 秒和 15 秒分别是 80 credits 和 120 credits。",
            "Sora 2 Pro 在 720p 下是 150 或 300 credits，在 1080p 下是 300 或 600 credits，取决于时长。",
          ],
        },
        {
          title: "怎样少花无效 credits",
          description:
            "多数用户的第一条视频并不需要直接冲最终质量。",
          bullets: [
            "先用更快或更低成本的配置验证构图、动作和 prompt 逻辑，再切到高质量。",
            "每次只改一个变量，比如 prompt、时长或质量，否则你很难判断到底什么带来了改善。",
            "如果你卡在上手门槛，先看免费页；如果你卡在 prompt 质量，先回提示词页再继续生成。",
          ],
        },
      ],
    },
  },
  ja: {},
  es: {},
};

const landingPageComparisons: Partial<
  Record<LandingPageKey, LandingPageComparisonSection>
> = {
  videoGenerator: {
    comparisonTitle: "Which model or workflow should you choose first?",
    comparisonDescription:
      "Most broad traffic is really trying to answer one decision question: which option gets me to a usable result with the least wasted time or credits?",
    comparisonCards: [
      {
        title: "Veo 3.1 Fast",
        summary:
          "Best when you want quick iterations and short outputs without waiting on a longer quality pass.",
        bullets: [
          "Supports text-to-video and image-to-video in the current product flow.",
          "Runs at 8 seconds and 720p with 16:9 or 9:16 framing.",
          "Good default for testing concept, pacing, and prompt logic before spending more.",
        ],
      },
      {
        title: "Sora 2 Fast",
        summary:
          "Best when the key question is duration rather than final quality, especially for 10-second and 15-second tests.",
        bullets: [
          "Supports 10-second and 15-second runs at 720p.",
          "Works for both text-to-video and image-to-video variants.",
          "Useful when 8 seconds is too short but you still want to stay below pro-level cost.",
        ],
      },
      {
        title: "Sora 2 Pro",
        summary:
          "Best when the scene direction is already right and you are ready to pay for higher-quality output.",
        bullets: [
          "Adds 1080p quality mode on top of 10-second and 15-second duration choices.",
          "Costs significantly more, so it makes sense later in the workflow, not at the idea-validation stage.",
          "Use it after prompt, framing, and motion direction are already stable.",
        ],
      },
    ],
  },
  videoPricingLimits: {
    comparisonTitle: "How to read the current model and pricing differences",
    comparisonDescription:
      "Users searching pro, 2, limit, or length are usually trying to compare real tradeoffs, not just read a pricing box.",
    comparisonCards: [
      {
        title: "Fastest path: Veo 3.1 Fast",
        summary:
          "Use this when you want a short, lower-friction test before committing to longer or more expensive runs.",
        bullets: [
          "8-second output, 720p, 100 credits per run in the current codebase.",
          "Best for checking whether the prompt logic and motion direction are working.",
          "If 8 seconds is too restrictive, move to Sora 2 rather than trying to solve everything in the prompt.",
        ],
      },
      {
        title: "Middle ground: Sora 2 Fast",
        summary:
          "This is the duration-first choice when you need more time on screen without jumping straight to high-cost quality mode.",
        bullets: [
          "10 seconds costs 80 credits and 15 seconds costs 120 credits.",
          "Stays at 720p, which is often enough for early concept validation.",
          "A better fit than pro mode when the goal is story timing rather than polish.",
        ],
      },
      {
        title: "Highest quality: Sora 2 Pro",
        summary:
          "Choose this when users are already beyond exploration and want to pay for more refined output.",
        bullets: [
          "720p options cost 150 or 300 credits, and 1080p options cost 300 or 600 credits depending on duration.",
          "The value is in output quality, not in helping users discover the right prompt.",
          "If users still feel uncertain about framing or motion, they should step back to a faster model first.",
        ],
      },
    ],
  },
};

const localizedLandingPageComparisons: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<Record<LandingPageKey, LandingPageComparisonSection>>
> = {
  zh: {
    videoGenerator: {
      comparisonTitle: "先选模型，还是先选工作流？",
      comparisonDescription:
        "很多总词流量表面上在搜 generator，实际上是在问一个决策问题：哪种选项能让我用最少的时间和 credits 得到第一条可用结果。",
      comparisonCards: [
        {
          title: "Veo 3.1 Fast",
          summary:
            "适合想快速试方向、先验证概念和动作是否成立的用户。",
          bullets: [
            "当前产品流程里支持文生视频和图生视频。",
            "输出为 8 秒、720p，画幅是 16:9 或 9:16。",
            "很适合先验证概念、节奏和 prompt 逻辑，再决定要不要升级成本。",
          ],
        },
        {
          title: "Sora 2 Fast",
          summary:
            "适合主要在意时长，而不是一开始就追求最终质量的用户。",
          bullets: [
            "支持 10 秒和 15 秒，分辨率为 720p。",
            "当前同时有文生视频和图生视频变体。",
            "当 8 秒不够用，但又不想直接跳到高成本质量模式时，它是更合理的中间选择。",
          ],
        },
        {
          title: "Sora 2 Pro",
          summary:
            "适合方向已经跑对、准备为更高质量输出付费的阶段。",
          bullets: [
            "在 10 秒和 15 秒基础上增加了 1080p 质量模式。",
            "成本明显更高，所以更适合工作流后段，而不是用来探索创意方向。",
            "最好在 prompt、构图和动作方向已经稳定后再切进来。",
          ],
        },
      ],
    },
    videoPricingLimits: {
      comparisonTitle: "怎么看当前模型和成本差异",
      comparisonDescription:
        "搜 pro、2、limit、length 这类词的用户，本质是在比较真实取舍，而不是单纯看一个价格表。",
      comparisonCards: [
        {
          title: "最快试错：Veo 3.1 Fast",
          summary:
            "适合先跑一个短、快、阻力更低的测试，再决定是否投入更长或更贵的生成。",
          bullets: [
            "当前代码里是 8 秒、720p、每次 100 credits。",
            "最适合先验证 prompt 逻辑和动作方向是否成立。",
            "如果 8 秒太短，就切去 Sora 2，而不是在 prompt 里硬塞更多内容试图补时长。",
          ],
        },
        {
          title: "中间档：Sora 2 Fast",
          summary:
            "当你需要更长时长，但又不想直接切到高成本质量模式时，这个选择最合理。",
          bullets: [
            "10 秒是 80 credits，15 秒是 120 credits。",
            "仍然是 720p，但对早期概念验证来说通常已经够用。",
            "当你的目标是验证叙事节奏，而不是最终质感时，它比 Pro 更合适。",
          ],
        },
        {
          title: "高质量档：Sora 2 Pro",
          summary:
            "适合已经过了探索阶段、明确要为更精细输出买单的用户。",
          bullets: [
            "720p 档是 150 或 300 credits，1080p 档是 300 或 600 credits，取决于时长。",
            "它的价值在于输出质量，不在于帮用户找 prompt 方向。",
            "如果用户还不确定构图或动作，就应该先退回更快的模型做验证。",
          ],
        },
      ],
    },
  },
  ja: {},
  es: {},
};

const landingPageExamples: Partial<Record<LandingPageKey, LandingPageExampleSection>> = {
  imageToVideo: {
    exampleTitle: "Image-to-video prompt cases users can adapt immediately",
    exampleDescription:
      "The highest-value examples keep the original image stable and only add the motion needed for the shot.",
    exampleCards: [
      {
        title: "Product beauty shot",
        scenario:
          "Use this when the uploaded image is already the approved hero frame for an ecommerce or launch asset.",
        prompt:
          "Preserve the uploaded composition. Slow dolly in toward the product. Soft rim light catches the bottle edges. Tiny condensation drops form and slide down. Subtle steam rises behind the product. No new objects, no scene changes, no sudden camera shake.",
        whyItWorks:
          "It locks composition first, then adds a small number of believable motions that improve depth and premium feel.",
        nextStep:
          "If the motion feels too busy, remove either the steam or the condensation and keep only one secondary effect.",
      },
      {
        title: "Portrait animation",
        scenario:
          "Use this when the face, wardrobe, and framing are already right and you only want life in the shot.",
        prompt:
          "Keep the uploaded portrait unchanged. Slight head turn toward camera, natural blink, light breeze moving a few strands of hair, gentle handheld drift, warm late-afternoon light. Keep background stable, no extra gestures, no scene transition.",
        whyItWorks:
          "Portrait prompts usually fail when they ask for too many actions. This one keeps identity and framing stable.",
        nextStep:
          "If identity drifts, shorten the motion line and keep only blink plus one small head movement.",
      },
      {
        title: "Atmospheric still frame",
        scenario:
          "Use this for concept art, posters, or moody still scenes that need subtle motion rather than dramatic action.",
        prompt:
          "Preserve the uploaded composition. Slow push-in. Smoke drifts across the frame. Fabric edges move slightly in the wind. Light flickers softly on background surfaces. No cuts, no new characters, no camera whip.",
        whyItWorks:
          "It turns a static artwork into a living shot without forcing a full narrative change.",
        nextStep:
          "If the background changes too much, add keep background stable and remove one atmospheric effect.",
      },
    ],
  },
  textToVideo: {
    exampleTitle: "Text-to-video examples that show structure, not fluff",
    exampleDescription:
      "These examples are useful because each one separates subject, action, camera, and mood clearly enough to iterate later.",
    exampleCards: [
      {
        title: "Short product launch clip",
        scenario:
          "Use this when you need a commercial-looking concept before you have a locked reference image.",
        prompt:
          "A premium glass serum bottle stands on a black stone pedestal in a dark studio. Slow dolly in from medium shot to close-up. Soft rim light outlines the bottle edges while tiny water droplets gather on the surface. Calm, polished, luxury mood. No extra products, no sudden cuts.",
        whyItWorks:
          "The subject, action, camera move, lighting direction, and exclusions are all explicit, so the model has less room to improvise badly.",
        nextStep:
          "If the bottle looks right but the motion feels weak, only strengthen the dolly-in and lighting interaction lines.",
      },
      {
        title: "Creator hook",
        scenario:
          "Use this for social intros, talking-head hooks, or lightweight brand clips.",
        prompt:
          "Handheld medium shot of a creator stepping into frame on a quiet city street at sunrise. The creator turns toward camera with a quick smile and raises one hand as if starting a sentence. Natural morning light, subtle street energy, clean background separation. No crowd rush, no jump cuts.",
        whyItWorks:
          "It defines one human action, one camera feel, and one emotional tone without overloading the scene.",
        nextStep:
          "If framing is off, change only the shot size or camera movement before rewriting the whole scene.",
      },
      {
        title: "Cinematic environment test",
        scenario:
          "Use this when you need to test atmosphere, pacing, and shot language for a concept scene.",
        prompt:
          "Wide shot of a lone runner stopping beneath neon signs in light rain at night. Camera slowly tracks from left to right as the runner catches breath and lifts their head. Wet pavement reflections shimmer, thin mist hangs in the air, tense but hopeful mood. No explosions, no extra characters, no rapid zoom.",
        whyItWorks:
          "It gives the model a clear scene anchor, one character action, one camera move, and a tight emotional lane.",
        nextStep:
          "If the scene is good but looks static, add a specific timing cue such as a 3-second lateral track.",
      },
    ],
  },
  videoPrompts: {
    exampleTitle: "Prompt examples matched to real user jobs",
    exampleDescription:
      "Prompt pages should not only teach theory. They should give users example structures they can rewrite in seconds.",
    exampleCards: [
      {
        title: "Product ad prompt",
        scenario:
          "For ecommerce, launch pages, or premium brand visuals where the object is the star.",
        prompt:
          "Close-up of a glass bottle on a wet stone table. Slow dolly in. Soft rim light from back left. Condensation forming on the surface. Premium commercial look. No extra props, no abrupt motion, keep the background dark and clean.",
        whyItWorks:
          "It anchors the product, defines one camera move, and keeps the lighting readable instead of piling on unrelated style terms.",
        nextStep:
          "Move to the video tool and test whether the shot needs more motion or simply stronger lighting detail.",
      },
      {
        title: "Creator video prompt",
        scenario:
          "For short social clips where the energy comes from a person entering or addressing the frame.",
        prompt:
          "Handheld medium shot. Creator turns toward camera with a quick smile and starts to speak. Natural morning light, subtle street energy, shallow depth of field. No crowd blocking the subject, no jump cuts, no chaotic camera shake.",
        whyItWorks:
          "This prompt gives the model one subject action, one camera feel, and one clean tonal direction.",
        nextStep:
          "If the identity looks good, only refine framing or timing instead of adding more style words.",
      },
      {
        title: "Image-animation prompt",
        scenario:
          "For uploaded artwork or approved stills where preserving composition matters more than inventing a new scene.",
        prompt:
          "Preserve the uploaded composition. Animate hair, fabric, and drifting smoke. Gentle push-in. Keep subject identity and background stable. No scene changes, no extra characters, no sudden cuts.",
        whyItWorks:
          "It tells the model what must stay fixed and only opens a narrow lane for motion.",
        nextStep:
          "If the model changes the background too much, shorten the atmospheric effects and keep only one moving detail.",
      },
    ],
  },
};

const localizedLandingPageExamples: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<Record<LandingPageKey, LandingPageExampleSection>>
> = {
  zh: {
    imageToVideo: {
      exampleTitle: "图生视频里最值得给用户的案例块",
      exampleDescription:
        "高价值示例的共同点是先锁住原图，再只补必要动作，而不是让模型重新设计一遍画面。",
      exampleCards: [
        {
          title: "产品质感镜头",
          scenario:
            "适合电商主图、发布页 hero 图这类已经通过审核的成品画面。",
          prompt:
            "Preserve the uploaded composition. Slow dolly in toward the product. Soft rim light catches the bottle edges. Tiny condensation drops form and slide down. Subtle steam rises behind the product. No new objects, no scene changes, no sudden camera shake.",
          whyItWorks:
            "先锁构图，再补少量可信的小动作和质感细节，最容易得到稳定且高级的结果。",
          nextStep:
            "如果动作太花，就删掉蒸汽或水珠中的一个，只保留一个次级动态效果。",
        },
        {
          title: "人像轻动画",
          scenario:
            "适合脸、服装、构图已经对了，只需要给画面一点生命感的场景。",
          prompt:
            "Keep the uploaded portrait unchanged. Slight head turn toward camera, natural blink, light breeze moving a few strands of hair, gentle handheld drift, warm late-afternoon light. Keep background stable, no extra gestures, no scene transition.",
          whyItWorks:
            "人像最怕动作过多导致脸跑掉，这种写法把身份和构图稳定性放在第一位。",
          nextStep:
            "如果人脸开始跑偏，就把动作缩到 blink 加一个轻微 head turn。",
        },
        {
          title: "氛围静帧动画",
          scenario:
            "适合概念图、海报、情绪场景这类更适合做微动而不是大动作的画面。",
          prompt:
            "Preserve the uploaded composition. Slow push-in. Smoke drifts across the frame. Fabric edges move slightly in the wind. Light flickers softly on background surfaces. No cuts, no new characters, no camera whip.",
          whyItWorks:
            "它能把静态画面变成“活着的镜头”，但不会强行把画面改成另一个故事。",
          nextStep:
            "如果背景变化太多，就加 keep background stable，并删掉一个氛围特效。",
        },
      ],
    },
    textToVideo: {
      exampleTitle: "文生视频最该给用户看的示例",
      exampleDescription:
        "真正有价值的例子，不是辞藻堆得多，而是主体、动作、镜头和氛围拆得足够清楚，后面才好改。",
      exampleCards: [
        {
          title: "产品发布短片",
          scenario:
            "适合在还没有锁定参考图时，先验证广告感和产品镜头方向。",
          prompt:
            "A premium glass serum bottle stands on a black stone pedestal in a dark studio. Slow dolly in from medium shot to close-up. Soft rim light outlines the bottle edges while tiny water droplets gather on the surface. Calm, polished, luxury mood. No extra products, no sudden cuts.",
          whyItWorks:
            "主体、动作、镜头、光线方向和限制条件都写清楚了，模型自由发挥的空间更小。",
          nextStep:
            "如果瓶子已经对了但镜头不够有力，就只加强 dolly-in 和光线变化，不要重写全段。",
        },
        {
          title: "创作者开场钩子",
          scenario:
            "适合社媒 intro、真人短视频开头、轻品牌内容。",
          prompt:
            "Handheld medium shot of a creator stepping into frame on a quiet city street at sunrise. The creator turns toward camera with a quick smile and raises one hand as if starting a sentence. Natural morning light, subtle street energy, clean background separation. No crowd rush, no jump cuts.",
          whyItWorks:
            "它只给一个人物动作、一个镜头感觉和一个情绪方向，结构很干净。",
          nextStep:
            "如果构图不对，就先改 shot size 或 camera movement，而不是整段重来。",
        },
        {
          title: "电影感环境测试",
          scenario:
            "适合测试概念场景的气氛、节奏和镜头语言。",
          prompt:
            "Wide shot of a lone runner stopping beneath neon signs in light rain at night. Camera slowly tracks from left to right as the runner catches breath and lifts their head. Wet pavement reflections shimmer, thin mist hangs in the air, tense but hopeful mood. No explosions, no extra characters, no rapid zoom.",
          whyItWorks:
            "场景锚点、人物动作、镜头方式和情绪边界都比较明确，结果更容易朝正确方向靠。",
          nextStep:
            "如果画面静得过头，就补一个更具体的时间提示，比如 3-second lateral track。",
        },
      ],
    },
    videoPrompts: {
      exampleTitle: "按真实用户任务整理的 prompt 示例",
      exampleDescription:
        "提示词页不能只讲理论，还要给用户几种几秒内就能改写的结构模板。",
      exampleCards: [
        {
          title: "产品广告 prompt",
          scenario:
            "适用于电商、发布页、品牌视觉这类以产品为中心的内容。",
          prompt:
            "Close-up of a glass bottle on a wet stone table. Slow dolly in. Soft rim light from back left. Condensation forming on the surface. Premium commercial look. No extra props, no abrupt motion, keep the background dark and clean.",
          whyItWorks:
            "它把产品锚住，只给一个镜头运动和一个清晰的光线方向，不会把 prompt 写散。",
          nextStep:
            "进视频工具后，先判断是动作不够还是光线细节不够，再做单点微调。",
        },
        {
          title: "创作者视频 prompt",
          scenario:
            "适合人物开场、社媒短视频、轻访谈式内容。",
          prompt:
            "Handheld medium shot. Creator turns toward camera with a quick smile and starts to speak. Natural morning light, subtle street energy, shallow depth of field. No crowd blocking the subject, no jump cuts, no chaotic camera shake.",
          whyItWorks:
            "这个结构只给一个人物动作、一个镜头气质和一个明确的限制条件，后续更好改。",
          nextStep:
            "如果人物已经对了，就只微调 framing 或 timing，不要继续堆风格词。",
        },
        {
          title: "图生视频动画 prompt",
          scenario:
            "适合已上传 artwork 或 approved still，只想保住构图并加一点运动。",
          prompt:
            "Preserve the uploaded composition. Animate hair, fabric, and drifting smoke. Gentle push-in. Keep subject identity and background stable. No scene changes, no extra characters, no sudden cuts.",
          whyItWorks:
            "它先定义什么必须保持不变，再只开放一条很窄的运动通道。",
          nextStep:
            "如果背景被改得太多，就删掉一部分氛围效果，只留一个动态元素。",
        },
      ],
    },
  },
  ja: {},
  es: {},
};

const guidePageContent: Record<GuidePageKey, GuidePageContentSection> = {
  guideHowTo: {
    contentBlocksTitle: "A practical path from first idea to first usable result",
    contentBlocksDescription:
      "Users searching how-to content usually want a decision tree, a first-run checklist, and a low-waste iteration method.",
    contentBlocks: [
      {
        title: "Start with the fastest decision tree",
        description:
          "Do not make people read five pages just to decide where to begin.",
        bullets: [
          "Start from image-to-video when composition or product identity is already approved.",
          "Start from text-to-video when you only have an idea and need to explore scene options.",
          "Open the prompt generator first when the prompt is still too vague to test confidently.",
        ],
      },
      {
        title: "Keep the first run narrow",
        description:
          "A focused first test usually teaches more than an ambitious all-in-one prompt.",
        bullets: [
          "Choose one goal for the first run: prove the motion, prove the framing, or prove the concept.",
          "Pick the aspect ratio that matches the final placement before you spend credits on the wrong canvas.",
          "Keep the first prompt to one action and one camera move whenever possible.",
        ],
      },
      {
        title: "Iterate without wasting credits",
        description:
          "The fastest workflow is usually the one that changes the least each round.",
        bullets: [
          "Change only one element at a time so you can see whether the improvement came from the prompt or the settings.",
          "Save the prompts that already solved framing or motion so you can reuse them later.",
          "Switch from text-to-video to image-to-video once a reference frame clearly works and needs tighter control.",
        ],
      },
    ],
  },
  guideBestPrompts: {
    contentBlocksTitle: "Prompt patterns that map to the real tool",
    contentBlocksDescription:
      "The most useful prompt guide is the one that matches how the product already thinks about motion, framing, and control.",
    contentBlocks: [
      {
        title: "Use the cinematic prompt stack",
        description:
          "This project's own prompt route already asks for cinematic details, so the guide should mirror that structure.",
        bullets: [
          "Cover mood, subject, lighting, camera angle, camera movement, and lens before you worry about decorative style words.",
          "Add material or texture details only when they help motion feel believable on screen.",
          "Use a negative instruction when there is one failure you specifically want to prevent.",
        ],
      },
      {
        title: "Keep a few strong starters ready",
        description:
          "Examples are most valuable when they show patterns users can adapt immediately.",
        bullets: [
          "Product shot starter: close-up product framing, one clear camera move, one lighting direction, one premium texture detail.",
          "Character scene starter: who is moving, what changes emotionally, how the camera follows, and what to avoid.",
          "Image animation starter: preserve the uploaded composition and only animate motion, atmosphere, and camera drift.",
        ],
      },
      {
        title: "Use a rewrite checklist",
        description:
          "Prompt iteration is more effective when users know which line to touch first.",
        bullets: [
          "If motion is weak, rewrite the action and camera lines first.",
          "If the scene itself is wrong, rewrite subject and setting before you touch style.",
          "If the output feels too busy, remove stacked style layers and keep one dominant visual direction.",
        ],
      },
    ],
  },
  guideSettingsLimits: {
    contentBlocksTitle: "The settings questions worth answering before a paid run",
    contentBlocksDescription:
      "Users do not need a giant spec sheet. They need the few settings that actually change outcome, cost, and fit.",
    contentBlocks: [
      {
        title: "Know which settings matter first",
        description:
          "Some settings change cost and output dramatically, while others can wait.",
        bullets: [
          "Model choice decides duration, quality ceiling, and how quickly you can iterate.",
          "Aspect ratio should match the destination channel early so you do not validate a scene on the wrong canvas.",
          "Higher quality is worth paying for only after the prompt and composition are already stable.",
        ],
      },
      {
        title: "Keep a live limit snapshot handy",
        description:
          "Users checking settings and limits are often only one step away from purchase or generation.",
        bullets: [
          "Veo 3.1 Fast currently runs at 8 seconds, 720p, and 100 credits per generation.",
          "Sora 2 Fast runs at 10 or 15 seconds, with 80 or 120 credits depending on duration.",
          "Sora 2 Pro adds 1080p quality mode, with credit cost rising as duration and quality increase.",
        ],
      },
      {
        title: "Test in the right order",
        description:
          "A simple testing sequence prevents a lot of unnecessary cost.",
        bullets: [
          "Validate concept and motion with the faster or cheaper run before you upscale anything.",
          "Once the output direction is right, move to the higher-quality option for the final version.",
          "Keep a note of the winning prompt, aspect ratio, duration, and model so you do not rediscover the same setup later.",
        ],
      },
    ],
  },
};

const localizedGuidePageContent: Record<
  Exclude<SupportedSeoLocale, "en">,
  Partial<Record<GuidePageKey, GuidePageContentSection>>
> = {
  zh: {
    guideHowTo: {
      contentBlocksTitle: "从想法到第一条可用结果，真正有帮助的路线",
      contentBlocksDescription:
        "搜 how to 的用户通常需要三个东西：一个起步判断、一份第一次生成清单，以及一个少浪费 credits 的迭代方法。",
      contentBlocks: [
        {
          title: "先用最短判断树决定起点",
          description:
            "不要让用户为了决定从哪开始，先在五个页面里来回跳。",
          bullets: [
            "如果构图、商品视觉或角色形象已经确定，就从图生视频开始。",
            "如果你只有创意想法，还没有固定参考图，就先从文生视频开始探索。",
            "如果 prompt 还很空，先用提示词生成器把结构补完整，再进入正式生成。",
          ],
        },
        {
          title: "第一轮尽量只验证一个问题",
          description:
            "一次目标太多，通常只会让你不知道到底哪里出了问题。",
          bullets: [
            "第一次生成只选一个目标：验证动作、验证构图，或者验证概念方向。",
            "在消耗 credits 之前，先选好和最终投放场景一致的画幅。",
            "第一版 prompt 尽量只留一个主体动作和一个镜头运动。",
          ],
        },
        {
          title: "按最小修改原则迭代",
          description:
            "最快的工作流，往往不是每轮都重写，而是每轮只动最关键的一小块。",
          bullets: [
            "一次只改一个变量，这样你才知道改善来自 prompt 还是参数。",
            "把已经证明有效的 prompt 留下来，后面可以直接复用。",
            "当某一帧方向已经很对时，及时从文生视频切到图生视频，会更利于锁定结果。",
          ],
        },
      ],
    },
    guideBestPrompts: {
      contentBlocksTitle: "和真实工具匹配的提示词写法",
      contentBlocksDescription:
        "最有价值的 prompt 指南，不是越长越好，而是要和产品里真正用到的运动、构图和控制逻辑对上。",
      contentBlocks: [
        {
          title: "按电影化提示词栈来写",
          description:
            "项目里的 prompt 路由本来就是按电影化维度生成的，指南也应该沿着这个结构讲。",
          bullets: [
            "先写情绪、主体、光线、机位、镜头运动和镜头语言，再考虑装饰性的风格词。",
            "材质和纹理只在确实会影响画面可信度时再补，不要一开始就堆满。",
            "如果你明确知道某个失败模式要避免，就补一条负向限制。",
          ],
        },
        {
          title: "准备几个能立刻改写的起手式",
          description:
            "示例的价值，不在于让人照抄，而在于让人快速进入正确结构。",
          bullets: [
            "产品广告起手式：明确产品近景、一个镜头运动、一个主光方向、一个质感细节。",
            "人物场景起手式：谁在动、情绪怎么变化、镜头怎么跟、不要出现什么。",
            "图生视频起手式：保留上传构图，只补动作、氛围和镜头漂移。",
          ],
        },
        {
          title: "建立重写检查表",
          description:
            "用户知道先改哪一行，prompt 迭代才会真正变快。",
          bullets: [
            "如果运动弱，就先改动作和镜头那两行。",
            "如果场景本身错了，就先改主体和场景设定，再谈风格。",
            "如果结果太乱，就删掉叠加过多的风格层，只保留一个主方向。",
          ],
        },
      ],
    },
    guideSettingsLimits: {
      contentBlocksTitle: "在付费生成前，哪些设置问题值得先看",
      contentBlocksDescription:
        "用户并不需要一张巨大的参数表，他们真正需要的是少数几个会直接影响结果、成本和适配性的设置。",
      contentBlocks: [
        {
          title: "先看哪些设置最重要",
          description:
            "有些设置会直接改变成本和输出边界，有些可以后面再研究。",
          bullets: [
            "模型选择会直接决定时长、质量上限和迭代速度。",
            "画幅应该尽早和最终渠道对齐，不然你可能一直在错误画布上验证结果。",
            "高质量模式应该建立在 prompt 和构图已经稳定之后，而不是一开始就盲冲。",
          ],
        },
        {
          title: "把当前限制做成可随时查看的快照",
          description:
            "搜 settings 和 limits 的用户，通常离购买或正式生成只差一步。",
          bullets: [
            "Veo 3.1 Fast 当前是 8 秒、720p、每次 100 credits。",
            "Sora 2 Fast 当前支持 10 秒或 15 秒，对应 80 或 120 credits。",
            "Sora 2 Pro 增加 1080p 质量模式，credits 会随着时长和质量上升。",
          ],
        },
        {
          title: "按正确顺序测试",
          description:
            "一个简单的测试顺序，能省掉很多本来可以不花的成本。",
          bullets: [
            "先用更快或更省的配置验证概念和动作，再考虑放大到更高质量。",
            "方向确认之后，再切到更高质量配置做最终版本。",
            "把赢下来的 prompt、画幅、时长和模型组合记下来，避免后面重复踩坑。",
          ],
        },
      ],
    },
  },
  ja: {},
  es: {},
};

function mergeUiCopy(locale: SupportedSeoLocale): InternalLinksUiCopy {
  if (locale === "en") return defaultUiCopy;
  const override = uiOverrides[locale];
  return {
    ...defaultUiCopy,
    ...override,
    homeExplore: { ...defaultUiCopy.homeExplore, ...override.homeExplore },
    homeGuides: { ...defaultUiCopy.homeGuides, ...override.homeGuides },
    homeStart: { ...defaultUiCopy.homeStart, ...override.homeStart },
    promptTool: { ...defaultUiCopy.promptTool, ...override.promptTool },
    videoTool: { ...defaultUiCopy.videoTool, ...override.videoTool },
    blogList: { ...defaultUiCopy.blogList, ...override.blogList },
    blogDetailRelated: {
      ...defaultUiCopy.blogDetailRelated,
      ...override.blogDetailRelated,
    },
    blogDetailCta: { ...defaultUiCopy.blogDetailCta, ...override.blogDetailCta },
    landingTemplate: {
      ...defaultUiCopy.landingTemplate,
      ...override.landingTemplate,
    },
    guideTemplate: {
      ...defaultUiCopy.guideTemplate,
      ...override.guideTemplate,
    },
  };
}

export function getInternalLinksUiCopy(locale: Locale | string) {
  return mergeUiCopy(resolveLocale(locale));
}

export function getLocalizedInternalLinks(
  locale: Locale | string,
  ids: InternalLinkId[]
): InternalLinkItem[] {
  const key = resolveLocale(locale);
  const baseLinks = getInternalLinks(ids);
  if (key === "en") return baseLinks;

  return ids.map((id, index) => ({
    ...baseLinks[index],
    ...itemOverrides[key][id],
  }));
}

export function getLocalizedSeoLandingPage(
  locale: Locale | string,
  key: LandingPageKey
): SeoLandingPageConfig {
  const localeKey = resolveLocale(locale);
  const base = seoLandingPages[key];
  const baseContent = landingPageContent[key];
  const baseComparison = landingPageComparisons[key];
  const baseExamples = landingPageExamples[key];
  if (localeKey === "en") {
    return {
      ...base,
      ...baseContent,
      ...baseComparison,
      ...baseExamples,
    };
  }

  return {
    ...base,
    ...baseContent,
    ...baseComparison,
    ...baseExamples,
    ...landingPageOverrides[localeKey][key],
    ...localizedLandingPageContent[localeKey][key],
    ...localizedLandingPageComparisons[localeKey][key],
    ...localizedLandingPageExamples[localeKey][key],
  };
}

export function getLocalizedGuidePage(
  locale: Locale | string,
  key: GuidePageKey
): GuidePageConfig {
  const localeKey = resolveLocale(locale);
  const base = guidePages[key];
  const baseContent = guidePageContent[key];
  if (localeKey === "en") {
    return {
      ...base,
      ...baseContent,
    };
  }

  return {
    ...base,
    ...baseContent,
    ...guidePageOverrides[localeKey][key],
    ...localizedGuidePageContent[localeKey][key],
  };
}

export const internalLinkLanguages = [
  { locale: "en", label: "English" },
  { locale: "zh", label: "Chinese" },
  { locale: "ja", label: "Japanese" },
  { locale: "es", label: "Spanish" },
] as const;
