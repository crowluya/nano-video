import FeatureBadge from "@/components/shared/FeatureBadge";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { Check, Play, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

type WorkflowKey = "singleImage" | "firstLast";

interface WorkflowCopy {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  videoLabel: string;
  button: string;
  frameLabels: {
    first: string;
    last?: string;
  };
}

interface WorkflowMedia {
  href: string;
  frames: Array<{
    src: string;
    alt: string;
  }>;
  video: {
    src: string;
    poster: string;
  };
}

const WORKFLOW_MEDIA: Record<WorkflowKey, WorkflowMedia> = {
  singleImage: {
    href: "/nano-banana-image-to-video",
    frames: [
      {
        src: "https://cdn.nanobananavideo.net/website/home/workflows/single-image/reference-frame.png",
        alt: "Single image to video reference frame",
      },
    ],
    video: {
      src: "https://cdn.nanobananavideo.net/website/home/workflows/single-image/generated-video.mp4",
      poster:
        "https://cdn.nanobananavideo.net/website/home/workflows/single-image/reference-frame.png",
    },
  },
  firstLast: {
    href: "/nanabananvideo#video-Generator",
    frames: [
      {
        src: "https://cdn.nanobananavideo.net/website/home/workflows/first-last/starting-frame.png",
        alt: "First and last frame workflow starting frame",
      },
      {
        src: "https://cdn.nanobananavideo.net/website/home/workflows/first-last/ending-frame.png",
        alt: "First and last frame workflow ending frame",
      },
    ],
    video: {
      src: "https://cdn.nanobananavideo.net/website/home/workflows/first-last/generated-video.mp4",
      poster:
        "https://cdn.nanobananavideo.net/website/home/workflows/first-last/starting-frame.png",
    },
  },
};

function WorkflowCard({
  copy,
  media,
}: {
  copy: WorkflowCopy;
  media: WorkflowMedia;
}) {
  return (
    <article className="rounded-[2rem] border border-border/70 bg-card/70 p-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.6)] backdrop-blur">
      <div className="grid gap-8 rounded-[1.5rem] border border-border/60 bg-background/95 p-6 lg:grid-cols-[0.92fr_1.08fr] lg:p-8">
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Wand2 className="h-3.5 w-3.5" />
              {copy.eyebrow}
            </div>

            <div className="space-y-4">
              <h3 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {copy.title}
              </h3>
              <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                {copy.description}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ul className="space-y-3">
              {copy.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-sm text-foreground md:text-base"
                >
                  <span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="h-11 rounded-xl px-6 text-white">
              <I18nLink href={media.href}>{copy.button}</I18nLink>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className={`grid gap-4 ${
              media.frames.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {media.frames.map((frame, index) => {
              const label =
                index === 0 ? copy.frameLabels.first : copy.frameLabels.last;

              return (
                <div
                  key={frame.src}
                  className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted/20"
                >
                  <div className="border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {label}
                  </div>
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={frame.src}
                      alt={frame.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-black">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
              <span>{copy.videoLabel}</span>
              <span className="inline-flex items-center gap-2 text-white/70">
                <Play className="h-3.5 w-3.5 fill-current" />
                Veo 3.1
              </span>
            </div>
            <video
              className="aspect-video w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              poster={media.video.poster}
            >
              <source src={media.video.src} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function VideoWorkflows() {
  const t = useTranslations("NanoBananaVideo.VideoWorkflows");

  const workflows: Array<{ key: WorkflowKey; copy: WorkflowCopy }> = [
    {
      key: "singleImage",
      copy: t.raw("singleImage") as WorkflowCopy,
    },
    {
      key: "firstLast",
      copy: t.raw("firstLast") as WorkflowCopy,
    },
  ];

  return (
    <section id="video-workflows" className="py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FeatureBadge
            label={t("badge.label")}
            text={t("badge.text")}
            className="mb-8"
          />
          <h2 className="mb-4 text-lg font-semibold md:text-5xl">
            <span className="title-gradient">{t("title")}</span>
          </h2>
          <p className="text-lg leading-8 text-muted-foreground md:text-xl">
            {t("description")}
          </p>
        </div>

        <div className="space-y-8">
          {workflows.map(({ key, copy }) => (
            <WorkflowCard key={key} copy={copy} media={WORKFLOW_MEDIA[key]} />
          ))}
        </div>
      </div>
    </section>
  );
}
