import PromptGeneratorChat from "@/components/prompt-generator/PromptGeneratorChat";
import { InternalLinksSection } from "@/components/seo/InternalLinksSection";
import { getInternalLinksUiCopy, getLocalizedInternalLinks } from "@/lib/seo/internal-links-localized";

type Params = Promise<{ locale: string }>;

export default async function PromptGeneratorPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;
  const copy = getInternalLinksUiCopy(locale);

  return (
    <div className="w-full">
      <PromptGeneratorChat />
      <InternalLinksSection
        eyebrow={copy.promptTool.eyebrow}
        title={copy.promptTool.title}
        description={copy.promptTool.description}
        links={getLocalizedInternalLinks(locale, [
          "videoPrompts",
          "textToVideo",
          "imageToVideo",
          "videoGenerator",
          "guideBestPrompts",
          "guideHowTo",
        ])}
      />
    </div>
  );
}
