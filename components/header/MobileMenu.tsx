"use client";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link as I18nLink } from "@/i18n/routing";
import { getLocalizedInternalLinks, getInternalLinksUiCopy } from "@/lib/seo/internal-links-localized";
import { HeaderLink } from "@/types/common";
import { Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export default function MobileMenu() {
  const t = useTranslations("Home");
  const tHeader = useTranslations("Header");
  const locale = useLocale();
  const copy = getInternalLinksUiCopy(locale);

  const headerLinks: HeaderLink[] = tHeader.raw("links");
  const pricingLink = headerLinks.find((link) => link.id === "pricing");
  if (pricingLink) {
    pricingLink.href = process.env.NEXT_PUBLIC_PRICING_PATH!;
  }

  const exploreLinks: HeaderLink = {
    name: copy.navExplore,
    href: "#",
    items: getLocalizedInternalLinks(locale, [
      "videoGenerator",
      "imageToVideo",
      "textToVideo",
      "videoPrompts",
      "videoFree",
      "videoPricingLimits",
    ]).map((link) => ({
      name: link.title,
      href: link.href,
      description: link.description,
    })),
  };

  const guideLinks: HeaderLink = {
    name: copy.navGuides,
    href: "#",
    items: getLocalizedInternalLinks(locale, [
      "guideHowTo",
      "guideBestPrompts",
      "guideSettingsLimits",
    ]).map((link) => ({
      name: link.title,
      href: link.href,
      description: link.description,
    })),
  };

  const blogIndex = headerLinks.findIndex((link) => link.href === "/blog");
  if (!headerLinks.some((link) => link.name === exploreLinks.name)) {
    if (blogIndex >= 0) {
      headerLinks.splice(blogIndex, 0, exploreLinks, guideLinks);
    } else {
      headerLinks.push(exploreLinks, guideLinks);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>
          <I18nLink
            href="/"
            title={t("title")}
            prefetch={true}
            className="flex items-center space-x-1 font-bold"
          >
            <Image
              alt={t("title")}
              src="/logo.png"
              className="w-6 h-6"
              width={32}
              height={32}
            />
            <span>{t("title")}</span>
          </I18nLink>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {headerLinks.map((link) =>
            link.items ? (
              <DropdownMenuSub key={link.name}>
                <DropdownMenuSubTrigger className="px-2 py-1.5">
                  {link.name}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {link.items.map((child) => (
                    <DropdownMenuItem key={child.name}>
                      <I18nLink
                        href={child.href}
                        title={child.name}
                        prefetch={
                          child.target && child.target === "_blank"
                            ? false
                            : true
                        }
                        target={child.target || "_self"}
                        rel={child.rel || undefined}
                        className="flex flex-col gap-y-1"
                      >
                        <span>{child.name}</span>
                        {child.description && (
                          <span className="text-xs text-muted-foreground">
                            {child.description}
                          </span>
                        )}
                      </I18nLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem key={link.name}>
                <I18nLink
                  href={link.href}
                  title={link.name}
                  prefetch={
                    link.target && link.target === "_blank" ? false : true
                  }
                  target={link.target || "_self"}
                  rel={link.rel || undefined}
                >
                  {link.name}
                </I18nLink>
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
