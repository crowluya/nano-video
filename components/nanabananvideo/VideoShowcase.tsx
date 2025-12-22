'use client';

import { useEffect, useRef, useState } from 'react';

const videos = [
  {
    url: 'https://tempfile.aiquickdraw.com/v/228e623c000be1ae80b3c6e5b4fd421f_1765983853.mp4',
    title: 'Video 1',
  },
  {
    url: 'https://file.aiquickdraw.com/custom-page/akr/section-images/17607764967900u9630hr.mp4',
    title: 'Video 2',
  },
  {
    url: 'https://file.aiquickdraw.com/custom-page/akr/section-images/1760692304341bbjb1icx.mp4',
    title: 'Video 3',
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

          {/* Optional: Video counter */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Video {currentVideoIndex + 1} of {videos.length}
          </div>
        </div>
      </div>
    </section>
  );
}
