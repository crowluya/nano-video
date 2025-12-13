"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Film, Sparkles, Download, ExternalLink, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ModelSelector, ModelCard } from "@/components/kie";
import { TaskProgress } from "@/components/kie";
import { KIE_VIDEO_MODELS } from "@/config/models";

interface GeneratedVideo {
  url: string;
  taskId: string;
}

export default function VideoGenPage() {
  const [modelId, setModelId] = useState("veo3_fast");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);

  const selectedModel = KIE_VIDEO_MODELS.find((m) => m.id === modelId);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const body: Record<string, unknown> = {
        modelId,
        prompt,
        aspectRatio,
      };

      if (imageUrl.trim()) {
        body.imageUrl = imageUrl;
      }

      const response = await fetch("/api/kie/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setActiveTaskId(result.data.taskId);
      toast.success("Video generation started! This may take a few minutes.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start generation");
      setIsGenerating(false);
    }
  };

  const handleComplete = useCallback((resultUrls: string[]) => {
    resultUrls.forEach((url) => {
      setGeneratedVideos((prev) => [
        { url, taskId: activeTaskId || "" },
        ...prev,
      ]);
    });
    setActiveTaskId(null);
    setIsGenerating(false);
    toast.success("Video generated!");
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
          <Film className="h-8 w-8" />
          Video Generation
        </h1>
        <p className="text-muted-foreground">
          Create stunning videos with AI - Sora 2 & Veo 3.1
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Selection */}
            <div>
              <Label>Select Model</Label>
              <ModelSelector
                type="video"
                value={modelId}
                onChange={setModelId}
                className="mt-2"
              />
            </div>

            {/* Prompt */}
            <div>
              <Label>Prompt</Label>
              <Textarea
                placeholder="Describe the video scene, motion, and atmosphere..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32"
              />
            </div>

            {/* Starting Image (Optional) */}
            <div>
              <Label>Starting Image URL (Optional)</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide an image URL for image-to-video generation
              </p>
            </div>

            {/* Aspect Ratio */}
            <div>
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  <SelectItem value="Auto">Auto</SelectItem>
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
                type="video"
                modelId={modelId}
                onComplete={handleComplete}
                onError={handleError}
                pollInterval={15000}
              />
            )}

            {/* Note about processing time */}
            <p className="text-xs text-muted-foreground text-center">
              Video generation typically takes 2-10 minutes depending on the model
            </p>
          </CardContent>
        </Card>

        {/* Generated Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Videos</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated videos will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedVideos.map((video, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border bg-black"
                  >
                    <video
                      src={video.url}
                      className="w-full aspect-video object-contain"
                      controls
                      muted
                      playsInline
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="icon" variant="secondary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <a href={video.url} download>
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

