"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link as I18nLink, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { HeaderLink } from "@/types/common";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

const HeaderLinks = () => {
  const tHeader = useTranslations("Header");
  const pathname = usePathname();

  const headerLinks: HeaderLink[] = tHeader.raw("links");
  const pricingLink = headerLinks.find((link) => link.id === "pricing");
  if (pricingLink) {
    pricingLink.href = process.env.NEXT_PUBLIC_PRICING_PATH!;
  }

  const promptGeneratorLink = headerLinks.find(
    (link) => link.href === "/prompt-generator"
  );
  if (promptGeneratorLink) {
    promptGeneratorLink.href = "/#prompt-generator";
  }

  const scrollToSection = (sectionId: string) => {
    const byId = document.getElementById(sectionId);
    if (byId) {
      byId.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }

    // Fallback to finding by heading text
    const headingMap: Record<string, string> = {
      "prompt-generator": "Prompt Generator",
      "image-demo": "nano banana image generator",
      "video-demo": "nano banana video generator",
    };

    const headingText = headingMap[sectionId];
    if (headingText) {
      const heading = Array.from(document.querySelectorAll("h1,h2,h3,h4"))
        .find((el) => (el.textContent || "").trim().toLowerCase().includes(headingText.toLowerCase()));
      if (heading) {
        const container = heading.closest("section") || heading.closest("div");
        const target = container || heading;
        if (target instanceof HTMLElement) {
          if (!target.id) {
            target.id = sectionId;
          }
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return true;
        }
      }
    }

    return false;
  };

  return (
    <NavigationMenu viewport={false} className="hidden lg:block">
      <NavigationMenuList className="flex-wrap">
        {headerLinks.map((link) => (
          <NavigationMenuItem key={link.name}>
            {link.items ? (
              <>
                <NavigationMenuTrigger className="bg-transparent rounded-xl px-4 py-2 flex items-center gap-x-1 hover:bg-accent-foreground/10 hover:text-accent-foreground text-sm font-normal text-muted-foreground">
                  {link.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-[250px] gap-1">
                    {link.items.map((child) => (
                      <li
                        key={child.name}
                        className="hover:bg-accent-foreground/10"
                      >
                        <NavigationMenuLink asChild>
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
                            className={cn(
                              "flex flex-col gap-y-1 text-sm text-muted-foreground hover:text-accent-foreground"
                            )}
                          >
                            <div className="flex items-center gap-x-1">
                              {child.name}
                              {child.target === "_blank" && (
                                <span className="text-xs">
                                  <ExternalLink className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                            {child.description && (
                              <div className="text-xs text-muted-foreground">
                                {child.description}
                              </div>
                            )}
                          </I18nLink>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <I18nLink
                key={link.name}
                href={link.href}
                title={link.name}
                onClick={(e) => {
                  const anchorLinks = ["/#prompt-generator", "/#image-demo"];
                  const isAnchorLink = anchorLinks.some(anchor => link.href === anchor);
                  if (!isAnchorLink) return;
                  if (!pathname || pathname !== "/") return;
                  e.preventDefault();

                  const sectionId = link.href.replace("/#", "");
                  const ok = scrollToSection(sectionId);
                  window.history.replaceState(null, "", ok ? link.href : "/#video-demo");

                  if (!ok) {
                    const byVideoDemo = document.getElementById("video-demo");
                    if (byVideoDemo) {
                      byVideoDemo.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }
                }}
                prefetch={
                  link.target && link.target === "_blank" ? false : true
                }
                target={link.target || "_self"}
                rel={link.rel || undefined}
                className={cn(
                  "bg-transparent rounded-xl px-4 py-2 flex items-center gap-x-1 text-sm font-normal text-muted-foreground hover:bg-accent-foreground/10 hover:text-accent-foreground",
                  pathname === link.href && "font-medium text-accent-foreground"
                )}
              >
                {link.name}
                {link.target === "_blank" && (
                  <span className="text-xs">
                    <ExternalLink className="w-4 h-4" />
                  </span>
                )}
              </I18nLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default HeaderLinks;
