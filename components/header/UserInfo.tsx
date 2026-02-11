"use client";

import { DynamicIcon } from "@/components/DynamicIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth/auth-client";
import { user as userSchema } from "@/lib/db/schema";
import { ExternalLink, LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type Menu = {
  name: string;
  href: string;
  target?: string;
  icon?: string;
};

type User = typeof userSchema.$inferSelect;

interface UserInfoProps {
  user: User;
  renderContainer?: (children: React.ReactNode) => React.ReactNode;
}

export function UserInfo({ renderContainer, user }: UserInfoProps) {
  const router = useRouter();

  const t = useTranslations("Login");

  const userMenusAll: Menu[] = t.raw("UserMenus");
  const userMenus = userMenusAll.filter(
    (menu) => menu.href !== "/dashboard/image-gen" && menu.href !== "/dashboard/video-gen"
  );
  const adminMenus: Menu[] = t.raw("AdminMenus");

  if (!user) {
    return null;
  }

  const fallbackLetter = user.email[0].toUpperCase();

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh();
        },
      },
    });
  };

  const userInfoContent = (
    <>
      <div>
        <div className="flex items-center space-x-2 pb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback>{fallbackLetter}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium leading-none">
              {user.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <DropdownMenuSeparator />

      {userMenus.map((menu) => (
        <DropdownMenuItem
          key={menu.name}
          onClick={() => {
            if (menu.target) {
              window.open(menu.href, "_blank");
            } else {
              router.push(menu.href);
            }
          }}
          className="cursor-pointer flex items-center gap-x-2"
        >
          {menu.icon ? (
            <DynamicIcon name={menu.icon} className="h-4 w-4" />
          ) : (
            <span>{menu.name.slice(0, 1)}</span>
          )}
          <span>{menu.name}</span>
          {menu.target && <ExternalLink className="w-4 h-4" />}
        </DropdownMenuItem>
      ))}

      {user.role === "admin" && (
        <>
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            Admin Menu
          </DropdownMenuLabel>
          {adminMenus.map((menu) => (
            <DropdownMenuItem
              key={menu.name}
              onClick={() => router.push(menu.href)}
              className="cursor-pointer flex items-center gap-x-2"
            >
              {menu.icon ? (
                <DynamicIcon name={menu.icon} className="h-4 w-4" />
              ) : (
                <span>{menu.name.slice(0, 1)}</span>
              )}
              <span>{menu.name}</span>
            </DropdownMenuItem>
          ))}
        </>
      )}

      <DropdownMenuItem
        onClick={() => signOut()}
        className="cursor-pointer text-red-600 dark:text-red-400"
      >
        <LogOutIcon /> {t("Button.signOut")}
      </DropdownMenuItem>
    </>
  );

  if (renderContainer) {
    return renderContainer(userInfoContent);
  }

  return userInfoContent;
}
