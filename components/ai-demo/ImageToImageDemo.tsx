"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IMAGE_TO_IMAGE_MODELS } from "@/config/models";
import { downloadBase64File } from "@/lib/downloadFile";
import { AlertTriangle, Download, FileUp, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { TaskProgress } from "@/components/kie/TaskProgress";

const parseModelValue = (value: string) => {
  const modelInfo = IMAGE_TO_IMAGE_MODELS.find(
    (m) => `${m.provider}/${m.id}` === value
  );
  if (!modelInfo) {
    if (IMAGE_TO_IMAGE_MODELS.length > 0) {
      return {
        provider: IMAGE_TO_IMAGE_MODELS[0].provider,
        modelId: IMAGE_TO_IMAGE_MODELS[0].id,
      };
    }
    throw new Error("No image-to-image models available");
  }
  return { provider: modelInfo.provider, modelId: modelInfo.id };
};

export default function ImageToImageDemo() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [seed, setSeed] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);

  const initialModelValue =
    IMAGE_TO_IMAGE_MODELS.length > 0
      ? `${IMAGE_TO_IMAGE_MODELS[0].provider}/${IMAGE_TO_IMAGE_MODELS[0].id}`
      : "";
  const [selectedModelValue, setSelectedModelValue] =
    useState(initialModelValue);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.onerror = () => {
        toast.error("Failed to read the image file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransform = async () => {
    if (!sourceImage || !prompt.trim()) {
      toast.warning("Please upload an image and provide a prompt.");
      return;
    }
    if (!selectedModelValue) {
      toast.warning("Please select a model.");
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading || taskId) {
      return;
    }

    setLoading(true);
    setResultImage(null);
    setError(null);
    setTaskId(null);
    setModelId(null);

    const { provider, modelId } = parseModelValue(selectedModelValue);
    const seedValue = seed.trim() === "" ? undefined : parseInt(seed, 10);

    if (seed.trim() !== "" && isNaN(seedValue as number)) {
      toast.error("Seed must be a valid integer number.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/ai-demo/image-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: sourceImage,
          prompt: prompt,
          seed: seedValue,
          modelId: modelId,
          provider: provider,
          wait: false, // Don't wait, return taskId for progress tracking
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to transform image");
      }

      // If taskId is returned, use progress tracking
      if (result.data?.taskId) {
        setTaskId(result.data.taskId);
        setModelId(result.data.modelId);
        setError(null);
      } else if (result.data?.imageUrl) {
        // Fallback: if imageUrl is returned directly (shouldn't happen with wait=false)
        setResultImage(result.data.imageUrl);
        setLoading(false);
      } else {
        throw new Error("API did not return a task ID or image URL.");
      }
    } catch (err: any) {
      console.error("API call failed:", err);
      const errorMessage = err.message || "Failed to transform image.";
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
    }
  };

  const removeImage = () => {
    setSourceImage(null);
    setResultImage(null);
    setError(null);
    setTaskId(null);
    setModelId(null);
  };

  const handleTaskComplete = (resultUrls: string[]) => {
    if (resultUrls && resultUrls.length > 0) {
      setResultImage(resultUrls[0]);
      setTaskId(null);
      setModelId(null);
      setLoading(false);
      toast.success("Image transformation completed!");
    }
  };

  const handleTaskError = (error: string) => {
    setError(error);
    setTaskId(null);
    setModelId(null);
    setLoading(false);
    toast.error(error);
  };

  const getModelDisplayName = (value: string) => {
    if (!value) return "Select a model";
    const { provider, modelId } = parseModelValue(value);
    const model = IMAGE_TO_IMAGE_MODELS.find(
      (m) => m.provider === provider && m.id === modelId
    );
    return model ? model.name : "Select a model";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTransform();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Image to Image</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Upload an image and provide a prompt to transform it using AI models.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="model-select"
              className="text-sm font-medium mb-2 block"
            >
              Choose Model
            </Label>
            <Select
              value={selectedModelValue}
              onValueChange={setSelectedModelValue}
              disabled={IMAGE_TO_IMAGE_MODELS.length === 0 || loading}
            >
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select a model">
                  {getModelDisplayName(selectedModelValue)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {IMAGE_TO_IMAGE_MODELS.length === 0 && (
                  <SelectItem value="no-models" disabled>
                    No models available
                  </SelectItem>
                )}
                {IMAGE_TO_IMAGE_MODELS.map((model) => (
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
            <Label
              htmlFor="prompt-input"
              className="text-sm font-medium mb-2 block"
            >
              Prompt
            </Label>
            <Textarea
              id="prompt-input"
              placeholder="Describe the transformation or target image..."
              className="min-h-24 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <div>
            <Label
              htmlFor="seed-input"
              className="text-sm font-medium mb-2 block"
            >
              Seed (Optional)
            </Label>
            <Input
              id="seed-input"
              type="number"
              placeholder="Enter an integer seed"
              value={seed}
              onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ""))}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              An integer for reproducible results, if supported by the model.
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">
              Upload Image
            </Label>
            {sourceImage ? (
              <div className="relative border rounded-md overflow-hidden h-64">
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 z-10 h-7 w-7"
                  onClick={removeImage}
                  disabled={loading}
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
              <label className="border-2 border-dashed rounded-md p-8 h-64 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
                <span className="text-muted-foreground text-sm text-center">
                  Click to upload or drag and drop
                  <br />
                  PNG, JPG, WEBP (max 5MB)
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
            onClick={handleTransform}
            disabled={
              loading || !sourceImage || !prompt.trim() || !selectedModelValue || !!taskId
            }
            className="w-full"
          >
            {loading || taskId ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transforming...
              </>
            ) : (
              "Transform Image"
            )}
          </Button>

          {/* Progress Display */}
          {taskId && modelId && (
            <TaskProgress
              taskId={taskId}
              type="image"
              modelId={modelId}
              onComplete={handleTaskComplete}
              onError={handleTaskError}
              pollInterval={15000}
              maxPolls={120}
            />
          )}
        </div>

        <div className="lg:col-span-2">
          <Label className="text-sm font-medium mb-2 block">Result</Label>
          <Card className="h-[calc(100%-28px)]">
            <CardContent className="p-4 h-full flex flex-col items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Transforming your image...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center text-center text-destructive">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Transformation Failed</p>
                  <p className="text-xs mt-1 px-4">{error}</p>
                </div>
              ) : resultImage ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px]">
                    <div className="relative border rounded-md overflow-hidden">
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
                        Original
                      </div>
                      <Image
                        src={sourceImage as string}
                        alt="Original"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="relative border rounded-md overflow-hidden">
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
                        Transformed
                      </div>
                      <Image
                        src={resultImage}
                        alt="Transformed"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadBase64File(resultImage, "transformed-image.png")
                      }
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Result
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground flex items-center justify-center h-full text-center">
                  {sourceImage
                    ? "Enter a prompt and click 'Transform'"
                    : "Upload an image to get started"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
