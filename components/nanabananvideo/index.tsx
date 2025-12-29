import NanoBananaCTA from "@/components/nanabananvideo/CTA";
import NanoBananaFAQ from "@/components/nanabananvideo/FAQ";
import NanoBananaFeatures from "@/components/nanabananvideo/Features";
import NanoBananaHero from "@/components/nanabananvideo/Hero";
import NanoBananaPricing from "@/components/nanabananvideo/Pricing";
import NanoBananaUseCases from "@/components/nanabananvideo/UseCases";
import VideoGenerationDemo from "@/components/nanabananvideo/VideoGenerationDemo";
import { VideoShowcase } from "@/components/nanabananvideo/VideoShowcase";
import { BG1 } from "@/components/shared/BGs";
import { getMessages } from "next-intl/server";

export default async function NanoBananaVideoPage() {
  const messages = await getMessages();

  // #region agent log
  console.log('[NanoBananaVideoPage] Messages check:', {
    hasNanoBananaVideo: !!messages.NanoBananaVideo,
    hasHero: !!messages.NanoBananaVideo?.Hero,
    hasFeatures: !!messages.NanoBananaVideo?.Features,
    hasVideoDemo: !!messages.NanoBananaVideo?.VideoDemo,
    hasUseCases: !!messages.NanoBananaVideo?.UseCases,
    hasPricing: !!messages.NanoBananaVideo?.Pricing,
    hasTestimonials: !!messages.NanoBananaVideo?.Testimonials,
    hasFAQ: !!messages.NanoBananaVideo?.FAQ,
    hasCTA: !!messages.NanoBananaVideo?.CTA,
    messageKeys: Object.keys(messages || {}),
  });
  fetch('http://127.0.0.1:7242/ingest/50c3a73e-ed9b-489d-9c57-b43ba19279a7', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'components/nanabananvideo/index.tsx:13', message: 'NanoBananaVideoPage entry', data: { hasNanoBananaVideo: !!messages.NanoBananaVideo, hasHero: !!messages.NanoBananaVideo?.Hero, hasFeatures: !!messages.NanoBananaVideo?.Features, hasVideoDemo: !!messages.NanoBananaVideo?.VideoDemo, hasUseCases: !!messages.NanoBananaVideo?.UseCases, hasPricing: !!messages.NanoBananaVideo?.Pricing, hasTestimonials: !!messages.NanoBananaVideo?.Testimonials, hasFAQ: !!messages.NanoBananaVideo?.FAQ, hasCTA: !!messages.NanoBananaVideo?.CTA, messageKeys: Object.keys(messages || {}) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
  // #endregion

  return (
    <div className="w-full">
      <BG1 />

      {messages.NanoBananaVideo?.Hero && <NanoBananaHero />}

      <VideoShowcase />

      {messages.NanoBananaVideo?.Features && <NanoBananaFeatures />}

      <VideoGenerationDemo />

      {messages.NanoBananaVideo?.UseCases && <NanoBananaUseCases />}

      {messages.NanoBananaVideo?.Pricing && <NanoBananaPricing />}

      {messages.NanoBananaVideo?.FAQ && <NanoBananaFAQ />}

      {messages.NanoBananaVideo?.CTA && <NanoBananaCTA />}
    </div>
  );
}

