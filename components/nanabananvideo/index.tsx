import NanoBananaCTA from "@/components/nanabananvideo/CTA";
import NanoBananaFAQ from "@/components/nanabananvideo/FAQ";
import NanoBananaFeatures from "@/components/nanabananvideo/Features";
import NanoBananaGallery from "@/components/nanabananvideo/Gallery";
import NanoBananaHero from "@/components/nanabananvideo/Hero";
import { KeyFeatures } from "@/components/nanabananvideo/KeyFeatures";
import NanoBananaPricing from "@/components/nanabananvideo/Pricing";
import NanoBananaUseCases from "@/components/nanabananvideo/UseCases";
import VideoGenerationDemo from "@/components/nanabananvideo/VideoGenerationDemo";
import ImageGenerationDemo from "@/components/nanabananvideo/ImageGenerationDemo";
import { BG1 } from "@/components/shared/BGs";
import { getMessages } from "next-intl/server";

export default async function NanoBananaVideoPage() {
  const messages = await getMessages();

  return (
    <div className="w-full">
      <BG1 />

      {messages.NanoBananaVideo?.Hero && <NanoBananaHero />}

      <KeyFeatures />

      {messages.NanoBananaVideo?.Features && <NanoBananaFeatures />}

      <VideoGenerationDemo />

      <ImageGenerationDemo />

      {messages.NanoBananaVideo?.UseCases && <NanoBananaUseCases />}

      {messages.NanoBananaVideo?.Gallery && <NanoBananaGallery />}

      {messages.NanoBananaVideo?.Pricing && <NanoBananaPricing />}

      {messages.NanoBananaVideo?.FAQ && <NanoBananaFAQ />}

      {messages.NanoBananaVideo?.CTA && <NanoBananaCTA />}
    </div>
  );
}

