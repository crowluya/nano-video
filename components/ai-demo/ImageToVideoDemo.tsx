"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IMAGE_TO_VIDEO_MODELS } from "@/config/models";
import { Download, FileUp, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

const downloadFileFromUrl = (url: string, filename: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ImageToVideoDemo() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(
    IMAGE_TO_VIDEO_MODELS[0]?.id
      ? `${IMAGE_TO_VIDEO_MODELS[0].provider}/${IMAGE_TO_VIDEO_MODELS[0].id}`
      : ""
  );
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<string>("5");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setResultVideo(null);
        setError(null);
      };
      reader.onerror = () => {
        toast.error("Failed to read the image file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const parseModelValue = (value: string) => {
    const parts = value.split("/");
    if (parts.length < 2) {
      if (IMAGE_TO_VIDEO_MODELS.length > 0) {
        return {
          provider: IMAGE_TO_VIDEO_MODELS[0].provider,
          modelId: IMAGE_TO_VIDEO_MODELS[0].id,
        };
      }
      throw new Error("No image-to-video models available");
    }
    const provider = parts[0];
    const modelId = parts.slice(1).join("/");
    return { provider, modelId };
  };

  const handleGenerate = async () => {
    if (!sourceImage) {
      toast.warning("Please upload a source image.");
      return;
    }
    if (!prompt.trim()) {
      toast.warning("Please enter a motion description prompt.");
      return;
    }
    if (!selectedModel) {
      toast.warning("Please select a model.");
      return;
    }

    setLoading(true);
    setResultVideo(null);
    setError(null);

    const { provider, modelId } = parseModelValue(selectedModel);
    const durationValue = parseInt(duration, 10);

    try {
      const response = await fetch("/api/ai-demo/image-to-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: sourceImage,
          prompt: prompt,
          duration: durationValue,
          modelId: modelId,
          provider: provider,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to generate video");
      }

      if (result.data?.videoUrl) {
        setResultVideo(result.data.videoUrl);
      } else {
        throw new Error("API did not return a video URL.");
      }
    } catch (err: any) {
      console.error("API call failed:", err);
      const errorMessage = err.message || "Failed to generate video.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setSourceImage(null);
    setResultVideo(null);
    setError(null);
  };

  const getModelDisplayName = (value: string) => {
    if (!value) return "Select a model";
    const { provider, modelId } = parseModelValue(value);
    const model = IMAGE_TO_VIDEO_MODELS.find(
      (m) => m.provider === provider && m.id === modelId
    );
    return model ? model.name : "Select a model";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Image to Video</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Animate still images into smooth, realistic videos with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="model-select"
              className="text-sm font-medium mb-2 block"
            >
              Choose Model
            </label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={IMAGE_TO_VIDEO_MODELS.length === 0 || loading}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select a model">
                  {getModelDisplayName(selectedModel)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {IMAGE_TO_VIDEO_MODELS.length === 0 && (
                  <SelectItem value="no-models" disabled>
                    No models available
                  </SelectItem>
                )}
                {IMAGE_TO_VIDEO_MODELS.map((model) => (
                  <SelectItem
                    key={`${model.provider}/${model.id}`}
                    value={`${model.provider}/${model.id}`}
                  >
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="prompt-input"
              className="text-sm font-medium mb-2 block"
            >
              Motion Description Prompt
            </label>
            <Textarea
              id="prompt-input"
              placeholder="Describe how the image should animate (e.g., 'Camera slowly zooms in while leaves gently blow in the wind')"
              className="min-h-24 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="duration-select"
              className="text-sm font-medium mb-2 block"
            >
              Duration (seconds)
            </label>
            <Select
              value={duration}
              onValueChange={setDuration}
              disabled={loading}
            >
              <SelectTrigger id="duration-select">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Upload Source Image
            </label>
            {sourceImage ? (
              <div className="relative border rounded-md overflow-hidden h-48">
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 z-10"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Image
                  src={sourceImage}
                  alt="Source image"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <label className="border-2 border-dashed rounded-md p-8 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
                <span className="text-muted-foreground text-sm text-center">
                  Upload an image to animate
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </label>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={
              loading || !sourceImage || !prompt.trim() || !selectedModel
            }
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              "Generate Video"
            )}
          </Button>
        </div>

        <div className="lg:col-span-2">
          <Label className="text-sm font-medium mb-2 block">Result Video</Label>
          <Card className="h-[calc(100%-28px)]">
            <CardContent className="p-4 h-full flex flex-col items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Generating video... This can take a few minutes.
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center text-center text-destructive">
                  <X className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Video Generation Failed</p>
                  <p className="text-xs mt-1 px-4">{error}</p>
                </div>
              ) : resultVideo ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 relative border rounded-md overflow-hidden bg-black">
                    <video
                      src={resultVideo}
                      controls
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      loop
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadFileFromUrl(resultVideo, "generated-video.mp4")
                      }
                      disabled={!resultVideo}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Video
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex items-center justify-center h-full text-center">
                  {sourceImage
                    ? "Enter a prompt and click 'Generate Video'"
                    : "Upload an image and provide a motion description"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
