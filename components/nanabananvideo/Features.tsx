import FeatureBadge from "@/components/shared/FeatureBadge";
import { ImagePreview } from "@/components/shared/ImagePreview";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type Feature = {
  title: string;
  description: string;
  details?: {
    title: string;
    description: string;
  }[];
  images?: string[];
};

const FeatureCard = ({ feature }: { feature: Feature }) => {
  return (
    <div key={feature.title} className="w-full py-4">
      <div className="container mx-auto">
        <div className="grid container p-8 grid-cols-1 gap-8 items-center lg:grid-cols-2">
          <div className="flex gap-10 flex-col">
            <div className="flex gap-4 flex-col">
              <div className="flex gap-2 flex-col">
                <h3 className="text-3xl lg:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  {feature.title}
                </h3>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
                  {feature.description}
                </p>
              </div>
            </div>
            <div className="grid lg:pl-6 grid-cols-1 sm:grid-cols-3 items-start lg:grid-cols-1 gap-6">
              {feature.details?.map((detail) => (
                <div
                  key={detail.title}
                  className="flex flex-row gap-6 items-start"
                >
                  <Check className="w-4 h-4 mt-2 text-primary shrink-0" />
                  <div className="flex flex-col gap-1">
                    <p>{detail.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {detail.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg p-2 border">
            {feature.images && feature.images.length > 1 ? (
              <div className="w-full max-w-full">
                <Carousel>
                  <CarouselContent>
                    {feature.images.map((image) => (
                      <CarouselItem key={image}>
                        <ImagePreview>
                          <Image
                            src={image || "/placeholder.svg"}
                            alt={feature.title}
                            width={1280}
                            height={630}
                            className="rounded-lg"
                          />
                        </ImagePreview>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            ) : (
              <ImagePreview>
                <Image
                  src={feature.images?.[0] || "/placeholder.svg"}
                  alt={feature.title}
                  width={1280}
                  height={630}
                  className="rounded-lg"
                />
              </ImagePreview>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NanoBananaFeatures() {
  const t = useTranslations("NanoBananaVideo.Features");

  const features: Feature[] = t.raw("items");

  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <FeatureBadge
            label={t("badge.label")}
            text={t("badge.text")}
            className="mb-8"
          />
          <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
            <span className="title-gradient">{t("title")}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

