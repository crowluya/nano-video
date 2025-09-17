import HeaderLinks from "@/components/header/HeaderLinks";
import MobileMenu from "@/components/header/MobileMenu";
import { UserAvatar } from "@/components/header/UserAvatar";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link as I18nLink } from "@/i18n/routing";
import { getSession } from "@/lib/auth/server";
import { user as userSchema } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
type User = typeof userSchema.$inferSelect;

const Header = async () => {
  const t = await getTranslations("Home");
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="py-2 px-6 backdrop-blur-md sticky top-0 z-50">
      <nav className="flex justify-between items-center w-full mx-auto">
        <div className="flex items-center space-x-6 md:space-x-12">
          <I18nLink
            href="/"
            title={t("title")}
            prefetch={true}
            className="flex items-center space-x-1"
          >
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className={cn("text-md font-medium")}>{t("title")}</span>
          </I18nLink>

          <HeaderLinks />
        </div>

        <div className="flex items-center gap-x-2 flex-1 justify-end">
          {/* PC */}
          <div className="hidden lg:flex items-center gap-x-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <UserAvatar user={user as User} />
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-x-2">
            <UserAvatar user={user as User} />
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
