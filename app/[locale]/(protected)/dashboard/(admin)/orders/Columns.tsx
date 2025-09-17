"use client";

import { Badge } from "@/components/ui/badge";
import { OrderWithUser } from "@/types/admin/orders";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { toast } from "sonner";

export const columns: ColumnDef<OrderWithUser>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return (
        <div
          className="max-w-[200px] truncate cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(id);
            toast.success("Copied ID to clipboard");
          }}
        >
          {id}
        </div>
      );
    },
  },
  {
    accessorKey: "users",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.users;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{user?.name}</span>
          <span
            className="text-muted-foreground cursor-pointer"
            onClick={() => {
              if (user?.email) {
                navigator.clipboard.writeText(user.email);
                toast.success("Copied email to clipboard");
              }
            }}
          >
            {user?.email}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "provider",
    header: "Provider",
    cell: ({ row }) => {
      return <span className="font-mono">{row.original.provider}</span>;
    },
  },
  {
    accessorKey: "providerOrderId",
    header: "Provider Order ID",
    cell: ({ row }) => {
      const providerOrderId = row.getValue("providerOrderId") as string;
      return (
        <div
          className="max-w-[200px] truncate cursor-pointer"
          onClick={() => {
            if (providerOrderId) {
              navigator.clipboard.writeText(providerOrderId);
              toast.success("Copied Provider Order ID to clipboard");
            }
          }}
        >
          {providerOrderId}
        </div>
      );
    },
  },
  {
    accessorKey: "amountTotal",
    header: "Amount",
    cell: ({ row }) => (
      <div className="flex flex-col w-[120px]">
        <span>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: row.original.currency,
          }).format(Number(row.original.amountTotal))}
        </span>
        {row.original.amountDiscount ? (
          <span className="text-xs text-muted-foreground">
            Discount:{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: row.original.currency,
            }).format(Number(row.original.amountDiscount))}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "orderType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.orderType}</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "secondary" | "destructive" | "outline" = "outline";
      if (status === "succeeded" || status === "active") {
        variant = "secondary";
      } else if (
        status === "failed" ||
        status === "canceled" ||
        status === "past_due"
      ) {
        variant = "destructive";
      }
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as string | Date;
      try {
        return date ? (
          <div className="w-[180px]">
            {dayjs(date).format("YYYY-MM-DD HH:mm:ss")}
          </div>
        ) : (
          "-"
        );
      } catch {
        return "-";
      }
    },
  },
];
