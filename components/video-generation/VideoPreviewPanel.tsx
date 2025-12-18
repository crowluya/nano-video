"use client";

import { TaskProgress } from "@/components/kie/TaskProgress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface VideoPreviewPanelProps {
  taskId: string | null;
  videoUrl: string | null;
  loading: boolean;
  error: string | null;
  modelId?: string;
  onComplete?: (videoUrls: string[]) => void;
  onError?: (error: string) => void;
}

export function VideoPreviewPanel({
  taskId,
  videoUrl,
  loading,
  error,
  modelId,
  onComplete,
  onError,
}: VideoPreviewPanelProps) {
  const [displayVideoUrl, setDisplayVideoUrl] = useState<string | null>(videoUrl);

  useEffect(() => {
    if (videoUrl) {
      setDisplayVideoUrl(videoUrl);
    }
  }, [videoUrl]);

  const handleTaskComplete = (urls: string[]) => {
    if (urls.length > 0) {
      setDisplayVideoUrl(urls[0]);
    }
    onComplete?.(urls);
  };

  const handleTaskError = (errorMsg: string) => {
    onError?.(errorMsg);
  };

  const downloadVideo = () => {
    if (!displayVideoUrl) return;
    const link = document.createElement("a");
    link.href = displayVideoUrl;
    link.download = `generated-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="text-white font-semibold">Output</div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            Preview
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            JSON
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        {loading && taskId && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
            <div className="text-center space-y-4 max-w-md px-6">
              <TaskProgress
                taskId={taskId}
                type="video"
                modelId={modelId}
                onComplete={handleTaskComplete}
                onError={handleTaskError}
                pollInterval={15000}
                className="bg-transparent border-0"
              />
            </div>
          </div>
        )}

        {loading && !taskId && (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
            <div className="text-white font-medium">Generating content...</div>
            <div className="text-gray-400 text-sm">
              Please wait while we process your request
            </div>
          </div>
        )}

        {error && (
          <div className="text-center space-y-4 px-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div className="text-white font-medium">Generation Failed</div>
            <div className="text-gray-400 text-sm max-w-md">{error}</div>
          </div>
        )}

        {displayVideoUrl && !loading && !error && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              <video
                src={displayVideoUrl}
                controls
                autoPlay
                muted
                loop
                className="max-w-full max-h-full rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4 border-t border-border/50 flex justify-end">
              <Button
                onClick={downloadVideo}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
            </div>
          </div>
        )}

        {!displayVideoUrl && !loading && !error && (
          <div className="text-center space-y-2 text-gray-500">
            <div className="text-4xl mb-4">🎬</div>
            <div className="font-medium">Generated video will appear here</div>
            <div className="text-sm">
              Upload an image, enter a prompt, and click Generate
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

