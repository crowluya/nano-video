"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_TO_IMAGE_MODELS } from "@/config/models";
import { downloadBase64File } from "@/lib/downloadFile";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

const parseModelValue = (value: string) => {
  const modelInfo = TEXT_TO_IMAGE_MODELS.find(
    (m) => `${m.provider}/${m.id}` === value
  );
  if (!modelInfo) {
    throw new Error("Invalid model value");
  }
  return { provider: modelInfo.provider, modelId: modelInfo.id };
};

export default function TextToImageDemo() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialModelValue = `${TEXT_TO_IMAGE_MODELS[0].provider}/${TEXT_TO_IMAGE_MODELS[0].id}`;
  const [selectedModelValue, setSelectedModelValue] =
    useState(initialModelValue);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setImageUrl("");
    setError(null);

    const { provider, modelId } = parseModelValue(selectedModelValue);

    try {
      const response = await fetch("/api/ai-demo/text-to-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
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
        throw new Error(result.error || "Failed to generate image");
      }

      if (result.data?.imageUrl) {
        setImageUrl(result.data.imageUrl);
      } else {
        throw new Error("API did not return an image URL.");
      }
    } catch (err: any) {
      console.error("API call failed:", err);
      const errorMessage = err.message || "Failed to generate image.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getModelDisplayName = (value: string) => {
    const { provider, modelId } = parseModelValue(value);
    const model = TEXT_TO_IMAGE_MODELS.find(
      (m) => m.provider === provider && m.id === modelId
    );
    return model ? model.name : "Select a model";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Text to Image</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Generate images from text descriptions using various AI models.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Choose Model
            </label>
            <Select
              value={selectedModelValue}
              onValueChange={setSelectedModelValue}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model">
                  {getModelDisplayName(selectedModelValue)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TEXT_TO_IMAGE_MODELS.map((model) => (
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
            <label className="text-sm font-medium mb-2 block">
              Image Description
            </label>
            <Textarea
              placeholder="Describe the image you want to generate..."
              className="min-h-32 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Image"
            )}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Generated Image</h3>
        <Card className="h-[calc(100%-28px)]">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Generating your image...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center text-center text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Generation Failed</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            ) : imageUrl ? (
              <div className="w-full h-full flex flex-col">
                <div className="relative flex-1 min-h-[200px]">
                  <Image
                    src={imageUrl}
                    alt="Generated image"
                    className="rounded-md object-contain"
                    fill
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadBase64File(imageUrl, "generate-image.png")
                    }
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center justify-center h-full text-center">
                Your generated image will appear here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
