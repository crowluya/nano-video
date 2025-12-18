import NanoBananaCTA from "@/components/nanabananvideo/CTA";
import NanoBananaFAQ from "@/components/nanabananvideo/FAQ";
import NanoBananaFeatures from "@/components/nanabananvideo/Features";
import NanoBananaHero from "@/components/nanabananvideo/Hero";
import NanoBananaPricing from "@/components/nanabananvideo/Pricing";
import NanoBananaTestimonials from "@/components/nanabananvideo/Testimonials";
import NanoBananaUseCases from "@/components/nanabananvideo/UseCases";
import VideoGenerationDemo from "@/components/nanabananvideo/VideoGenerationDemo";
import { BG1 } from "@/components/shared/BGs";
import { getMessages } from "next-intl/server";

export default async function NanoBananaVideoPage() {
  const messages = await getMessages();

  return (
    <div className="w-full">
      <BG1 />

      {messages.NanoBananaVideo?.Hero && <NanoBananaHero />}

      {messages.NanoBananaVideo?.Features && <NanoBananaFeatures />}

      {messages.NanoBananaVideo?.VideoDemo && <VideoGenerationDemo />}

      {messages.NanoBananaVideo?.UseCases && <NanoBananaUseCases />}

      {messages.NanoBananaVideo?.Pricing && <NanoBananaPricing />}

      {messages.NanoBananaVideo?.Testimonials && <NanoBananaTestimonials />}

      {messages.NanoBananaVideo?.FAQ && <NanoBananaFAQ />}

      {messages.NanoBananaVideo?.CTA && <NanoBananaCTA />}
    </div>
  );
}

