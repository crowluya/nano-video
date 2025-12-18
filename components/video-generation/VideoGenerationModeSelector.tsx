"use client";

import { Veo3GenerationType } from "./VideoGenerationPage";
import { cn } from "@/lib/utils";

interface VideoGenerationModeSelectorProps {
  selectedMode: Veo3GenerationType;
  onModeChange: (mode: Veo3GenerationType) => void;
  supportedModes: readonly Veo3GenerationType[];
}

const modeLabels: Record<Veo3GenerationType, string> = {
  TEXT_2_VIDEO: "Text to Video",
  FIRST_AND_LAST_FRAMES_2_VIDEO: "Image to Video",
  REFERENCE_2_VIDEO: "Reference to Video",
};

export function VideoGenerationModeSelector({
  selectedMode,
  onModeChange,
  supportedModes,
}: VideoGenerationModeSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {supportedModes.map((mode) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={cn(
            "flex-1 min-w-[120px] px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
            selectedMode === mode
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:border-primary/50"
          )}
        >
          {modeLabels[mode]}
        </button>
      ))}
    </div>
  );
}

