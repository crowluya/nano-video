"use client";

import { Player, PlayerRef } from "@remotion/player";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { VideoComposition } from "./VideoComposition";
import {
  EditProject,
  TimelineTrack,
  ProjectResolution,
} from "@/lib/remotion/types";

interface PreviewPlayerProps {
  project: EditProject;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  project,
  onTimeUpdate,
  className,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const durationInFrames = Math.max(Math.ceil(project.duration * project.fps), 1);

  const handlePlay = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePlay, handlePause]);

  const handleSeek = useCallback((value: number[]) => {
    const time = value[0];
    if (playerRef.current) {
      playerRef.current.seekTo(Math.floor(time * project.fps));
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [project.fps, onTimeUpdate]);

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 5);
    handleSeek([newTime]);
  }, [currentTime, handleSeek]);

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(project.duration, currentTime + 5);
    handleSeek([newTime]);
  }, [currentTime, project.duration, handleSeek]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    setIsMuted(vol === 0);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    const container = document.getElementById("player-container");
    if (container) {
      if (!isFullscreen) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div id="player-container" className={`flex flex-col ${className}`}>
      {/* Player */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <Player
          ref={playerRef}
          component={VideoComposition}
          inputProps={{
            tracks: project.timeline,
            resolution: project.resolution,
            backgroundColor: project.backgroundColor,
          }}
          durationInFrames={durationInFrames}
          compositionWidth={project.resolution.width}
          compositionHeight={project.resolution.height}
          fps={project.fps}
          style={{
            width: "100%",
            height: "100%",
          }}
          controls={false}
          loop={false}
          clickToPlay={false}
          spaceKeyToPlayOrPause={true}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 mt-3 px-2">
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-12">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={project.duration}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-12">
            {formatTime(project.duration)}
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipBackward}
              title="Skip back 5s"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleTogglePlay}
              className="h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkipForward}
              title="Skip forward 5s"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Volume Control */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPlayer;

