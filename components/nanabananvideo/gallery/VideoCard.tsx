'use client';

import { useRef, useState } from 'react';

interface VideoCardProps {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
}

export default function VideoCard({ id, title, description, videoUrl }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current && isLoaded) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div
      className="group relative rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Container */}
      <div className="relative aspect-video bg-muted">
        {/* Placeholder before video loads */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          muted
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => {
            console.error(`Failed to load video: ${id}`);
            setIsLoaded(true);
          }}
        />

        {/* Play Button Overlay (shown when not playing) */}
        {!isPlaying && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
          10s
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </div>
  );
}
