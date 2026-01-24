'use client';

import { useEffect, useRef, useState } from 'react';

// Using the latest AI-generated videos from R2 CDN
const videos = [
  {
    url: 'https://cdn.nanobananavideo.net/website/gallery/realistic/realistic-1.mp4',
    title: 'AI Spokesperson - Professional Product Showcase',
  },
  {
    url: 'https://cdn.nanobananavideo.net/website/gallery/realistic/realistic-2.mp4',
    title: 'Coffee Latte Art - Cinematic Close-up',
  },
  {
    url: 'https://cdn.nanobananavideo.net/website/gallery/ugc/ugc-1.mp4',
    title: 'UGC Style - Engaging Content',
  },
];

export function VideoShowcase() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  useEffect(() => {
    // Reset and play the video when the index changes
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    }
  }, [currentVideoIndex]);

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              onEnded={handleVideoEnded}
              playsInline
              muted
              autoPlay
            >
              <source src={videos[currentVideoIndex].url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video indicators */}
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 transform gap-2">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === currentVideoIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                  aria-label={`Play video ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Video info */}
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-foreground">
              {videos[currentVideoIndex].title}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Video {currentVideoIndex + 1} of {videos.length}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
