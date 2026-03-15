import { InternalLinksSection } from "@/components/seo/InternalLinksSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as I18nLink } from "@/i18n/routing";
import { Locale } from "@/i18n/routing";
import { getLocalizedInternalLinks, getInternalLinksUiCopy } from "@/lib/seo/internal-links-localized";
import { SeoLandingPageConfig } from "@/lib/seo/internal-links";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface SeoLandingPageProps {
  page: SeoLandingPageConfig;
  locale: Locale | string;
}

export function SeoLandingPage({ page, locale }: SeoLandingPageProps) {
  const copy = getInternalLinksUiCopy(locale);

  return (
    <div className="w-full">
      <section className="w-full border-b border-border/60 bg-linear-to-b from-primary/8 via-background to-background">
        <div className="container mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            {page.badge}
          </Badge>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {page.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            {page.description}
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

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {page.highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-border/70 bg-background/85 p-5 shadow-sm shadow-black/5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <p className="text-sm font-medium leading-6">{highlight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-16">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {page.audienceTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {page.audienceDescription}
            </p>
          </div>
          <div className="grid gap-4">
            {page.audienceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border/70 bg-muted/30 p-6"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/70 bg-muted/30 p-8 sm:p-10">
            <h2 className="text-3xl font-semibold tracking-tight">
              {page.workflowTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              {page.workflowDescription}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {page.workflowSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-border/70 bg-background p-6"
                >
                  <p className="text-sm font-medium text-primary">
                    {copy.landingTemplate.stepLabel} {index + 1}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground/90">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button asChild variant="ghost" className="px-0 text-primary">
                <I18nLink href={page.primaryCtaHref}>
                  {page.primaryCtaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </I18nLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {page.contentBlocks && page.contentBlocks.length > 0 ? (
        <section className="w-full py-16">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
                      <li key={bullet} className="flex items-start gap-3 text-sm leading-6">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {page.comparisonCards && page.comparisonCards.length > 0 ? (
        <section className="w-full py-16">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                {page.comparisonTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {page.comparisonDescription}
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {page.comparisonCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-border/70 bg-muted/30 p-6"
                >
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {card.summary}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {card.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm leading-6">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {page.exampleCards && page.exampleCards.length > 0 ? (
        <section className="w-full py-16">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                {page.exampleTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {page.exampleDescription}
              </p>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-3">
              {page.exampleCards.map((example) => (
                <div
                  key={example.title}
                  className="rounded-3xl border border-border/70 bg-background p-6 shadow-sm shadow-black/5"
                >
                  <h3 className="text-xl font-semibold">{example.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {example.scenario}
                  </p>
                  <div className="mt-5 rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      Prompt
                    </p>
                    <p className="mt-3 text-sm leading-6 whitespace-pre-line">
                      {example.prompt}
                    </p>
                  </div>
                  <div className="mt-5 space-y-3 text-sm leading-6">
                    <p>
                      <span className="font-medium">Why it works:</span>{" "}
                      <span className="text-muted-foreground">{example.whyItWorks}</span>
                    </p>
                    <p>
                      <span className="font-medium">Next step:</span>{" "}
                      <span className="text-muted-foreground">{example.nextStep}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <InternalLinksSection
        eyebrow={copy.landingTemplate.relatedEyebrow}
        title={copy.landingTemplate.relatedTitle}
        description={copy.landingTemplate.relatedDescription}
        links={getLocalizedInternalLinks(locale, page.relatedLinkIds)}
      />

      <section className="w-full py-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            {copy.landingTemplate.faqTitle}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {copy.landingTemplate.faqDescription}
          </p>

          <Accordion type="single" collapsible className="mt-10 rounded-2xl border px-6">
            {page.faqItems.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left text-base hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
