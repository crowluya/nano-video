"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KIE_VIDEO_MODELS, type KieVideoModel } from "@/config/models";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { AlertCircle, Coins, Loader2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUploadZone } from "./ImageUploadZone";
import { StoryboardPromptGenerator } from "./StoryboardPromptGenerator";
import { VideoGenerationModeSelector } from "./VideoGenerationModeSelector";
import { VideoModelSelector } from "./VideoModelSelector";
import { VideoParameterPanel } from "./VideoParameterPanel";
import { VideoPreviewPanel } from "./VideoPreviewPanel";

export type VideoModel = KieVideoModel;
export type Veo3GenerationType = "TEXT_2_VIDEO" | "FIRST_AND_LAST_FRAMES_2_VIDEO" | "REFERENCE_2_VIDEO";
export type Sora2AspectRatio = "portrait" | "landscape";
export type Sora2Frames = "10" | "15";
export type Veo3AspectRatio = "16:9" | "9:16" | "Auto";

interface VideoGenerationParams {
  // Sora 2 parameters
  aspect_ratio?: Sora2AspectRatio;
  n_frames?: Sora2Frames;
  remove_watermark?: boolean;

  // Veo 3.1 parameters
  aspectRatio?: Veo3AspectRatio;
  seeds?: number;
  enableTranslation?: boolean;
}

export default function VideoGenerationPage() {
  const t = useTranslations("NanoBananaVideo.VideoGeneration");
  const { benefits, isLoading: isLoadingBenefits } = useUserBenefits();
  const [selectedModel, setSelectedModel] = useState<VideoModel | null>(
    KIE_VIDEO_MODELS.find(m => m.id === "sora-2-text-to-video") || KIE_VIDEO_MODELS[0] || null
  );

  const [generationMode, setGenerationMode] = useState<Veo3GenerationType | "text-to-video" | "image-to-video">("text-to-video");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [params, setParams] = useState<VideoGenerationParams>({
    aspect_ratio: "landscape",
    n_frames: "10",
    remove_watermark: true,
    aspectRatio: "16:9",
    enableTranslation: true,
  });

  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine if current model is Veo 3.1
  const isVeo3 = selectedModel?.id.startsWith("veo3");
  const isSora2 = selectedModel?.id.startsWith("sora-2");

  // Auto-set generation mode based on model and images
  const getEffectiveGenerationMode = (): string => {
    if (isVeo3) {
      if (generationMode === "REFERENCE_2_VIDEO" && images.length >= 2) {
        return "REFERENCE_2_VIDEO";
      }
      if (images.length >= 1) {
        return "FIRST_AND_LAST_FRAMES_2_VIDEO";
      }
      return "TEXT_2_VIDEO";
    }
    if (isSora2) {
      return images.length > 0 ? "image-to-video" : "text-to-video";
    }
    return "text-to-video";
  };

  const handleGenerate = async () => {
    if (!selectedModel) {
      toast.error("Please select a model");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!hasEnoughCredits()) {
      toast.error(`Insufficient credits. Required: ${getCreditsCost()}, Available: ${benefits?.totalAvailableCredits || 0}`);
      return;
    }

    const effectiveMode = getEffectiveGenerationMode();

    // Validate images based on mode
    if (effectiveMode === "image-to-video" || effectiveMode === "FIRST_AND_LAST_FRAMES_2_VIDEO") {
      if (images.length === 0) {
        toast.error("Please upload at least one image");
        return;
      }
    }

    if (effectiveMode === "REFERENCE_2_VIDEO") {
      if (images.length < 2) {
        toast.error("Reference to Video requires at least 2 images");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResultVideoUrl(null);
    setTaskId(null);

    try {
      const requestBody: any = {
        modelId: selectedModel.id,
        provider: selectedModel.provider,
        prompt: prompt.trim(),
        ...params,
      };

      // Add images if available
      if (images.length > 0) {
        requestBody.images = images;
      }

      // Add generation type for Veo 3.1
      if (isVeo3) {
        requestBody.generationType = effectiveMode;
      }

      const response = await fetch("/api/ai-demo/video-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to generate video");
      }

      // If async mode (taskId returned)
      if (result.data?.taskId) {
        setTaskId(result.data.taskId);
      } else if (result.data?.videoUrl) {
        // If sync mode (videoUrl returned directly)
        setResultVideoUrl(result.data.videoUrl);
        setLoading(false);
      } else {
        throw new Error("API did not return a video URL or task ID");
      }
    } catch (err: any) {
      console.error("Video generation failed:", err);
      const errorMessage = err.message || "Failed to generate video";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleVideoComplete = (videoUrls: string[]) => {
    if (videoUrls.length > 0) {
      setResultVideoUrl(videoUrls[0]);
    }
    setLoading(false);
  };

  const handleVideoError = (error: string) => {
    setError(error);
    setLoading(false);
  };

  const getCreditsCost = () => {
    if (!selectedModel) return 0;
    return selectedModel.creditsPerGeneration || 0;
  };

  const hasEnoughCredits = () => {
    if (!benefits || !selectedModel) return false;
    const required = getCreditsCost();
    return benefits.totalAvailableCredits >= required;
  };

  const canGenerate = () => {
    return !loading && selectedModel && prompt.trim() && hasEnoughCredits();
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 border-b border-purple-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold">{t("title")}</h1>
            <p className="text-sm opacity-90 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">{t("costPerGeneration")}</div>
            <div className="text-lg font-semibold">
              {selectedModel ? `${getCreditsCost()} credits` : t("selectModel")}
            </div>
            {benefits && (
              <div className="text-xs opacity-75 mt-1 flex items-center gap-1 justify-end">
                <Coins className="h-3 w-3" />
                <span>{t("availableCredits")}: {benefits.totalAvailableCredits}</span>
              </div>
            )}
          </div>
        </div>
        <VideoModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
        {/* Left Panel: Input Controls */}
        <div className="bg-muted/30 border-r border-border overflow-y-auto p-6 space-y-6">
          {/* Generation Mode Selector (for Veo 3.1) */}
          {isVeo3 && (
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                {t("generationType")}
              </Label>
              <VideoGenerationModeSelector
                selectedMode={generationMode as Veo3GenerationType}
                onModeChange={(mode) => setGenerationMode(mode)}
                supportedModes={selectedModel?.generationTypes || []}
              />
            </div>
          )}

          {/* Prompt Input */}
          <div>
            <Label htmlFor="prompt" className="text-sm font-semibold mb-2 block">
              {t("prompt")} *
            </Label>
            <Textarea
              id="prompt"
              placeholder={t("promptPlaceholder")}
              className="min-h-32 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t("promptDescription")}
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              {generationMode === "REFERENCE_2_VIDEO" ? t("referenceImages") : t("imageUpload")}
              {generationMode === "REFERENCE_2_VIDEO" && (
                <span className="text-xs text-muted-foreground ml-2">
                  (2-3 {t("imagesRequired")})
                </span>
              )}
            </Label>
            <ImageUploadZone
              images={images}
              onImagesChange={setImages}
              maxImages={generationMode === "REFERENCE_2_VIDEO" ? 3 : 1}
              disabled={loading}
            />
          </div>

          {/* Storyboard Prompt Generator */}
          {images.length > 0 && (
            <StoryboardPromptGenerator
              images={images}
              modelType={isVeo3 ? "veo3" : "sora2"}
              onPromptGenerated={(generatedPrompt) => setPrompt(generatedPrompt)}
            />
          )}

          {/* Parameters */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              {t("parameters")}
            </Label>
            <VideoParameterPanel
              model={selectedModel}
              generationMode={getEffectiveGenerationMode()}
              params={params}
              onParamsChange={setParams}
            />
          </div>

          {/* Credits Warning */}
          {benefits && !hasEnoughCredits() && selectedModel && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("insufficientCredits", { required: getCreditsCost(), available: benefits.totalAvailableCredits })}.{" "}
                <Link href="/pricing" className="underline font-medium">{t("getMoreCredits")}</Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {getCreditsCost()} {t("generate")}
              </>
            )}
          </Button>
        </div>

        {/* Right Panel: Video Preview */}
        <div className="lg:col-span-2 bg-black flex flex-col">
          <VideoPreviewPanel
            taskId={taskId}
            videoUrl={resultVideoUrl}
            loading={loading}
            error={error}
            modelId={selectedModel?.id}
            onComplete={handleVideoComplete}
            onError={handleVideoError}
          />
        </div>
      </div>
    </div>
  );
}

