"use client";

import { VideoModel } from "./VideoGenerationPage";
import { KIE_VIDEO_MODELS } from "@/config/models";
import { cn } from "@/lib/utils";

interface VideoModelSelectorProps {
  selectedModel: VideoModel | null;
  onModelChange: (model: VideoModel) => void;
}

export function VideoModelSelector({
  selectedModel,
  onModelChange,
}: VideoModelSelectorProps) {
  const sora2Models = KIE_VIDEO_MODELS.filter(m => m.id.startsWith("sora-2"));
  const veo3Models = KIE_VIDEO_MODELS.filter(m => m.id.startsWith("veo3"));

  return (
    <div className="flex flex-wrap gap-2">
      <div className="w-full mb-2">
        <div className="text-xs uppercase tracking-wider opacity-75 mb-2">Sora 2</div>
        <div className="flex flex-wrap gap-2">
          {sora2Models.map((model) => (
            <button
              key={model.id}
              onClick={() => onModelChange(model)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-all",
                selectedModel?.id === model.id
                  ? "bg-white text-purple-600 border-white font-semibold"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              )}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="w-full">
        <div className="text-xs uppercase tracking-wider opacity-75 mb-2">Veo 3.1</div>
        <div className="flex flex-wrap gap-2">
          {veo3Models.map((model) => (
            <button
              key={model.id}
              onClick={() => onModelChange(model)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md border transition-all",
                selectedModel?.id === model.id
                  ? "bg-white text-purple-600 border-white font-semibold"
                  : "bg-white/10 border-white/20 hover:bg-white/20"
              )}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

