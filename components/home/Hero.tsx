import FeatureBadge from "@/components/shared/FeatureBadge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Link as I18nLink } from "@/i18n/routing";
import { MousePointerClick } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SiDiscord } from "react-icons/si";

export default function Hero() {
  const t = useTranslations("Landing.Hero");

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-16 lg:py-24 2xl:py-40 items-center justify-center flex-col">
          <FeatureBadge
            label={t("badge.label")}
            text={t("badge.text")}
            href={t("badge.href")}
          />
          <div className="flex gap-4 flex-col max-w-3xl">
            <h1 className="text-center z-10 text-lg md:text-7xl font-sans font-bold">
              <span className="title-gradient">{t("title")}</span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground text-center">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-row gap-2">
            <Button
              asChild
              className="h-11 rounded-xl px-8 py-2 border-2 border-indigo-500"
            >
              <I18nLink
                href={t("getStartedLink") || "#"}
                className="flex items-center gap-2"
              >
                <MousePointerClick className="w-4 h-4" />
                {t("getStarted")}
              </I18nLink>
            </Button>
            <Button
              className="h-11 rounded-xl px-8 py-2 bg-white text-indigo-500 hover:text-indigo-600 border-2 border-indigo-500"
              variant="outline"
              asChild
            >
              <Link
                href={
                  siteConfig.socialLinks?.discord ||
                  "https://discord.com/invite/R7bUxWKRqZ"
                }
                target="_blank"
                rel="noopener noreferrer nofollow"
                title="Join Discord"
                prefetch={false}
                className="flex items-center gap-2"
              >
                <SiDiscord className="w-4 h-4 text-indigo-500" />
                Join Discord
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
