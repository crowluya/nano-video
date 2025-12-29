"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KIE_IMAGE_MODELS, type KieImageModel } from "@/config/models";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { cn } from "@/lib/utils";
import {
  Coins,
  Download,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageParameterPanel } from "./ImageParameterPanel";

export type ImageModel = KieImageModel;
export type ImageGenerationType = "text-to-image" | "image-to-image";
export type ImageAspectRatio = "1:1" | "9:16" | "16:9";
export type ImageResolution = "1K" | "2K" | "4K";

export interface ImageGenerationParams {
  aspectRatio?: ImageAspectRatio;
  resolution?: ImageResolution;
  speed?: "relaxed" | "fast" | "turbo";
}

export default function ImageGenerationPage() {
  const t = useTranslations("NanoBananaVideo.ImageGeneration");
  const { benefits } = useUserBenefits();

  // Generation Type State
  const [generationType, setGenerationType] = useState<ImageGenerationType>("text-to-image");

  // Model State
  const [selectedModel, setSelectedModel] = useState<ImageModel | null>(null);

  // Initialize model based on default generation type
  useEffect(() => {
    const defaultModel = KIE_IMAGE_MODELS.find(m => m.id === "google/nano-banana");
    if (defaultModel) setSelectedModel(defaultModel);
  }, []);

  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [params, setParams] = useState<ImageGenerationParams>({
    aspectRatio: "1:1",
    resolution: "1K",
    speed: "fast",
  });

  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMidjourney = selectedModel?.id === "midjourney";
  const isNanoBananaPro = selectedModel?.id === "nano-banana-pro";

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImages([result]);
    };
    reader.onerror = () => {
      toast.error("Failed to read the image file");
    };
    reader.readAsDataURL(file);
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

    if (generationType === "image-to-image" && images.length === 0) {
      toast.error("Please upload an image for image-to-image");
      return;
    }

    if (!hasEnoughCredits()) {
      toast.error(`Insufficient credits. Required: ${getCreditsCost()}, Available: ${benefits?.totalAvailableCredits || 0}`);
      return;
    }

    setLoading(true);
    setError(null);
    setResultImageUrl(null);
    setTaskId(null);

    try {
      const requestBody: any = {
        modelId: selectedModel.id,
        provider: selectedModel.provider,
        prompt: prompt.trim(),
        generationType,
        images: images.length > 0 ? images : undefined,
        ...params,
      };

      const response = await fetch("/api/ai-demo/image-generation", {
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
        throw new Error(result.error || "Failed to generate image");
      }

      if (result.data?.taskId) {
        setTaskId(result.data.taskId);
      } else if (result.data?.imageUrl) {
        setResultImageUrl(result.data.imageUrl);
        setLoading(false);
      } else {
        throw new Error("API did not return an image URL or task ID");
      }
    } catch (err: any) {
      console.error("Image generation failed:", err);
      const errorMessage = err.message || "Failed to generate image";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleImageComplete = (imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      setResultImageUrl(imageUrls[0]);
    }
    setLoading(false);
  };

  const handleImageError = (error: string) => {
    setError(error);
    setLoading(false);
  };

  // Calculate credits cost based on model and parameters
  const getCreditsCost = (): number => {
    if (!selectedModel) return 0;

    const baseCredits = selectedModel.creditsPerGeneration || 10;

    // Nano Banana Pro: 1K/2K = 30, 4K = 60
    if (isNanoBananaPro) {
      return params.resolution === "4K" ? 60 : 30;
    }

    // Midjourney: 80 credits
    if (isMidjourney) {
      return 80;
    }

    // Nano Banana: 15 credits
    return 15;
  };

  const hasEnoughCredits = () => {
    if (!benefits || !selectedModel) return false;
    const required = getCreditsCost();
    return benefits.totalAvailableCredits >= required;
  };

  const canGenerate = () => {
    return !loading && !!selectedModel && !!prompt.trim() && hasEnoughCredits();
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-pink-600 text-white p-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{t("title")}</h1>
            <p className="text-xs opacity-90">
              {t("subtitle")}
            </p>
          </div>
          {benefits && (
            <div className="text-right">
              <div className="text-sm flex items-center gap-1 justify-end">
                <Coins className="h-4 w-4" />
                <span>{t("availableCredits")}: {benefits.totalAvailableCredits}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Panel: Controls */}
        <div className="bg-muted/30 border-r border-border overflow-y-auto p-4 lg:w-[240px] lg:shrink-0 space-y-4">
          {/* Generation Type Selector */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              {t("generationType")}
            </Label>
            <div className="flex gap-2">
              <button
                onClick={() => setGenerationType("text-to-image")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md border-2 text-sm transition-all",
                  generationType === "text-to-image"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                <ImageIcon className="h-4 w-4 mx-auto mb-1" />
                {t("textToImage")}
              </button>
              <button
                onClick={() => setGenerationType("image-to-image")}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md border-2 text-sm transition-all",
                  generationType === "image-to-image"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                <Upload className="h-4 w-4 mx-auto mb-1" />
                {t("imageToImage")}
              </button>
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              {t("selectModel")}
            </Label>
            <div className="space-y-2">
              {KIE_IMAGE_MODELS
                .filter(m => m.id === "google/nano-banana" || m.id === "nano-banana-pro" || m.id === "midjourney")
                .map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 text-left transition-all",
                    selectedModel?.id === model.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className={cn(
                    "text-xs opacity-80 mt-1",
                    selectedModel?.id === model.id ? "opacity-90" : "text-muted-foreground"
                  )}>
                    {model.id === "google/nano-banana" && "15 credits"}
                    {model.id === "nano-banana-pro" && "30/60 credits (1K/2K/4K)"}
                    {model.id === "midjourney" && "80 credits"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload - Only for image-to-image */}
          {generationType === "image-to-image" && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                {t("referenceImage")}
              </Label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={loading}
                className="hidden"
                id="param-image-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFile(file);
                  }
                  e.currentTarget.value = "";
                }}
              />

              {images.length === 0 ? (
                <label
                  htmlFor="param-image-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Click to upload</span>
                </label>
              ) : (
                <div className="relative">
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-border">
                    <Image
                      src={images[0]}
                      alt="Reference"
                      width={200}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {!loading && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Parameters */}
          {selectedModel && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                {t("parameters")}
              </Label>
              <ImageParameterPanel
                model={selectedModel}
                generationType={generationType}
                params={params}
                onParamsChange={setParams}
              />
            </div>
          )}
        </div>

        {/* Right Panel: Preview + Prompt */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Preview Area */}
          <div className="flex-1 min-h-0 bg-black flex items-center justify-center p-4">
            {loading ? (
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">{t("generating")}</p>
                <p className="text-sm text-muted-foreground mt-2">{t("pleaseWait")}</p>
              </div>
            ) : resultImageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={resultImageUrl}
                  alt="Generated image"
                  width={800}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                />
                <Button
                  asChild
                  size="sm"
                  className="absolute top-4 right-4 gap-2"
                >
                  <a href={resultImageUrl} download="generated-image.png">
                    <Download className="h-4 w-4" />
                    {t("download")}
                  </a>
                </Button>
              </div>
            ) : error ? (
              <div className="text-center text-destructive">
                <p className="text-lg">{error}</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>{t("previewPlaceholder")}</p>
              </div>
            )}
          </div>

          {/* Prompt Area */}
          <div className="h-[120px] shrink-0 border-t border-border bg-background p-3 overflow-hidden">
            <div className="h-full flex gap-2">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("promptPlaceholder")}
                disabled={loading}
                className="flex-1 min-h-[40px] resize-none overflow-y-auto rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:ring-1 focus-visible:ring-primary"
              />
              <div className="flex flex-col justify-end gap-2 shrink-0">
                {benefits && !hasEnoughCredits() && selectedModel && (
                  <span className="text-[10px] text-destructive text-right">
                    {t("insufficientCredits", { required: getCreditsCost(), available: benefits.totalAvailableCredits })}
                  </span>
                )}
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate()}
                  className="h-10 px-4 text-sm whitespace-nowrap"
                  size="sm"
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
            </div>
          </div>
        </div>
      </div>

      {/* Polling for async results */}
      {taskId && loading && <ImagePolling
        taskId={taskId}
        modelId={selectedModel?.id || ""}
        onComplete={handleImageComplete}
        onError={handleImageError}
      />}
    </div>
  );
}

interface ImagePollingProps {
  taskId: string;
  modelId: string;
  onComplete: (urls: string[]) => void;
  onError: (error: string) => void;
}

function ImagePolling({ taskId, modelId, onComplete, onError }: ImagePollingProps) {
  useEffect(() => {
    let mounted = true;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5s interval

    const pollStatus = async () => {
      if (!mounted) return;

      attempts++;

      try {
        const response = await fetch("/api/ai-demo/image-generation/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, modelId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to check status");
        }

        if (result.success) {
          if (result.data?.imageUrl) {
            onComplete([result.data.imageUrl]);
            return;
          }

          if (result.data?.status === "completed" || result.data?.status === "success") {
            if (result.data?.imageUrls && result.data.imageUrls.length > 0) {
              onComplete(result.data.imageUrls);
              return;
            }
          }

          if (result.data?.status === "failed" || result.data?.status === "error") {
            onError(result.data?.error || "Generation failed");
            return;
          }
        }

        // Continue polling
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 5000);
        } else {
          onError("Generation timeout - please try again");
        }
      } catch (err: any) {
        console.error("Polling error:", err);
        if (attempts < maxAttempts) {
          setTimeout(pollStatus, 5000);
        } else {
          onError(err.message || "Failed to check generation status");
        }
      }
    };

    // Start polling after a short delay
    setTimeout(pollStatus, 2000);

    return () => {
      mounted = false;
    };
  }, [taskId, modelId, onComplete, onError]);

  return null;
}
