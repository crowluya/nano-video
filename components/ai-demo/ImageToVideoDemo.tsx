"use client";

import { useLocale } from "next-intl";

export default function ImageToVideoDemo() {
  const locale = useLocale();

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Text/Image to Video</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Generate videos using Sora 2 and Veo 3.1 AI models. Support Text to Video, Image to Video, and Reference to Video.
        </p>
      </div>

      <div className="w-full h-[800px] border rounded-lg overflow-hidden">
        <iframe
          src={`/${locale}/video-generation`}
          className="w-full h-full border-0"
          title="Video Generation"
          allow="camera; microphone; fullscreen"
        />
      </div>
    </div>
  );
}
