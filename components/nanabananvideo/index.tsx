import NanoBananaCTA from "@/components/nanabananvideo/CTA";
import NanoBananaFAQ from "@/components/nanabananvideo/FAQ";
import NanoBananaFeatures from "@/components/nanabananvideo/Features";
import NanoBananaGallery from "@/components/nanabananvideo/Gallery";
import NanoBananaHero from "@/components/nanabananvideo/Hero";
import { KeyFeatures } from "@/components/nanabananvideo/KeyFeatures";
import NanoBananaPricing from "@/components/nanabananvideo/Pricing";
import NanoBananaUseCases from "@/components/nanabananvideo/UseCases";
import { InternalLinksSection } from "@/components/seo/InternalLinksSection";
import VideoGenerationDemo from "@/components/nanabananvideo/VideoGenerationDemo";
import ImageGenerationDemo from "@/components/nanabananvideo/ImageGenerationDemo";
import { BG1 } from "@/components/shared/BGs";
import { guidePageIds, p0LandingPageIds } from "@/lib/seo/internal-links";
import { getInternalLinksUiCopy, getLocalizedInternalLinks } from "@/lib/seo/internal-links-localized";
import { getLocale, getMessages } from "next-intl/server";

export default async function NanoBananaVideoPage() {
  const messages = await getMessages();
  const locale = await getLocale();
  const copy = getInternalLinksUiCopy(locale);

  return (
    <div className="w-full">
      <BG1 />

      {messages.NanoBananaVideo?.Hero && <NanoBananaHero />}

      <KeyFeatures />

      {messages.NanoBananaVideo?.Features && <NanoBananaFeatures />}

      <VideoGenerationDemo />

      <ImageGenerationDemo />

      {messages.NanoBananaVideo?.UseCases && <NanoBananaUseCases />}

      <InternalLinksSection
        eyebrow={copy.homeExplore.eyebrow}
        title={copy.homeExplore.title}
        description={copy.homeExplore.description}
        links={getLocalizedInternalLinks(locale, p0LandingPageIds)}
      />

      {messages.NanoBananaVideo?.Gallery && <NanoBananaGallery />}

      {messages.NanoBananaVideo?.Pricing && <NanoBananaPricing />}

      <InternalLinksSection
        eyebrow={copy.homeGuides.eyebrow}
        title={copy.homeGuides.title}
        description={copy.homeGuides.description}
        links={getLocalizedInternalLinks(locale, guidePageIds)}
      />

      {messages.NanoBananaVideo?.FAQ && <NanoBananaFAQ />}

      <InternalLinksSection
        eyebrow={copy.homeStart.eyebrow}
        title={copy.homeStart.title}
        description={copy.homeStart.description}
        links={getLocalizedInternalLinks(locale, ["promptGeneratorTool", "videoGenerationTool", "blog"])}
      />

      {messages.NanoBananaVideo?.CTA && <NanoBananaCTA />}
    </div>
  );
}
