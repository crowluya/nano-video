"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ImageGenerationParams, ImageModel } from "./ImageGenerationPage";

interface ImageParameterPanelProps {
  model: ImageModel | null;
  generationType: string;
  params: ImageGenerationParams;
  onParamsChange: (params: ImageGenerationParams) => void;
}

export function ImageParameterPanel({
  model,
  generationType,
  params,
  onParamsChange,
}: ImageParameterPanelProps) {
  const t = useTranslations("NanoBananaVideo.ImageGeneration.parameterPanel");

  if (!model) return null;

  const isNanoBananaPro = model.id === "nano-banana-pro";
  const isMidjourney = model.id === "midjourney";

  const updateParam = <K extends keyof ImageGenerationParams>(
    key: K,
    value: ImageGenerationParams[K]
  ) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Aspect Ratio - Common for all models */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          {t("aspectRatio.label")}
        </Label>
        <div className="flex gap-2">
          {(() => {
            const ratios: Array<"1:1" | "16:9" | "9:16"> = ["1:1", "16:9", "9:16"];
            return ratios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => updateParam("aspectRatio", ratio)}
                className={cn(
                  "flex-1 min-w-[60px] px-2 py-2 rounded-md border-2 text-xs transition-all",
                  params.aspectRatio === ratio
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                {ratio}
              </button>
            ));
          })()}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t("aspectRatio.help")}
        </p>
      </div>

      {/* Resolution - Only for Nano Banana Pro */}
      {isNanoBananaPro && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            {t("resolution.label")}
          </Label>
          <div className="flex gap-2">
            <button
              onClick={() => updateParam("resolution", "1K")}
              className={cn(
                "flex-1 min-w-[60px] px-2 py-2 rounded-md border-2 text-xs transition-all",
                params.resolution === "1K"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              1K
            </button>
            <button
              onClick={() => updateParam("resolution", "2K")}
              className={cn(
                "flex-1 min-w-[60px] px-2 py-2 rounded-md border-2 text-xs transition-all",
                params.resolution === "2K"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              2K
            </button>
            <button
              onClick={() => updateParam("resolution", "4K")}
              className={cn(
                "flex-1 min-w-[60px] px-2 py-2 rounded-md border-2 text-xs transition-all",
                params.resolution === "4K"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              4K
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("resolution.help")}
          </p>
        </div>
      )}

      {/* Speed - Only for Midjourney */}
      {isMidjourney && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            {t("speed.label")}
          </Label>
          <div className="flex gap-2">
            {(() => {
              const speeds: Array<"relaxed" | "fast" | "turbo"> = ["relaxed", "fast", "turbo"];
              return speeds.map((speed) => (
                <button
                  key={speed}
                  onClick={() => updateParam("speed", speed)}
                  className={cn(
                    "flex-1 min-w-[60px] px-2 py-2 rounded-md border-2 text-xs transition-all capitalize",
                    params.speed === speed
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {speed}
                </button>
              ));
            })()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("speed.help")}
          </p>
        </div>
      )}
    </div>
  );
}
