"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserType } from "@/types/admin/users";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export const columns: ColumnDef<UserType>[] = [
  {
    accessorKey: "avatar_url",
    header: "Avatar",
    cell: ({ row }) => {
      const avatarUrl = row.original.avatar_url;
      const fullName = row.original.full_name || row.original.email;
      return (
        <Avatar>
          <AvatarImage src={avatarUrl || undefined} alt={fullName} />
          <AvatarFallback>{fullName[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span
        className="cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(row.original.email);
          toast.success("Copied to clipboard");
        }}
      >
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "full_name",
    header: "Full Name",
    cell: ({ row }) => row.original.full_name || "-",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span
        className={`capitalize ${
          row.original.role === "admin" ? "text-primary font-medium" : ""
        }`}
      >
        {row.original.role}
      </span>
    ),
  },
  {
    accessorKey: "stripe_customer_id",
    header: "Stripe Customer ID",
    cell: ({ row }) => (
      <span
        className="cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(row.original.stripe_customer_id || "");
          toast.success("Copied to clipboard");
        }}
      >
        {row.original.stripe_customer_id || "-"}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) =>
      dayjs(row.original.created_at).format("YYYY-MM-DD HH:mm"),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.email)}
            >
              Copy email
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(user.stripe_customer_id || "")
              }
            >
              Copy Stripe Customer ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
