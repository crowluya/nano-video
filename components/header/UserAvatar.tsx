"use client";

import LoginButton from "@/components/header/LoginButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { user as userSchema } from "@/lib/db/schema";
import { UserInfo } from "./UserInfo";

type User = typeof userSchema.$inferSelect;

export function UserAvatar({ user }: { user: User }) {
  if (!user) {
    return <LoginButton />;
  }

  const fallbackLetter = user.email[0].toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback>{fallbackLetter}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <UserInfo
          user={user}
          renderContainer={(children) => (
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">{children}</div>
            </DropdownMenuLabel>
          )}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
