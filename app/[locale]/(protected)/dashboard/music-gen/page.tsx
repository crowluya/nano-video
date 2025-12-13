"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Music, Sparkles, Download, Play, Pause, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ModelSelector } from "@/components/kie";
import { TaskProgress } from "@/components/kie";
import { KIE_MUSIC_MODELS } from "@/config/models";

interface GeneratedTrack {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  duration: number;
}

export default function MusicGenPage() {
  const [modelId, setModelId] = useState("V4");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [title, setTitle] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const selectedModel = KIE_MUSIC_MODELS.find((m) => m.id === modelId);

  // Generate lyrics helper
  const handleGenerateLyrics = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a theme or idea for lyrics");
      return;
    }

    try {
      const response = await fetch("/api/kie/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lyrics",
          prompt: prompt,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setPrompt(result.data.lyrics);
      if (result.data.title) {
        setTitle(result.data.title);
      }
      toast.success("Lyrics generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate lyrics");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt or lyrics");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/kie/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          modelId,
          prompt,
          style: style || undefined,
          title: title || undefined,
          instrumental,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setActiveTaskId(result.data.taskId);
      toast.success("Music generation started!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start generation");
      setIsGenerating(false);
    }
  };

  const handleComplete = useCallback((resultUrls: string[]) => {
    // For Suno, we get tracks with more info in the raw response
    // For simplicity, we'll create basic track objects
    resultUrls.forEach((url, index) => {
      const track: GeneratedTrack = {
        id: `track-${Date.now()}-${index}`,
        title: title || `Generated Track ${index + 1}`,
        audioUrl: url,
        duration: 0,
      };
      setGeneratedTracks((prev) => [track, ...prev]);
    });
    setActiveTaskId(null);
    setIsGenerating(false);
    toast.success("Music generated!");
  }, [title]);

  const handleError = useCallback(() => {
    setActiveTaskId(null);
    setIsGenerating(false);
    toast.error("Generation failed");
  }, []);

  const togglePlay = (trackId: string, audioElement: HTMLAudioElement) => {
    if (playingTrackId === trackId) {
      audioElement.pause();
      setPlayingTrackId(null);
    } else {
      // Pause any currently playing audio
      document.querySelectorAll("audio").forEach((a) => a.pause());
      audioElement.play();
      setPlayingTrackId(trackId);
    }
  };

  return (
    <div className="container max-w-6xl py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Music className="h-8 w-8" />
          Music Generation
        </h1>
        <p className="text-muted-foreground">
          Create original music with Suno AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Music</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Selection */}
            <div>
              <Label>Select Model</Label>
              <ModelSelector
                type="music"
                value={modelId}
                onChange={setModelId}
                className="mt-2"
              />
            </div>

            {/* Prompt / Lyrics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Prompt / Lyrics</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateLyrics}
                  disabled={!prompt.trim()}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Generate Lyrics
                </Button>
              </div>
              <Textarea
                placeholder="Enter lyrics or describe the music you want..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-40"
              />
            </div>

            {/* Title */}
            <div>
              <Label>Title (Optional)</Label>
              <Input
                placeholder="Song title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Style */}
            <div>
              <Label>Style (Optional)</Label>
              <Input
                placeholder="E.g., epic cinematic, upbeat pop, lo-fi chill..."
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
            </div>

            {/* Instrumental Toggle */}
            <div className="flex items-center justify-between">
              <Label>Instrumental (No Vocals)</Label>
              <Switch
                checked={instrumental}
                onCheckedChange={setInstrumental}
              />
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
                type="music"
                modelId={modelId}
                onComplete={handleComplete}
                onError={handleError}
                pollInterval={10000}
              />
            )}
          </CardContent>
        </Card>

        {/* Generated Tracks */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedTracks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your generated music will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isPlaying={playingTrackId === track.id}
                    onTogglePlay={togglePlay}
                    onPlayEnded={() => setPlayingTrackId(null)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface TrackCardProps {
  track: GeneratedTrack;
  isPlaying: boolean;
  onTogglePlay: (trackId: string, audio: HTMLAudioElement) => void;
  onPlayEnded: () => void;
}

function TrackCard({ track, isPlaying, onTogglePlay, onPlayEnded }: TrackCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {/* Play Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={(e) => {
          const audio = e.currentTarget.parentElement?.querySelector("audio");
          if (audio) onTogglePlay(track.id, audio);
        }}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{track.title}</p>
        <p className="text-sm text-muted-foreground">
          Suno AI Generated
        </p>
      </div>

      {/* Download */}
      <a href={track.audioUrl} download>
        <Button variant="ghost" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </a>

      {/* Hidden Audio Element */}
      <audio
        src={track.audioUrl}
        onEnded={onPlayEnded}
        className="hidden"
      />
    </div>
  );
}

