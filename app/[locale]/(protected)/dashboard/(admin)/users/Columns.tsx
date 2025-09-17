"use client";

import { banUser, unbanUser } from "@/actions/users/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { user as userSchema } from "@/lib/db/schema";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type UserType = typeof userSchema.$inferSelect;

const BanUserDialog = ({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [banReason, setBanReason] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setBanReason("");
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban user</DialogTitle>
          <DialogDescription>
            This will immediately ban {user.email || user.id}. You can provide
            an optional reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`ban-reason-${user.id}`}>Reason (optional)</Label>
          <Textarea
            id={`ban-reason-${user.id}`}
            placeholder="Reason for ban..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const res = await banUser({
                  userId: user.id,
                  reason: banReason || undefined,
                });
                if (res.success) {
                  toast.success("User banned");
                  onOpenChange(false);
                  router.refresh();
                } else {
                  toast.error("Failed to ban", {
                    description: res.error,
                  });
                }
              });
            }}
          >
            Confirm ban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UnbanUserDialog = ({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unban user</DialogTitle>
          <DialogDescription>
            Are you sure you want to unban {user.email || user.id}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const res = await unbanUser({ userId: user.id });
                if (res.success) {
                  toast.success("User unbanned");
                  onOpenChange(false);
                  router.refresh();
                } else {
                  toast.error("Failed to unban", {
                    description: res.error,
                  });
                }
              });
            }}
          >
            Unban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<UserType>[] = [
  {
    accessorKey: "image",
    header: "Avatar",
    cell: ({ row }) => {
      const image = row.original.image;
      const name = row.original.name || row.original.email;
      return (
        <Avatar>
          <AvatarImage src={image || undefined} alt={name} />
          <AvatarFallback>{name[0].toUpperCase()}</AvatarFallback>
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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.original.name || "-",
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
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const { banned, banReason, emailVerified, isAnonymous } = row.original;
      if (banned) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive">Banned</Badge>
              </TooltipTrigger>
              {banReason && (
                <TooltipContent>
                  <p>{banReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      }

      if (isAnonymous) {
        return <Badge variant="outline">Anonymous</Badge>;
      }

      if (emailVerified) {
        return <Badge variant="secondary">Verified</Badge>;
      } else {
        return <Badge variant="outline">Unverified</Badge>;
      }
    },
  },
  {
    accessorKey: "stripeCustomerId",
    header: "Stripe Customer ID",
    cell: ({ row }) => (
      <span
        className="cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(row.original.stripeCustomerId || "");
          toast.success("Copied to clipboard");
        }}
      >
        {row.original.stripeCustomerId || "-"}
      </span>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => dayjs(row.original.updatedAt).format("YYYY-MM-DD HH:mm"),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => dayjs(row.original.createdAt).format("YYYY-MM-DD HH:mm"),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const user = row.original;
      const [openBan, setOpenBan] = useState(false);
      const [openUnban, setOpenUnban] = useState(false);

      return (
        <>
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
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  toast.success("Copied to clipboard");
                }}
              >
                Copy user ID
              </DropdownMenuItem>
              {user.banned ? (
                <DropdownMenuItem onClick={() => setOpenUnban(true)}>
                  Unban user
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    if (user.role === "admin") {
                      toast.error("Cannot ban admin users");
                      return;
                    }
                    setOpenBan(true);
                  }}
                >
                  Ban user
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <BanUserDialog open={openBan} onOpenChange={setOpenBan} user={user} />
          <UnbanUserDialog
            open={openUnban}
            onOpenChange={setOpenUnban}
            user={user}
          />
        </>
      );
    },
  },
];
