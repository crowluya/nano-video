import { GlowingEffect } from "@/components/ui/glowing-effect";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Link as I18nLink } from "@/i18n/routing";
import { MousePointerClick } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NanoBananaCTA() {
  const t = useTranslations("NanoBananaVideo.CTA");

  return (
    <section id="cta" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>

          <div className="relative rounded-3xl border-[0.75px] border-border p-3">
            <GlowingEffect
              spread={60}
              glow={true}
              disabled={false}
              proximity={80}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="relative overflow-hidden rounded-2xl border-[0.75px] bg-linear-to-br from-background via-background to-muted/20 p-12 md:p-16 text-center shadow-lg dark:shadow-[0px_0px_40px_0px_rgba(45,45,45,0.4)]">
              <div className="absolute top-0 left-0 w-full h-full opacity-30">
                <div className="absolute top-8 left-8 w-2 h-2 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                <div className="absolute top-16 right-12 w-1 h-1 bg-linear-to-r from-purple-500 to-pink-500 rounded-full"></div>
                <div className="absolute bottom-12 left-16 w-1.5 h-1.5 bg-linear-to-r from-pink-500 to-indigo-500 rounded-full"></div>
                <div className="absolute bottom-8 right-8 w-2 h-2 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              </div>

              <h2 className="text-center z-10 text-lg md:text-5xl font-sans font-semibold mb-4">
                <span className="text-primary">{t("title")}</span>
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                {t("description")}
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <I18nLink
                  href="#video-demo"
                  className="flex items-center gap-2"
                  prefetch={true}
                >
                  <RainbowButton>
                    <MousePointerClick className="w-5 h-5" />
                    {t("button")}
                  </RainbowButton>
                </I18nLink>
              </div>

              <div className="mt-10 pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("trustText")}
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap opacity-60">
                  <div className="text-xs font-medium">
                    {t("features.deploy")}
                  </div>
                  <div className="text-xs font-medium">
                    {t("features.production")}
                  </div>
                  <div className="text-xs font-medium">
                    {t("features.updates")}
                  </div>
                  <div className="text-xs font-medium">
                    {t("features.i18n")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

