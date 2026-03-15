import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link as I18nLink } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { InternalLinkItem } from "@/lib/seo/internal-links";

interface InternalLinksSectionProps {
  title: string;
  description: string;
  links: InternalLinkItem[];
  eyebrow?: string;
  className?: string;
  columns?: 2 | 3;
}

export function InternalLinksSection({
  title,
  description,
  links,
  eyebrow,
  className,
  columns = 3,
}: InternalLinksSectionProps) {
  return (
    <section className={cn("w-full py-16", className)}>
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
        </div>

        <div
          className={cn(
            "mt-10 grid gap-6",
            columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"
          )}
        >
          {links.map((link) => (
            <Card
              key={link.href}
              className="border-border/70 bg-background/90 shadow-sm shadow-black/5"
            >
              <CardHeader>
                <CardTitle className="text-xl">{link.title}</CardTitle>
                <CardDescription className="text-sm leading-6">
                  {link.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                <Button asChild variant="outline" className="w-full justify-between">
                  <I18nLink href={link.href}>
                    {link.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </I18nLink>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
