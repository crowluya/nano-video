"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type GenerationTypeType = "text-to-video" | "image-to-video";
export type ImageToVideoMode = "single" | "startEnd" | "reference";

interface GenerationTypeSelectorProps {
  generationType: GenerationTypeType;
  imageToVideoMode: ImageToVideoMode;
  onGenerationTypeChange: (type: GenerationTypeType) => void;
  onImageToVideoModeChange: (mode: ImageToVideoMode) => void;
}

export function GenerationTypeSelector({
  generationType,
  imageToVideoMode,
  onGenerationTypeChange,
  onImageToVideoModeChange,
}: GenerationTypeSelectorProps) {
  const t = useTranslations("NanoBananaVideo.VideoGeneration.generationType");

  return (
    <div className="space-y-3">
      {/* Generation Type - Text to Video / Image to Video */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          {t("label")}
        </Label>
        <div className="flex gap-2">
          <button
            onClick={() => onGenerationTypeChange("text-to-video")}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
              generationType === "text-to-video"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {t("textToVideo")}
          </button>
          <button
            onClick={() => onGenerationTypeChange("image-to-video")}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
              generationType === "image-to-video"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {t("imageToVideo")}
          </button>
        </div>
      </div>

      {/* Image to Video Mode - Only show when Image to Video is selected */}
      {generationType === "image-to-video" && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            {t("imageMode")}
          </Label>
          <div className="flex gap-1">
            <button
              onClick={() => onImageToVideoModeChange("single")}
              className={cn(
                "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                imageToVideoMode === "single"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {t("singleImage")}
            </button>
            <button
              onClick={() => onImageToVideoModeChange("startEnd")}
              className={cn(
                "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                imageToVideoMode === "startEnd"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {t("startEnd")}
            </button>
            <button
              onClick={() => onImageToVideoModeChange("reference")}
              className={cn(
                "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                imageToVideoMode === "reference"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {t("reference")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
