'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoCard from './gallery/VideoCard';

type GalleryCategory = 'realistic' | 'ugc' | '3d';

const VIDEO_CDN_URLS: Record<string, string> = {
  'realistic-1': 'https://cdn.nanobananavideo.net/website/gallery/realistic/realistic-1.mp4',
  'realistic-2': 'https://cdn.nanobananavideo.net/website/gallery/realistic/realistic-2.mp4',
  'realistic-3': 'https://cdn.nanobananavideo.net/website/gallery/realistic/realistic-3.mp4',
  'ugc-1': 'https://cdn.nanobananavideo.net/website/gallery/ugc/ugc-1.mp4',
  'ugc-2': 'https://cdn.nanobananavideo.net/website/gallery/ugc/ugc-2.mp4',
  'ugc-3': 'https://cdn.nanobananavideo.net/website/gallery/ugc/ugc-3.mp4',
  '3d-1': 'https://cdn.nanobananavideo.net/website/gallery/3d/3d-1.mp4',
  '3d-2': 'https://cdn.nanobananavideo.net/website/gallery/3d/3d-2.mp4',
  '3d-3': 'https://cdn.nanobananavideo.net/website/gallery/3d/3d-3.mp4',
};

export default function NanoBananaGallery() {
  const t = useTranslations('NanoBananaVideo.Gallery');
  const [activeTab, setActiveTab] = useState<GalleryCategory>('realistic');

  const videos = t.raw(`categories.${activeTab}.videos`) as Array<{
    id: string;
    title: string;
    description: string;
  }>;

  return (
    <section id="gallery" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
            <span className="text-sm font-semibold">{t('badge.label')}</span>
            <span className="text-sm text-muted-foreground">{t('badge.text')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Style Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GalleryCategory)} className="w-full mb-12">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="realistic">{t('tabs.realistic')}</TabsTrigger>
            <TabsTrigger value="ugc">{t('tabs.ugc')}</TabsTrigger>
            <TabsTrigger value="3d">{t('tabs.3d')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              description={video.description}
              videoUrl={VIDEO_CDN_URLS[video.id]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
