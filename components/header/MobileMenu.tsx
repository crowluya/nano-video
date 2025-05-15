"use client";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link as I18nLink, useRouter } from "@/i18n/routing";
import { HeaderLink } from "@/types/common";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { UserInfo } from "./UserInfo";

export default function MobileMenu() {
  const t = useTranslations("Home");
  const tHeader = useTranslations("Header");
  const { user, signOut } = useAuth();
  const router = useRouter();

  const headerLinks: HeaderLink[] = tHeader.raw("links");

  return (
    <div className="flex items-center md:hidden">
      <LocaleSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2">
          <Menu className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <I18nLink
              href="/"
              prefetch={true}
              className="flex items-center space-x-1 font-bold"
            >
              <Image
                alt={t("title")}
                src="/logo.svg"
                className="w-6 h-6"
                width={32}
                height={32}
              />
              <span className="gradient-text">{t("title")}</span>
            </I18nLink>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user ? (
            <>
              <UserInfo
                mobile
                renderContainer={(children) => (
                  <DropdownMenuLabel className="font-normal">
                    {children}
                  </DropdownMenuLabel>
                )}
              />
            </>
          ) : (
            <DropdownMenuItem asChild>
              <UserInfo mobile />
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {headerLinks.map((link) => (
              <DropdownMenuItem key={link.name}>
                <I18nLink href={link.href} title={link.name} prefetch={true}>
                  {link.name}
                </I18nLink>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="p-2 focus:bg-transparent justify-end">
              <div className="flex items-center gap-x-4">
                <ThemeToggle />
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
