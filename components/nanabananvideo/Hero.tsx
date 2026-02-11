'use client';

import FeatureBadge from "@/components/shared/FeatureBadge";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { Check, Images, MousePointerClick, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

// Demo videos from R2 CDN
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

function VideoPlayer() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    // Reset and play the video when the index changes
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [currentVideoIndex]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border bg-black shadow-2xl">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        onEnded={handleVideoEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        muted
        autoPlay
      >
        <source src={videos[currentVideoIndex].url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Play/Pause overlay button */}
      <button
        onClick={togglePlayPause}
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white transition-opacity hover:bg-black/70 opacity-0 hover:opacity-100 focus:opacity-100"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </button>

      {/* Video indicators */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 transform gap-2">
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

      {/* Video title overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        <p className="text-sm font-medium text-white">
          {videos[currentVideoIndex].title}
        </p>
        <p className="text-xs text-white/70">
          Video {currentVideoIndex + 1} of {videos.length}
        </p>
      </div>
    </div>
  );
}

export default function NanoBananaHero() {
  const t = useTranslations("NanoBananaVideo.Hero");
  const tCommon = useTranslations("common");

  const sellingPoints = [
    { icon: Check, text: t("sellingPoints.noCreditCard") },
    { icon: Check, text: t("sellingPoints.exportMp4") },
    { icon: Check, text: t("sellingPoints.fastRendering") },
  ];

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-24 items-center justify-center">
          {/* Left Column - Hero Content */}
          <div className="flex flex-col gap-6 lg:gap-8 w-full lg:w-1/2 max-w-xl">
            <FeatureBadge
              label={t("badge.label")}
              text={t("badge.text")}
              href={t("badge.href")}
            />

            <h1 className="text-left z-10 text-4xl md:text-5xl lg:text-6xl font-sans font-bold">
              <span className="title-gradient">{t("title")}</span>
            </h1>

            <p className="text-base md:text-lg leading-relaxed tracking-tight text-muted-foreground text-left">
              {t("description")}
            </p>

            <div className="flex flex-row gap-3 flex-wrap">
              <Button
                asChild
                className="h-11 rounded-xl px-8 py-2 text-white border-2 border-primary"
              >
                <I18nLink
                  href="/#video-Generator"
                  className="flex items-center gap-2"
                >
                  <MousePointerClick className="w-4 h-4" />
                  {t("getStarted")}
                </I18nLink>
              </Button>
              <Button
                className="h-11 rounded-xl px-8 py-2 bg-white hover:bg-background text-indigo-500 hover:text-indigo-600 border-2"
                variant="outline"
                asChild
              >
                <I18nLink
                  href="/#gallery"
                  className="flex items-center gap-2"
                >
                  <Images className="w-4 h-4 text-indigo-500" />
                  {t("viewGallery")}
                </I18nLink>
              </Button>
            </div>

            {/* Selling Points */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
              {sellingPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2">
                  <point.icon className="h-4 w-4 text-primary" />
                  <span>{point.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Video Player */}
          <div className="w-full lg:w-1/2 max-w-2xl">
            <VideoPlayer />
          </div>
        </div>
      </div>
    </div>
  );
}
