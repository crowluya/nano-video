import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PriceListActions } from "./PriceListActions";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

export const columns: ColumnDef<PricingPlan>[] = [
  {
    accessorKey: "environment",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Environment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const environment = row.getValue("environment") as string;
      const variant = environment === "live" ? "default" : "secondary";
      return (
        <Badge variant={variant} className="capitalize">
          {environment}
        </Badge>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "cardTitle",
    header: "Title",
    minSize: 200,
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("cardTitle")}</span>
    ),
  },
  {
    accessorKey: "stripePriceId",
    header: "Stripe Price ID",
    cell: ({ row }) => {
      const priceId = row.getValue("stripePriceId");
      const environment = row.original.environment;
      const stripeLink = priceId
        ? `https://dashboard.stripe.com/${
            environment === "live" ? "" : "test/"
          }prices/${priceId}`
        : null;

      return priceId ? (
        <div className="flex items-center space-x-1">
          <code className="text-xs">{priceId as string}</code>
          {stripeLink && (
            <Link
              href={stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Stripe Dashboard"
              prefetch={false}
            >
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
            </Link>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "paymentType",
    header: "Payment Type",
    minSize: 200,
    cell: ({ row }) => {
      const paymentType = row.getValue("paymentType") as string | null;
      const interval = row.original.recurringInterval;
      if (paymentType === "recurring" && interval) {
        return (
          <span className="capitalize">
            {paymentType} ({interval})
          </span>
        );
      }
      return paymentType ? (
        <span className="capitalize">{paymentType}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      return <div className="font-medium">{row.original.displayPrice}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "displayOrder",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-center w-full justify-center"
        >
          Order
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("displayOrder")}</div>;
    },
    enableSorting: true,
    size: 50,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return isActive ? (
        <Badge variant="default">Active</Badge>
      ) : (
        <Badge variant="destructive">Inactive</Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "benefitsJsonb",
    header: "Benefits",
    minSize: 300,
    cell: ({ row }) => {
      const benefits = row.getValue("benefitsJsonb") as object | null;
      const benefitsString = benefits ? JSON.stringify(benefits) : "-";
      const displayString =
        benefitsString.length > 50
          ? benefitsString.substring(0, 47) + "..."
          : benefitsString;

      return benefits && Object.keys(benefits).length > 0 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <code className="text-xs">{displayString}</code>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <pre className="text-xs">{JSON.stringify(benefits, null, 2)}</pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const plan = row.original;

      return <PriceListActions plan={plan as PricingPlan} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
];
