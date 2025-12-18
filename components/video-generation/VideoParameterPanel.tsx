"use client";

import { VideoModel, VideoGenerationParams } from "./VideoGenerationPage";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
  const isVeo3 = model.id.startsWith("veo3");

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
                  onClick={() => updateParam("aspectRatio", ratio as "16:9" | "9:16" | "Auto")}
                  className={cn(
                    "flex-1 min-w-[80px] px-3 py-2 rounded-md border-2 text-sm transition-all",
                    params.aspectRatio === ratio
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Seed (Optional) */}
          <div>
            <Label htmlFor="seed" className="text-xs text-muted-foreground mb-2 block">
              Seed (Optional)
            </Label>
            <Input
              id="seed"
              type="number"
              placeholder="Please input seed"
              value={params.seeds || ""}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                updateParam("seeds", value);
              }}
              className="w-full"
            />
          </div>

          {/* Enable Translation */}
          <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
            <div>
              <div className="font-medium text-sm mb-1">Enable Translation</div>
              <div className="text-xs text-muted-foreground">
                Automatically translate prompt if needed
              </div>
            </div>
            <Switch
              checked={params.enableTranslation ?? true}
              onCheckedChange={(checked) => updateParam("enableTranslation", checked)}
            />
          </div>
        </>
      )}
    </div>
  );
}

