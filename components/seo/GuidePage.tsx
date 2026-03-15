import { InternalLinksSection } from "@/components/seo/InternalLinksSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { Locale } from "@/i18n/routing";
import { getLocalizedInternalLinks, getInternalLinksUiCopy } from "@/lib/seo/internal-links-localized";
import { GuidePageConfig } from "@/lib/seo/internal-links";
import { ArrowRight } from "lucide-react";

interface GuidePageProps {
  page: GuidePageConfig;
  locale: Locale | string;
}

export function GuidePage({ page, locale }: GuidePageProps) {
  const copy = getInternalLinksUiCopy(locale);

  return (
    <div className="w-full">
      <section className="w-full border-b border-border/60 bg-linear-to-b from-muted/60 via-background to-background">
        <div className="container mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <Badge variant="outline">{copy.guideTemplate.badge}</Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            {page.description}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/90">
            {page.intro}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <I18nLink href={page.primaryCtaHref}>{page.primaryCtaLabel}</I18nLink>
            </Button>
            <Button asChild variant="outline" size="lg">
              <I18nLink href={page.secondaryCtaHref}>
                {page.secondaryCtaLabel}
              </I18nLink>
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full py-16">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4">
            {page.steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border/70 bg-background p-6 shadow-sm shadow-black/5"
              >
                <p className="text-sm font-medium text-primary">
                  {copy.guideTemplate.stepLabel} {index + 1}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-border/70 bg-muted/30 p-8">
            <h2 className="text-2xl font-semibold">{copy.guideTemplate.notesTitle}</h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
              {page.tips.map((tip) => (
                <li
                  key={tip}
                  className="rounded-2xl border border-border/70 bg-background p-5 text-sm leading-6"
                >
                  {tip}
                </li>
              ))}
            </ul>

            <Button asChild variant="ghost" className="mt-6 px-0 text-primary">
              <I18nLink href={page.primaryCtaHref}>
                {page.primaryCtaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </I18nLink>
            </Button>
          </div>
        </div>
      </section>

      {page.contentBlocks && page.contentBlocks.length > 0 ? (
        <section className="w-full py-16">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                {page.contentBlocksTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {page.contentBlocksDescription}
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {page.contentBlocks.map((block) => (
                <div
                  key={block.title}
                  className="rounded-3xl border border-border/70 bg-background p-6 shadow-sm shadow-black/5"
                >
                  <h3 className="text-xl font-semibold">{block.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {block.description}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {block.bullets.map((bullet) => (
                      <li key={bullet} className="text-sm leading-6 text-foreground/90">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <InternalLinksSection
        eyebrow={copy.guideTemplate.relatedEyebrow}
        title={copy.guideTemplate.relatedTitle}
        description={copy.guideTemplate.relatedDescription}
        links={getLocalizedInternalLinks(locale, page.relatedLinkIds)}
      />
    </div>
  );
}
