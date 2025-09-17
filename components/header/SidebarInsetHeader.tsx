import LocaleSwitcher from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import HeaderLinks from "@/components/header/HeaderLinks";
import MobileMenu from "@/components/header/MobileMenu";
import { UserAvatar } from "@/components/header/UserAvatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth/server";
import { user as userSchema } from "@/lib/db/schema";

type User = typeof userSchema.$inferSelect;

export default async function SidebarInsetHeader() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="w-full py-2 px-4 backdrop-blur-md sticky top-0 z-50">
      <nav className="flex justify-between items-center w-full mx-auto">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
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
          <div className="flex lg:hidden">
            <UserAvatar user={user as User} />
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
