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
import { KIE_VIDEO_MODELS, type KieVideoModel } from "@/config/models";
import { useUserBenefits } from "@/hooks/useUserBenefits";
import { cn } from "@/lib/utils";
import {
  Coins,
  Loader2,
  Sparkles,
  Upload,
  X,
  Zap,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { VideoModelSelector } from "./VideoModelSelector";
import { VideoParameterPanel } from "./VideoParameterPanel";
import { VideoPreviewPanel } from "./VideoPreviewPanel";
import { GenerationTypeSelector, GenerationTypeType, ImageToVideoMode } from "./GenerationTypeSelector";

export type VideoModel = KieVideoModel;
export type Sora2AspectRatio = "portrait" | "landscape";
export type Sora2Frames = "10" | "15";
export type Sora2Size = "Standard" | "High"; // Standard = 720p, High = 1080p

export interface VideoGenerationParams {
  // Sora 2 parameters
  aspect_ratio?: Sora2AspectRatio;
  n_frames?: Sora2Frames;
  size?: Sora2Size;
  remove_watermark?: boolean;
}

interface ChatBotPromptBoxProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  images: string[];
  onImagesChange: (images: string[]) => void;
  loading: boolean;
  modelType: "sora2" | "veo3";
  showInsufficientCredits: boolean;
  insufficientCreditsText: string;
  creditsLinkText: string;
  onGenerate: () => void;
  canGenerate: boolean;
  generateLabel: string;
  optimizingLabel: string;
  placeholder: string;
  promptLabel: string;
}

function ChatBotPromptBox({
  prompt,
  onPromptChange,
  images,
  onImagesChange,
  loading,
  modelType,
  showInsufficientCredits,
  insufficientCreditsText,
  creditsLinkText,
  onGenerate,
  canGenerate,
  generateLabel,
  optimizingLabel,
  placeholder,
  promptLabel,
}: ChatBotPromptBoxProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

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
      onImagesChange([result]);
    };
    reader.onerror = () => {
      toast.error("Failed to read the image file");
    };
    reader.readAsDataURL(file);
  };

  const handleOptimizePrompt = async () => {
    if (optimizing || loading) return;
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setOptimizing(true);
    try {
      const response = await fetch("/api/ai-demo/generate-storyboard-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          mode: "fast",
          modelType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate prompt");
      }
      if (!data.prompt) {
        throw new Error("No prompt returned");
      }
      onPromptChange(data.prompt);
      toast.success("Prompt optimized");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to optimize prompt";
      toast.error(errorMessage);
    } finally {
      setOptimizing(false);
    }
  };

  const openPreview = (src: string) => {
    setPreviewImage(src);
    setPreviewScale(1);
    setPreviewOpen(true);
  };

  return (
    <div className="h-full flex gap-2 overflow-hidden">
      {/* 左侧 Prompt 标签和 Optimize 按钮 */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <Label className="text-sm font-medium">{promptLabel}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOptimizePrompt}
            disabled={loading || optimizing || images.length === 0}
            className="gap-1 h-6 text-xs text-muted-foreground hover:text-foreground"
          >
            {optimizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {optimizing ? optimizingLabel : "Optimize"}
          </Button>
        </div>

        {/* 文本输入区域 */}
        <div className="flex-1 min-h-0 flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 min-h-[40px] resize-none overflow-y-auto rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />

          <div className="flex flex-col justify-end gap-1 shrink-0">
            {showInsufficientCredits && (
              <span className="text-[10px] text-destructive max-w-[100px] text-right">
                <Link href="/pricing" className="underline">{creditsLinkText}</Link>
              </span>
            )}

            <Button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="h-8 px-3 text-xs"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  {generateLabel}
                </>
              ) : (
                <>
                  <Zap className="mr-1 h-3 w-3" />
                  {generateLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={previewScale}
                  onChange={(e) => setPreviewScale(Number(e.target.value))}
                  className="w-full"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative w-full h-[60vh] overflow-auto rounded-lg border border-border bg-black/5">
                <div className="w-full h-full flex items-center justify-center p-4">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    width={1200}
                    height={800}
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${previewScale})`, transformOrigin: "center center" }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VideoGenerationPage() {
  const t = useTranslations("NanoBananaVideo.VideoGeneration");
  const { benefits } = useUserBenefits();

  // Generation Type State
  const [generationType, setGenerationType] = useState<GenerationTypeType>("text-to-video");
  const [imageToVideoMode, setImageToVideoMode] = useState<ImageToVideoMode>("single");

  // Model State - initially null, will be set by effect
  const [selectedModel, setSelectedModel] = useState<VideoModel | null>(null);

  // Initialize model based on default generation type
  useEffect(() => {
    const defaultModel = KIE_VIDEO_MODELS.find(m => m.id === "sora-2-text-to-video");
    if (defaultModel) setSelectedModel(defaultModel);
  }, []);

  // Update model when generation type or image mode changes
  useEffect(() => {
    if (generationType === "text-to-video") {
      // Text to Video: Sora 2
      const sora2Model = KIE_VIDEO_MODELS.find(m => m.id === "sora-2-text-to-video");
      if (sora2Model) setSelectedModel(sora2Model);
    } else {
      // Image to Video
      if (imageToVideoMode === "single") {
        // Single Image: Sora 2 (default)
        const sora2Model = KIE_VIDEO_MODELS.find(m => m.id === "sora-2-image-to-video");
        if (sora2Model) setSelectedModel(sora2Model);
      } else {
        // Start/End Frame or Reference: Veo 3.1 Fast
        const veoModel = KIE_VIDEO_MODELS.find(m => m.id === "veo-3.1-fast");
        if (veoModel) setSelectedModel(veoModel);
      }
    }
  }, [generationType, imageToVideoMode]);

  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  // 首位帧模式的图片
  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);
  // 参考图模式的图片
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const [params, setParams] = useState<VideoGenerationParams>({
    aspect_ratio: "landscape",
    n_frames: "10",
    size: "Standard", // Default to 720p
    remove_watermark: true,
  });

  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSora2 = selectedModel?.id.startsWith("sora-2");
  const isVeo3 = selectedModel?.id.startsWith("veo-3");

  // Auto-set generation mode based on model and images
  const getEffectiveGenerationMode = (): string => {
    if (generationType === "text-to-video") {
      return "text-to-video";
    }

    // Image to Video
    if (imageToVideoMode === "single") {
      return "image-to-video";
    } else if (imageToVideoMode === "startEnd") {
      return "start-end-frame-to-video";
    } else if (imageToVideoMode === "reference") {
      return "reference-to-video";
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
    if (generationType === "image-to-video") {
      if (imageToVideoMode === "single") {
        if (images.length === 0) {
          toast.error("Please upload at least one image");
          return;
        }
      } else if (imageToVideoMode === "startEnd") {
        if (!startImage || !endImage) {
          toast.error("Please upload start and end frames");
          return;
        }
      } else if (imageToVideoMode === "reference") {
        if (referenceImages.length === 0) {
          toast.error("Please upload at least one reference image");
          return;
        }
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

      // Veo 3.1 Fast: 固定 720p / 8s，仅发送必要字段
      if (isVeo3) {
        const veoAspectRatio = params.aspect_ratio === "portrait" ? "9:16" : "16:9";
        requestBody.aspectRatio = veoAspectRatio;

        if (imageToVideoMode === "startEnd") {
          requestBody.generationType = "FIRST_AND_LAST_FRAMES_2_VIDEO";
          requestBody.images = [startImage, endImage].filter(Boolean);
        } else if (imageToVideoMode === "reference") {
          requestBody.generationType = "REFERENCE_2_VIDEO";
          requestBody.images = referenceImages;
        } else {
          // Single image mode with Veo
          requestBody.generationType = "IMAGE_2_VIDEO";
          requestBody.images = images;
        }

        // 清理 Sora 2 参数避免后端/模型误用
        delete requestBody.aspect_ratio;
        delete requestBody.n_frames;
        delete requestBody.size;
        delete requestBody.remove_watermark;
      } else {
        // Sora 2: Add images if available (for image-to-video mode)
        if (generationType === "image-to-video" && imageToVideoMode === "single" && images.length > 0) {
          requestBody.images = images;
        }
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

  // Calculate credits cost dynamically based on model, resolution, and duration
  const calculateCreditsCost = (
    modelId: string,
    size: 'Standard' | 'High' | undefined,
    duration: '10' | '15' | undefined
  ): number => {
    const isVeo = modelId.startsWith('veo-') || modelId.startsWith('veo3') || modelId.includes('veo');
    if (isVeo) {
      return 100;
    }

    const isPro = modelId.includes('pro');
    const resolution = size === 'High' ? '1080p' : '720p';
    const dur = duration || '10';

    if (!isPro) {
      // Sora 2 (Fast): 720p 10s = 80 credits, 15s = 120 credits
      return dur === '10' ? 80 : 120;
    }

    // Sora 2 Pro (Quality)
    if (resolution === '720p') {
      return dur === '10' ? 150 : 300;
    } else {
      // 1080p
      return dur === '10' ? 300 : 600;
    }
  };

  const getCreditsCost = () => {
    if (!selectedModel) return 0;
    return calculateCreditsCost(selectedModel.id, params.size, params.n_frames);
  };

  const hasEnoughCredits = () => {
    if (!benefits || !selectedModel) return false;
    const required = getCreditsCost();
    return benefits.totalAvailableCredits >= required;
  };

  const canGenerate = () => {
    return !loading && !!selectedModel && !!prompt.trim() && hasEnoughCredits();
  };

  useEffect(() => {
    if (!isVeo3) return;
    if (params.size !== 'Standard' || params.n_frames !== '15') {
      setParams(prev => ({
        ...prev,
        size: 'Standard',
        n_frames: '15',
      }));
    }
  }, [isVeo3, params.size, params.n_frames]);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header - 简洁版 */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 shrink-0">
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

      {/* Main Layout - 左右分栏 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Panel: Generation Type + Model + Parameters */}
        <div className="bg-muted/30 border-r border-border overflow-y-auto p-4 lg:w-[220px] lg:shrink-0 space-y-4">
          {/* Generation Type Selector */}
          <GenerationTypeSelector
            generationType={generationType}
            imageToVideoMode={imageToVideoMode}
            onGenerationTypeChange={setGenerationType}
            onImageToVideoModeChange={setImageToVideoMode}
          />

          {/* Model Selector */}
          {selectedModel && (
            <VideoModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              generationType={generationType}
              imageToVideoMode={imageToVideoMode}
            />
          )}

          {/* 图片上传区域 - 只在 Image to Video 模式显示 */}
          {generationType === "image-to-video" && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                {imageToVideoMode === "single" ? "Reference Image" :
                  imageToVideoMode === "startEnd" ? "Start & End Frames" : "Reference Images"}
              </Label>

              {/* 单图模式 */}
              {imageToVideoMode === "single" && (
                <>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={loading}
                    className="hidden"
                    id="param-image-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
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
                          setImages([reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.currentTarget.value = "";
                    }}
                  />

                  {images.length === 0 ? (
                    <label
                      htmlFor="param-image-upload"
                      className={cn(
                        "flex flex-col items-center justify-center w-full h-16 rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors",
                        loading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                    </label>
                  ) : (
                    <div className="relative">
                      <div className="w-full h-16 rounded-lg overflow-hidden border border-border">
                        <Image
                          src={images[0]}
                          alt="Reference"
                          width={200}
                          height={64}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: for image-to-video
                  </p>
                </>
              )}

              {/* 首位帧模式 */}
              {imageToVideoMode === "startEnd" && (
                <div className="space-y-2">
                  {/* Start Frame */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Start Frame</p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={loading}
                      className="hidden"
                      id="start-frame-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("File size exceeds 10MB limit");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setStartImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                        e.currentTarget.value = "";
                      }}
                    />
                    {!startImage ? (
                      <label
                        htmlFor="start-frame-upload"
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-14 rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors",
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Upload className="h-3 w-3 text-muted-foreground mb-0.5" />
                        <span className="text-xs text-muted-foreground">Start</span>
                      </label>
                    ) : (
                      <div className="relative">
                        <div className="w-full h-14 rounded-lg overflow-hidden border border-border">
                          <Image src={startImage} alt="Start" width={200} height={56} className="w-full h-full object-cover" />
                        </div>
                        {!loading && (
                          <button type="button" onClick={() => setStartImage(null)} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* End Frame */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">End Frame</p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={loading}
                      className="hidden"
                      id="end-frame-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("File size exceeds 10MB limit");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEndImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                        e.currentTarget.value = "";
                      }}
                    />
                    {!endImage ? (
                      <label
                        htmlFor="end-frame-upload"
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-14 rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors",
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Upload className="h-3 w-3 text-muted-foreground mb-0.5" />
                        <span className="text-xs text-muted-foreground">End</span>
                      </label>
                    ) : (
                      <div className="relative">
                        <div className="w-full h-14 rounded-lg overflow-hidden border border-border">
                          <Image src={endImage} alt="End" width={200} height={56} className="w-full h-full object-cover" />
                        </div>
                        {!loading && (
                          <button type="button" onClick={() => setEndImage(null)} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 参考图模式 */}
              {imageToVideoMode === "reference" && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={loading}
                    className="hidden"
                    id="reference-images-upload"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        Array.from(files).forEach(file => {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error("File size exceeds 10MB limit");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setReferenceImages(prev => [...prev, reader.result as string].slice(0, 4));
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                      e.currentTarget.value = "";
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {referenceImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <div className="w-full h-14 rounded-lg overflow-hidden border border-border">
                          <Image src={img} alt={`Ref ${idx + 1}`} width={100} height={56} className="w-full h-full object-cover" />
                        </div>
                        {!loading && (
                          <button type="button" onClick={() => setReferenceImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {referenceImages.length < 4 && (
                      <label
                        htmlFor="reference-images-upload"
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-14 rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors",
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Upload className="h-3 w-3 text-muted-foreground mb-0.5" />
                        <span className="text-xs text-muted-foreground">Add</span>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Up to 4 reference images
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 参数面板 */}
          {selectedModel && (
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
          )}
        </div>

        {/* Right Panel: Preview (Top) + Prompt (Bottom) */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* 预览区域 */}
          <div className="flex-1 min-h-0 bg-black">
            <VideoPreviewPanel
              taskId={taskId}
              videoUrl={resultVideoUrl}
              loading={loading}
              error={error}
              modelId={selectedModel?.id?.startsWith("veo-") ? "veo3_fast" : selectedModel?.id}
              onComplete={handleVideoComplete}
              onError={handleVideoError}
            />
          </div>

          {/* Prompt 区域 - 调整高度 */}
          <div className="h-[130px] shrink-0 border-t border-border bg-background p-3 overflow-hidden">
            <ChatBotPromptBox
              prompt={prompt}
              onPromptChange={setPrompt}
              images={images}
              onImagesChange={setImages}
              loading={loading}
              modelType={isVeo3 ? "veo3" : "sora2"}
              showInsufficientCredits={!!benefits && !hasEnoughCredits() && !!selectedModel}
              insufficientCreditsText={t("insufficientCredits", { required: getCreditsCost(), available: benefits?.totalAvailableCredits || 0 }) + "."}
              creditsLinkText={t("getMoreCredits")}
              onGenerate={handleGenerate}
              canGenerate={canGenerate()}
              generateLabel={loading ? t("generating") : `${getCreditsCost()} ${t("generate")}`}
              optimizingLabel={t("generating")}
              placeholder={t("promptPlaceholder")}
              promptLabel={t("prompt")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
