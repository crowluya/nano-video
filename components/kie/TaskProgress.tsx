"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskStatus = "pending" | "processing" | "success" | "failed";

interface TaskProgressProps {
  taskId: string;
  type: "image" | "video" | "music";
  modelId?: string;
  onComplete?: (resultUrls: string[]) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
  maxPolls?: number;
  className?: string;
}

interface PollResult {
  taskId: string;
  type: string;
  status: TaskStatus;
  resultUrls: string[];
  isComplete: boolean;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  taskId,
  type,
  modelId,
  onComplete,
  onError,
  pollInterval = 5000,
  maxPolls = 120,
  className,
}) => {
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [progress, setProgress] = useState(0);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const pollStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        taskId,
        type,
        ...(modelId && { modelId }),
      });

      const response = await fetch(`/api/kie/status?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to check status");
      }

      const data = result.data as PollResult;

      setStatus(data.status);

      // Update progress based on status
      if (data.status === "processing") {
        setProgress((prev) => Math.min(prev + 5, 90));
      } else if (data.status === "success") {
        setProgress(100);
        setResultUrls(data.resultUrls);
        onComplete?.(data.resultUrls);
      } else if (data.status === "failed") {
        setError("Generation failed");
        onError?.("Generation failed");
      }

      return data.isComplete;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setStatus("failed");
      onError?.(errorMessage);
      return true; // Stop polling on error
    }
  }, [taskId, type, modelId, onComplete, onError]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;
    let currentPollCount = 0;

    const poll = async () => {
      if (isCancelled) return;

      const isComplete = await pollStatus();

      if (!isComplete && currentPollCount < maxPolls && !isCancelled) {
        currentPollCount++;
        setPollCount(currentPollCount);
        // Add initial delay to avoid immediate polling after task creation
        const delay = currentPollCount === 1 ? Math.max(pollInterval, 3000) : pollInterval;
        timeoutId = setTimeout(poll, delay);
      }
    };

    // Add initial delay before first poll to avoid rate limiting
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        poll();
      }
    }, 2000);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pollStatus, pollInterval, maxPolls]); // Removed pollCount from dependencies

  const handleRetry = useCallback(() => {
    setStatus("pending");
    setProgress(0);
    setError(null);
    setPollCount(0);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Initializing...";
      case "processing":
        return `Generating ${type}...`;
      case "success":
        return "Complete!";
      case "failed":
        return error || "Failed";
      default:
        return "Unknown status";
    }
  };

  const getEstimatedTime = () => {
    if (status !== "processing") return null;

    const times: Record<string, string> = {
      image: "30-60 seconds",
      video: "2-10 minutes",
      music: "1-3 minutes",
    };

    return times[type];
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">{getStatusText()}</p>
            {getEstimatedTime() && (
              <p className="text-xs text-muted-foreground">
                Estimated time: {getEstimatedTime()}
              </p>
            )}
          </div>
          {status === "failed" && (
            <Button variant="ghost" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </div>

        {status !== "failed" && (
          <Progress value={progress} className="h-2" />
        )}

        {/* Result Preview */}
        {status === "success" && resultUrls.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              {resultUrls.length} {type}(s) generated
            </p>
            <div className="flex flex-wrap gap-2">
              {resultUrls.slice(0, 4).map((url, index) => (
                <div key={index} className="relative group">
                  {type === "image" && (
                    <img
                      src={url}
                      alt={`Generated ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  )}
                  {type === "video" && (
                    <video
                      src={url}
                      className="w-20 h-20 object-cover rounded-md"
                      muted
                    />
                  )}
                  {type === "music" && (
                    <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-1">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <ExternalLink className="h-4 w-4 text-white" />
                    </a>
                    <a
                      href={url}
                      download
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskProgress;

