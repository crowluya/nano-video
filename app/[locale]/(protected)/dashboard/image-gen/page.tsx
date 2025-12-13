"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image, Sparkles, Download, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ModelSelector, ModelCard } from "@/components/kie";
import { TaskProgress } from "@/components/kie";
import { KIE_IMAGE_MODELS } from "@/config/models";

interface GeneratedImage {
  url: string;
  taskId: string;
}

export default function ImageGenPage() {
  const [modelId, setModelId] = useState("google/nano-banana");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const selectedModel = KIE_IMAGE_MODELS.find((m) => m.id === modelId);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/kie/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          prompt,
          aspectRatio,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setActiveTaskId(result.data.taskId);
      toast.success("Image generation started!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start generation");
      setIsGenerating(false);
    }
  };

  const handleComplete = useCallback((resultUrls: string[]) => {
    resultUrls.forEach((url) => {
      setGeneratedImages((prev) => [
        { url, taskId: activeTaskId || "" },
        ...prev,
      ]);
    });
    setActiveTaskId(null);
    setIsGenerating(false);
    toast.success("Image generated!");
  }, [activeTaskId]);

  const handleError = useCallback(() => {
    setActiveTaskId(null);
    setIsGenerating(false);
    toast.error("Generation failed");
  }, []);

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image className="h-8 w-8" />
          Image Generation
        </h1>
        <p className="text-muted-foreground">
          Generate stunning images with AI models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Selection */}
            <div>
              <Label>Select Model</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {KIE_IMAGE_MODELS.slice(0, 4).map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={modelId === model.id}
                    onSelect={() => setModelId(model.id)}
                  />
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <Label>Prompt</Label>
              <Textarea
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32"
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  <SelectItem value="4:3">Standard (4:3)</SelectItem>
                  <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate ({selectedModel?.creditsPerGeneration} credits)
                </>
              )}
            </Button>

            {/* Active Task Progress */}
            {activeTaskId && (
              <TaskProgress
                taskId={activeTaskId}
                type="image"
                modelId={modelId}
                onComplete={handleComplete}
                onError={handleError}
              />
            )}
          </CardContent>
        </Card>

        {/* Generated Images */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Images</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedImages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated images will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border"
                  >
                    <img
                      src={img.url}
                      alt={`Generated ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="icon" variant="secondary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <a href={img.url} download>
                        <Button size="icon" variant="secondary">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

