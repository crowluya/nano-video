"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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

  const isSora2 = model.id.startsWith("sora-2");
  const isSora2Pro = model.id.startsWith("sora-2-pro");
  const isVeo3 = model.id.startsWith("veo-3");

  const updateParam = <K extends keyof VideoGenerationParams>(
    key: K,
    value: VideoGenerationParams[K]
  ) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Sora 2 Parameters */}
      {isSora2 && (
        <>
          {/* Aspect Ratio */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Aspect Ratio
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
                  {ratio === "portrait" ? "Portrait" : "Landscape"}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This parameter defines the aspect ratio of the video
            </p>
          </div>

          {/* Resolution (only for Sora 2 Pro) */}
          {isSora2Pro && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Resolution
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
                The resolution quality of the generated video
              </p>
            </div>
          )}

          {/* Resolution for Sora 2 (non-Pro) - 只显示 720p，样式跟 Pro 一样 */}
          {isSora2 && !isSora2Pro && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Resolution
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
                The resolution quality of the generated video
              </p>
            </div>
          )}

          {/* Duration / N Frames */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Duration
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
              The number of frames to be generated
            </p>
          </div>

          {/* Remove Watermark */}
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
            <div>
              <div className="font-medium text-sm mb-1">Remove Watermark</div>
              <div className="text-xs text-muted-foreground">
                When enabled, removes watermarks from the generated video
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
              Aspect Ratio
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
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Resolution
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
              Duration
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

