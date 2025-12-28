"use client";

import { Label } from "@/components/ui/label";
import { KIE_VIDEO_MODELS } from "@/config/models";
import { cn } from "@/lib/utils";
import { VideoModel } from "./VideoGenerationPage";
import { GenerationTypeType, ImageToVideoMode } from "./GenerationTypeSelector";

interface VideoModelSelectorProps {
  selectedModel: VideoModel | null;
  onModelChange: (model: VideoModel) => void;
  generationType: GenerationTypeType;
  imageToVideoMode: ImageToVideoMode;
}

export function VideoModelSelector({
  selectedModel,
  onModelChange,
  generationType,
  imageToVideoMode,
}: VideoModelSelectorProps) {
  // Get available models based on generation type
  const getAvailableModels = (): VideoModel[] => {
    if (generationType === "text-to-video") {
      // Text to Video: Sora 2 only
      return KIE_VIDEO_MODELS.filter(
        (m) => m.id === "sora-2-text-to-video"
      ) as VideoModel[];
    }

    // Image to Video
    if (imageToVideoMode === "single") {
      // Single Image: Sora 2, Sora 2 Pro
      return KIE_VIDEO_MODELS.filter(
        (m) => m.id === "sora-2-image-to-video" || m.id === "sora-2-pro-image-to-video"
      ) as VideoModel[];
    } else {
      // Start/End Frame or Reference: Veo 3.1 Fast
      return KIE_VIDEO_MODELS.filter(
        (m) => m.id === "veo-3.1-fast"
      ) as VideoModel[];
    }
  };

  const models = getAvailableModels();

  if (models.length === 0) return null;

  // If only one model, show it as a label instead of buttons
  if (models.length === 1) {
    const model = models[0];
    return (
      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {model.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {generationType === "text-to-video" ? "Text to Video Mode" :
            imageToVideoMode === "startEnd" ? "Start & End Frame Mode" :
            imageToVideoMode === "reference" ? "Reference Images Mode" :
            "Single Image Mode"}
        </p>
      </div>
    );
  }

  // Multiple models: show as selectable buttons
  const getDisplayName = (modelId: string): string => {
    if (modelId.includes("pro")) return "Sora 2 Pro";
    if (modelId.includes("sora-2")) return "Sora 2";
    return modelId;
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-2 block">
        Model
      </Label>
      <div className="flex flex-wrap gap-2">
        {models.map((model) => (
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
            {getDisplayName(model.id)}
          </button>
        ))}
      </div>
    </div>
  );
}
