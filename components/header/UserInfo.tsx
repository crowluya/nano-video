"use client";

import { BenefitsErrorBoundary } from "@/components/layout/BenefitsErrorBoundary";
import CurrentUserBenefitsDisplay from "@/components/layout/CurrentUserBenefitsDisplay";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

type Menu = {
  name: string;
  href: string;
};

interface UserInfoProps {
  mobile?: boolean;
  renderContainer?: (children: React.ReactNode) => React.ReactNode;
}

export function UserInfo({ mobile = false, renderContainer }: UserInfoProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const t = useTranslations("Login");

  const userMenus: Menu[] = t.raw("UserMenus");

  const adminMenus: Menu[] = t.raw("AdminMenus");

  if (!user) {
    return (
      <Button
        onClick={() => router.push("/login")}
        variant="outline"
        className={`gradient-bg text-white hover:text-white rounded-lg font-medium text-center hover:opacity-90 shadow-lg ${
          mobile ? "w-full" : ""
        }`}
      >
        {t("Button.signIn")}
      </Button>
    );
  }

  const isStripeEnabled = process.env.NEXT_PUBLIC_ENABLE_STRIPE === "true";

  const BenefitsLoadingFallback = () => (
    <Skeleton className="h-6 w-20 rounded-md" />
  );
  const BenefitsErrorFallback = () => (
    <div className="text-xs text-destructive">Error loading info</div>
  );

  const fallbackLetter = (user.email || "N")[0].toUpperCase();
  const userInfoContent = (
    <>
      <div>
        <div className="flex items-center space-x-2 pb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{fallbackLetter}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        {isStripeEnabled && (
          <div className="pt-1 pb-2">
            <BenefitsErrorBoundary fallback={<BenefitsErrorFallback />}>
              <Suspense fallback={<BenefitsLoadingFallback />}>
                <CurrentUserBenefitsDisplay />
              </Suspense>
            </BenefitsErrorBoundary>
          </div>
        )}
      </div>

      <DropdownMenuSeparator />

      {userMenus.map((menu) => (
        <DropdownMenuItem
          key={menu.name}
          onClick={() => router.push(menu.href)}
          className="cursor-pointer"
        >
          {menu.name}
        </DropdownMenuItem>
      ))}
      {/* </>
      )} */}

      {user.role === "admin" && (
        <>
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
            Admin Menu
          </DropdownMenuLabel>
          {adminMenus.map((menu) => (
            <DropdownMenuItem
              key={menu.name}
              onClick={() => router.push(menu.href)}
              className="cursor-pointer"
            >
              {menu.name}
            </DropdownMenuItem>
          ))}
        </>
      )}

      <DropdownMenuItem
        onClick={() => signOut()}
        className="cursor-pointer text-red-600 dark:text-red-400"
      >
        {t("Button.signOut")}
      </DropdownMenuItem>
    </>
  );

  if (renderContainer) {
    return renderContainer(userInfoContent);
  }

  return userInfoContent;
}
