"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Image,
  Film,
  Music,
  Wand2,
  Loader2,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { ModelSelector } from "@/components/kie";
import { TaskProgress } from "@/components/kie";
import { AssetLibrary } from "@/components/kie";
import { Asset, createEmptyProject, EditProject } from "@/lib/remotion/types";
import { cn } from "@/lib/utils";

type WorkflowStep = "prompt" | "image" | "video" | "music" | "edit";

interface GenerationTask {
  id: string;
  taskId: string;
  type: "image" | "video" | "music";
  modelId: string;
  status: "pending" | "processing" | "success" | "failed";
}

export default function StudioPage() {
  // Workflow state
  const [activeStep, setActiveStep] = useState<WorkflowStep>("prompt");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [project, setProject] = useState<EditProject>(createEmptyProject());

  // Prompt step state
  const [userIdea, setUserIdea] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Image step state
  const [imageModelId, setImageModelId] = useState("google/nano-banana");
  const [imagePrompt, setImagePrompt] = useState("");

  // Video step state
  const [videoModelId, setVideoModelId] = useState("veo3_fast");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<string | null>(null);

  // Music step state
  const [musicModelId, setMusicModelId] = useState("V4");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicStyle, setMusicStyle] = useState("");

  // Generate prompt from user idea
  const handleGeneratePrompt = async () => {
    if (!userIdea.trim()) {
      toast.error("Please describe your idea first");
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const response = await fetch("/api/ai-demo/single-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are an expert at creating prompts for AI image and video generation. 
Based on the user's idea, create a detailed, high-quality prompt that will produce stunning visuals.

User's idea: "${userIdea}"

Create a prompt that includes:
- Specific visual details (lighting, colors, atmosphere)
- Style or artistic direction
- Camera angle or perspective if relevant
- Quality modifiers

Respond with ONLY the prompt, no explanations.`,
          modelId: "openai/gpt-4o-mini",
          provider: "openrouter",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prompt");
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value);
        }
      }

      // Parse the streamed response
      const lines = result.split("\n").filter((l) => l.startsWith("0:"));
      const content = lines
        .map((l) => {
          try {
            return JSON.parse(l.slice(2));
          } catch {
            return "";
          }
        })
        .join("");

      setGeneratedPrompt(content || result);
      setImagePrompt(content || result);
      setVideoPrompt(content || result);
      toast.success("Prompt generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate prompt");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Generate image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const response = await fetch("/api/kie/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: imageModelId,
          prompt: imagePrompt,
          aspectRatio: "16:9",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      const taskId = result.data.taskId;
      const newTask: GenerationTask = {
        id: `task-${Date.now()}`,
        taskId,
        type: "image",
        modelId: imageModelId,
        status: "pending",
      };

      setTasks((prev) => [...prev, newTask]);
      toast.success("Image generation started!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start image generation");
    }
  };

  // Generate video
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const body: Record<string, unknown> = {
        modelId: videoModelId,
        prompt: videoPrompt,
        aspectRatio: "16:9",
      };

      if (selectedImageForVideo) {
        body.imageUrl = selectedImageForVideo;
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

      const taskId = result.data.taskId;
      const newTask: GenerationTask = {
        id: `task-${Date.now()}`,
        taskId,
        type: "video",
        modelId: videoModelId,
        status: "pending",
      };

      setTasks((prev) => [...prev, newTask]);
      toast.success("Video generation started!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start video generation");
    }
  };

  // Generate music
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const response = await fetch("/api/kie/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          modelId: musicModelId,
          prompt: musicPrompt,
          style: musicStyle || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      const taskId = result.data.taskId;
      const newTask: GenerationTask = {
        id: `task-${Date.now()}`,
        taskId,
        type: "music",
        modelId: musicModelId,
        status: "pending",
      };

      setTasks((prev) => [...prev, newTask]);
      toast.success("Music generation started!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start music generation");
    }
  };

  // Handle task completion
  const handleTaskComplete = useCallback(
    (taskId: string, type: "image" | "video" | "music", resultUrls: string[]) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId ? { ...t, status: "success" as const } : t
        )
      );

      // Add results to assets
      resultUrls.forEach((url, index) => {
        const newAsset: Asset = {
          id: `asset-${Date.now()}-${index}`,
          type: type === "music" ? "audio" : type,
          name: `${type}-${Date.now()}-${index}`,
          url,
          createdAt: new Date(),
          source: "generated",
        };
        setAssets((prev) => [...prev, newAsset]);
      });
    },
    []
  );

  // Save asset to R2
  const handleSaveToR2 = async (asset: Asset) => {
    const response = await fetch("/api/kie/save-to-r2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceUrl: asset.url,
        type: asset.type,
        fileName: asset.name,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // Update asset with R2 URL
    setAssets((prev) =>
      prev.map((a) =>
        a.id === asset.id
          ? { ...a, url: result.data.url, source: "r2" as const }
          : a
      )
    );
  };

  const steps: { id: WorkflowStep; label: string; icon: React.ReactNode }[] = [
    { id: "prompt", label: "Prompt", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "image", label: "Image", icon: <Image className="h-4 w-4" /> },
    { id: "video", label: "Video", icon: <Film className="h-4 w-4" /> },
    { id: "music", label: "Music", icon: <Music className="h-4 w-4" /> },
    { id: "edit", label: "Edit", icon: <Wand2 className="h-4 w-4" /> },
  ];

  return (
    <div className="container max-w-7xl py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Creative Studio</h1>
        <p className="text-muted-foreground">
          Create amazing content with AI-powered tools
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <Button
              variant={activeStep === step.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveStep(step.id)}
              className="flex items-center gap-2"
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </Button>
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {/* Prompt Step */}
          {activeStep === "prompt" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Prompt Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Describe your creative idea</Label>
                  <Textarea
                    placeholder="E.g., A futuristic city with flying cars at sunset, neon lights reflecting on wet streets..."
                    value={userIdea}
                    onChange={(e) => setUserIdea(e.target.value)}
                    className="min-h-32"
                  />
                </div>

                <Button
                  onClick={handleGeneratePrompt}
                  disabled={isGeneratingPrompt || !userIdea.trim()}
                  className="w-full"
                >
                  {isGeneratingPrompt ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Optimized Prompt
                    </>
                  )}
                </Button>

                {generatedPrompt && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">
                      Generated Prompt
                    </Label>
                    <p className="mt-2 text-sm">{generatedPrompt}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveStep("image");
                        }}
                      >
                        Use for Image
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveStep("video");
                        }}
                      >
                        Use for Video
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Image Step */}
          {activeStep === "image" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Image Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Model</Label>
                  <ModelSelector
                    type="image"
                    value={imageModelId}
                    onChange={setImageModelId}
                  />
                </div>

                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    placeholder="Describe the image you want to generate..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                <Button
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim()}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Video Step */}
          {activeStep === "video" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Video Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Model</Label>
                  <ModelSelector
                    type="video"
                    value={videoModelId}
                    onChange={setVideoModelId}
                  />
                </div>

                <div>
                  <Label>Prompt</Label>
                  <Textarea
                    placeholder="Describe the video scene and motion..."
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                {assets.filter((a) => a.type === "image").length > 0 && (
                  <div>
                    <Label>Starting Image (Optional)</Label>
                    <Select
                      value={selectedImageForVideo || "none"}
                      onValueChange={(v) =>
                        setSelectedImageForVideo(v === "none" ? null : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an image" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No image (text-to-video)</SelectItem>
                        {assets
                          .filter((a) => a.type === "image")
                          .map((a) => (
                            <SelectItem key={a.id} value={a.url}>
                              {a.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  onClick={handleGenerateVideo}
                  disabled={!videoPrompt.trim()}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Video
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Music Step */}
          {activeStep === "music" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Music Generation (Suno)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Model</Label>
                  <ModelSelector
                    type="music"
                    value={musicModelId}
                    onChange={setMusicModelId}
                  />
                </div>

                <div>
                  <Label>Prompt / Lyrics</Label>
                  <Textarea
                    placeholder="Describe the music or write lyrics..."
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                <div>
                  <Label>Style (Optional)</Label>
                  <Input
                    placeholder="E.g., epic cinematic, upbeat pop, lo-fi chill..."
                    value={musicStyle}
                    onChange={(e) => setMusicStyle(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleGenerateMusic}
                  disabled={!musicPrompt.trim()}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Music
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Edit Step */}
          {activeStep === "edit" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Video Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Drag assets from the library to start editing</p>
                  <p className="text-sm mt-2">
                    Or generate some content first using the steps above
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Tasks */}
          {tasks.filter((t) => t.status !== "success").length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium">Active Tasks</h3>
              {tasks
                .filter((t) => t.status !== "success")
                .map((task) => (
                  <TaskProgress
                    key={task.id}
                    taskId={task.taskId}
                    type={task.type}
                    modelId={task.modelId}
                    onComplete={(urls) =>
                      handleTaskComplete(task.taskId, task.type, urls)
                    }
                    onError={(err) => {
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.taskId === task.taskId
                            ? { ...t, status: "failed" as const }
                            : t
                        )
                      );
                    }}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Asset Library Sidebar */}
        <div className="lg:col-span-1">
          <AssetLibrary
            assets={assets}
            onRemoveAsset={(id) =>
              setAssets((prev) => prev.filter((a) => a.id !== id))
            }
            onSaveToR2={handleSaveToR2}
            className="h-[600px]"
          />
        </div>
      </div>
    </div>
  );
}

