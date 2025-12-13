"use client";

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  AudioTrack,
  CompositionProps,
  ImageTrack,
  TextTrack,
  TimelineTrack,
  VideoTrack,
  sortTracksByLayer,
} from "@/lib/remotion/types";

/**
 * Main Remotion Composition Component
 * Renders all timeline tracks with proper timing and effects
 */
export const VideoComposition: React.FC<CompositionProps> = ({
  tracks,
  resolution,
  backgroundColor = "#000000",
}) => {
  const sortedTracks = sortTracksByLayer(tracks);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {sortedTracks.map((track) => (
        <TrackRenderer key={track.id} track={track} />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Renders individual track based on type
 */
const TrackRenderer: React.FC<{ track: TimelineTrack }> = ({ track }) => {
  const { fps } = useVideoConfig();
  const startFrame = Math.floor(track.startTime * fps);
  const durationInFrames = Math.floor(track.duration * fps);

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      {track.type === "video" && <VideoTrackComponent track={track} />}
      {track.type === "image" && <ImageTrackComponent track={track} />}
      {track.type === "audio" && <AudioTrackComponent track={track} />}
      {track.type === "text" && <TextTrackComponent track={track} />}
    </Sequence>
  );
};

/**
 * Video Track Component
 */
const VideoTrackComponent: React.FC<{ track: VideoTrack }> = ({ track }) => {
  const { fps } = useVideoConfig();
  const startFromSec = track.trimStart || 0;

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={track.src}
        startFrom={Math.floor(startFromSec * fps)}
        volume={track.muted ? 0 : track.volume ?? 1}
        playbackRate={track.playbackRate ?? 1}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Image Track Component
 */
const ImageTrackComponent: React.FC<{ track: ImageTrack }> = ({ track }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Ken Burns effect - subtle zoom
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    [track.scale ?? 1, (track.scale ?? 1) * 1.05],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Img
        src={track.src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: track.fit || "cover",
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Audio Track Component
 */
const AudioTrackComponent: React.FC<{ track: AudioTrack }> = ({ track }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  const fadeInFrames = (track.fadeIn ?? 0) * fps;
  const fadeOutFrames = (track.fadeOut ?? 0) * fps;
  
  let volume = track.volume ?? 1;
  
  // Apply fade in
  if (fadeInFrames > 0 && frame < fadeInFrames) {
    volume *= interpolate(frame, [0, fadeInFrames], [0, 1]);
  }
  
  // Apply fade out
  if (fadeOutFrames > 0 && frame > durationInFrames - fadeOutFrames) {
    volume *= interpolate(
      frame,
      [durationInFrames - fadeOutFrames, durationInFrames],
      [1, 0]
    );
  }

  return (
    <Audio
      src={track.src}
      volume={volume}
      startFrom={Math.floor((track.trimStart ?? 0) * fps)}
    />
  );
};

/**
 * Text Track Component
 */
const TextTrackComponent: React.FC<{ track: TextTrack }> = ({ track }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Animation opacity
  let opacity = 1;
  
  if (track.animation === "fade-in") {
    opacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
      extrapolateRight: "clamp",
    });
  } else if (track.animation === "fade-out") {
    opacity = interpolate(
      frame,
      [durationInFrames - fps * 0.5, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp" }
    );
  }
  
  // Typewriter effect
  let displayText = track.text;
  if (track.animation === "typewriter") {
    const charsPerFrame = track.text.length / (durationInFrames * 0.8);
    const visibleChars = Math.floor(frame * charsPerFrame);
    displayText = track.text.slice(0, visibleChars);
  }
  
  // Scale animation
  let scale = 1;
  if (track.animation === "scale-in") {
    scale = interpolate(frame, [0, fps * 0.3], [0, 1], {
      extrapolateRight: "clamp",
    });
  } else if (track.animation === "bounce") {
    const bounceProgress = interpolate(frame, [0, fps * 0.5], [0, 1], {
      extrapolateRight: "clamp",
    });
    scale = interpolate(
      bounceProgress,
      [0, 0.5, 0.7, 0.85, 1],
      [0, 1.2, 0.9, 1.05, 1]
    );
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: track.position?.y === 50 ? "center" : 
          track.position?.y && track.position.y < 50 ? "flex-start" : "flex-end",
        alignItems: track.align === "left" ? "flex-start" :
          track.align === "right" ? "flex-end" : "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          fontSize: track.fontSize ?? 48,
          fontFamily: track.fontFamily ?? "Arial",
          fontWeight: track.fontWeight ?? "bold",
          color: track.color ?? "#ffffff",
          backgroundColor: track.backgroundColor,
          padding: track.backgroundColor ? "10px 20px" : undefined,
          borderRadius: track.backgroundColor ? "8px" : undefined,
          opacity,
          transform: `scale(${scale})`,
          textAlign: track.align ?? "center",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {displayText}
      </div>
    </AbsoluteFill>
  );
};

export default VideoComposition;

