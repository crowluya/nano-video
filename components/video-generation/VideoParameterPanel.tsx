"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { VideoGenerationParams, VideoModel } from "./VideoGenerationPage";

interface VideoParameterPanelProps {
  model: VideoModel | null;
  generationMode: string;
  params: VideoGenerationParams;
  onParamsChange: (params: VideoGenerationParams) => void;
}

export function VideoParameterPanel({
  model,
  generationMode,
  params,
  onParamsChange,
}: VideoParameterPanelProps) {
  if (!model) return null;

  const t = useTranslations("NanoBananaVideo.VideoGeneration.parameterPanel");

  const isSora2 = model.id.startsWith("sora-2");
  const isSora2Pro = model.id.startsWith("sora-2-pro");
  const isVeo3 = model.id.startsWith("veo-3");

  const updateParam = <K extends keyof VideoGenerationParams>(
    key: K,
    value: VideoGenerationParams[K]
  ) => {
    onParamsChange({ ...params, [key]: value });
  };

  const getAspectRatioLabel = (ratio: string) => {
    if (ratio === "portrait") return t("aspectRatio.portrait");
    if (ratio === "landscape") return t("aspectRatio.landscape");
    return ratio;
  };

  return (
    <div className="space-y-4">
      {/* Sora 2 Parameters */}
      {isSora2 && (
        <>
          {/* Aspect Ratio */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("aspectRatio.label")}
            </Label>
            <div className="flex gap-2">
              {model.aspectRatios?.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => updateParam("aspect_ratio", ratio as "portrait" | "landscape")}
                  className={cn(
                    "flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm transition-all",
                    params.aspect_ratio === ratio
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {getAspectRatioLabel(ratio)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("aspectRatio.help")}
            </p>
          </div>

          {/* Resolution (only for Sora 2 Pro) */}
          {isSora2Pro && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                {t("resolution.label")}
              </Label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateParam("size", "Standard")}
                  className={cn(
                    "flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm transition-all",
                    params.size === "Standard" || (!params.size && model.resolutions?.includes("720p"))
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  720p
                </button>
                <button
                  onClick={() => updateParam("size", "High")}
                  className={cn(
                    "flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm transition-all",
                    params.size === "High"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  1080p
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("resolution.help")}
              </p>
            </div>
          )}

          {/* Resolution for Sora 2 (non-Pro) - 只显示 720p，样式跟 Pro 一样 */}
          {isSora2 && !isSora2Pro && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                {t("resolution.label")}
              </Label>
              <div className="flex gap-2">
                <button
                  className="flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm bg-primary text-primary-foreground border-primary"
                >
                  720p
                </button>
                <button
                  disabled
                  className="flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm bg-background border-border text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  1080p
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("resolution.help")}
              </p>
            </div>
          )}

          {/* Duration / N Frames */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("duration.label")}
            </Label>
            <div className="flex gap-2">
              {model.durations?.map((duration) => (
                <button
                  key={duration}
                  onClick={() => updateParam("n_frames", duration as "10" | "15")}
                  className={cn(
                    "flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm transition-all",
                    params.n_frames === duration
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {duration}s
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("duration.help")}
            </p>
          </div>

          {/* Remove Watermark */}
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
            <div>
              <div className="font-medium text-sm mb-1">{t("removeWatermark.title")}</div>
              <div className="text-xs text-muted-foreground">
                {t("removeWatermark.description")}
              </div>
            </div>
            <Switch
              checked={params.remove_watermark ?? false}
              onCheckedChange={(checked) => updateParam("remove_watermark", checked)}
            />
          </div>
        </>
      )}

      {/* Veo 3.1 Parameters */}
      {isVeo3 && (
        <>
          {/* Aspect Ratio */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("aspectRatio.label")}
            </Label>
            <div className="flex gap-2">
              {model.aspectRatios?.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => updateParam("aspect_ratio", ratio as "portrait" | "landscape")}
                  className={cn(
                    "flex-1 px-2 py-2 rounded-md border-2 text-xs transition-all",
                    params.aspect_ratio === ratio
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {getAspectRatioLabel(ratio)}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("resolution.label")}
            </Label>
            <div className="flex gap-2">
              <button
                className={cn(
                  "flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm transition-all",
                  "bg-primary text-primary-foreground border-primary"
                )}
              >
                720p
              </button>
              <button
                disabled
                className={cn(
                  "flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm transition-all",
                  "bg-background border-border text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                1080p
              </button>
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {t("duration.label")}
            </Label>
            <div className="flex gap-2">
              <button
                className="flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm bg-primary text-primary-foreground border-primary"
              >
                8s
              </button>
              <button
                disabled
                className="flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm bg-background border-border text-muted-foreground opacity-50 cursor-not-allowed"
              >
                -
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

