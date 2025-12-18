import VideoGenerationPage from "@/components/video-generation/VideoGenerationPage";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;

  return constructMetadata({
    page: "VideoGeneration",
    title: "Video Generation - AI Demo",
    description: "Generate videos using Sora 2 and Veo 3.1 AI models",
    locale: locale as Locale,
    path: `/video-generation`,
  });
}

export default async function VideoGenerationRoute({
  params,
}: {
  params: Params;
}) {
  return (
    <div className="w-full h-screen overflow-hidden">
      <VideoGenerationPage />
    </div>
  );
}

