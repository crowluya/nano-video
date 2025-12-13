"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Film,
  Image,
  Music,
  Type,
  Trash2,
  GripVertical,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  EditProject,
  TimelineTrack,
  calculateProjectDuration,
} from "@/lib/remotion/types";
import { cn } from "@/lib/utils";

interface TimelineEditorProps {
  project: EditProject;
  selectedTrackId: string | null;
  currentTime: number;
  onSelectTrack: (trackId: string | null) => void;
  onUpdateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  onRemoveTrack: (trackId: string) => void;
  onTimeChange: (time: number) => void;
  onUpdateProject: (updates: Partial<EditProject>) => void;
}

const PIXELS_PER_SECOND_BASE = 50;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  project,
  selectedTrackId,
  currentTime,
  onSelectTrack,
  onUpdateTrack,
  onRemoveTrack,
  onTimeChange,
  onUpdateProject,
}) => {
  const [zoom, setZoom] = useState(1);
  const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;

  // Group tracks by layer type
  const groupedTracks = useMemo(() => {
    const videos = project.timeline.filter((t) => t.type === "video");
    const images = project.timeline.filter((t) => t.type === "image");
    const texts = project.timeline.filter((t) => t.type === "text");
    const audios = project.timeline.filter((t) => t.type === "audio");
    return { videos, images, texts, audios };
  }, [project.timeline]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.5, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.5, MIN_ZOOM));
  }, []);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = x / pixelsPerSecond;
      onTimeChange(Math.max(0, Math.min(time, project.duration)));
    },
    [pixelsPerSecond, project.duration, onTimeChange]
  );

  const timelineWidth = project.duration * pixelsPerSecond;

  // Time markers
  const timeMarkers = useMemo(() => {
    const markers = [];
    const interval = zoom >= 1 ? 1 : zoom >= 0.5 ? 5 : 10;
    for (let t = 0; t <= project.duration; t += interval) {
      markers.push(t);
    }
    return markers;
  }, [project.duration, zoom]);

  return (
    <Card className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Timeline</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex">
          {/* Track Labels */}
          <div className="w-32 flex-shrink-0 border-r bg-muted/30">
            {/* Time ruler space */}
            <div className="h-8 border-b" />

            {/* Video tracks label */}
            {groupedTracks.videos.length > 0 && (
              <TrackGroupLabel
                icon={<Film className="h-3 w-3" />}
                label="Video"
                count={groupedTracks.videos.length}
              />
            )}

            {/* Image tracks label */}
            {groupedTracks.images.length > 0 && (
              <TrackGroupLabel
                icon={<Image className="h-3 w-3" />}
                label="Images"
                count={groupedTracks.images.length}
              />
            )}

            {/* Text tracks label */}
            {groupedTracks.texts.length > 0 && (
              <TrackGroupLabel
                icon={<Type className="h-3 w-3" />}
                label="Text"
                count={groupedTracks.texts.length}
              />
            )}

            {/* Audio tracks label */}
            {groupedTracks.audios.length > 0 && (
              <TrackGroupLabel
                icon={<Music className="h-3 w-3" />}
                label="Audio"
                count={groupedTracks.audios.length}
              />
            )}
          </div>

          {/* Timeline Content */}
          <div
            className="relative flex-1"
            style={{ width: timelineWidth + 100 }}
            onClick={handleTimelineClick}
          >
            {/* Time ruler */}
            <div className="h-8 border-b bg-muted/30 relative">
              {timeMarkers.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full border-l border-muted-foreground/30"
                  style={{ left: t * pixelsPerSecond }}
                >
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {formatTime(t)}
                  </span>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: currentTime * pixelsPerSecond }}
            >
              <div className="w-3 h-3 bg-red-500 -ml-[5px] rotate-45 -mt-1" />
            </div>

            {/* Track Lanes */}
            <div className="relative">
              {/* Video tracks */}
              {groupedTracks.videos.map((track, index) => (
                <TrackLane
                  key={track.id}
                  track={track}
                  isSelected={selectedTrackId === track.id}
                  pixelsPerSecond={pixelsPerSecond}
                  color="bg-blue-500/80"
                  onSelect={() => onSelectTrack(track.id)}
                  onRemove={() => onRemoveTrack(track.id)}
                />
              ))}

              {/* Image tracks */}
              {groupedTracks.images.map((track, index) => (
                <TrackLane
                  key={track.id}
                  track={track}
                  isSelected={selectedTrackId === track.id}
                  pixelsPerSecond={pixelsPerSecond}
                  color="bg-emerald-500/80"
                  onSelect={() => onSelectTrack(track.id)}
                  onRemove={() => onRemoveTrack(track.id)}
                />
              ))}

              {/* Text tracks */}
              {groupedTracks.texts.map((track, index) => (
                <TrackLane
                  key={track.id}
                  track={track}
                  isSelected={selectedTrackId === track.id}
                  pixelsPerSecond={pixelsPerSecond}
                  color="bg-purple-500/80"
                  onSelect={() => onSelectTrack(track.id)}
                  onRemove={() => onRemoveTrack(track.id)}
                />
              ))}

              {/* Audio tracks */}
              {groupedTracks.audios.map((track, index) => (
                <TrackLane
                  key={track.id}
                  track={track}
                  isSelected={selectedTrackId === track.id}
                  pixelsPerSecond={pixelsPerSecond}
                  color="bg-orange-500/80"
                  onSelect={() => onSelectTrack(track.id)}
                  onRemove={() => onRemoveTrack(track.id)}
                />
              ))}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
};

interface TrackGroupLabelProps {
  icon: React.ReactNode;
  label: string;
  count: number;
}

const TrackGroupLabel: React.FC<TrackGroupLabelProps> = ({
  icon,
  label,
  count,
}) => (
  <div className="h-12 flex items-center gap-2 px-2 border-b">
    {icon}
    <span className="text-xs font-medium">{label}</span>
    <span className="text-xs text-muted-foreground">({count})</span>
  </div>
);

interface TrackLaneProps {
  track: TimelineTrack;
  isSelected: boolean;
  pixelsPerSecond: number;
  color: string;
  onSelect: () => void;
  onRemove: () => void;
}

const TrackLane: React.FC<TrackLaneProps> = ({
  track,
  isSelected,
  pixelsPerSecond,
  color,
  onSelect,
  onRemove,
}) => {
  const width = track.duration * pixelsPerSecond;
  const left = track.startTime * pixelsPerSecond;

  return (
    <div className="h-12 border-b relative group">
      <div
        className={cn(
          "absolute top-1 bottom-1 rounded cursor-pointer transition-all",
          color,
          isSelected && "ring-2 ring-white ring-offset-2 ring-offset-background"
        )}
        style={{ left, width: Math.max(width, 20) }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <div className="flex items-center h-full px-2 gap-1 overflow-hidden">
          <GripVertical className="h-3 w-3 text-white/60 flex-shrink-0" />
          <span className="text-xs text-white truncate">
            {track.name || track.type}
          </span>
        </div>

        {/* Delete button on hover */}
        <button
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3 text-white" />
        </button>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default TimelineEditor;

