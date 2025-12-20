"use client";

import type { ActivityLog } from "@/actions/usage/activity-logs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";

const formatAction = (action: string) => {
  const actionMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    "video_generation_started": { label: "Video Generation Started", variant: "secondary" },
    "video_generation_failed": { label: "Video Generation Failed", variant: "destructive" },
    "video_generation_failed_refunded": { label: "Video Generation Failed (Refunded)", variant: "destructive" },
    "image_generation_started": { label: "Image Generation Started", variant: "secondary" },
    "image_generation_failed": { label: "Image Generation Failed", variant: "destructive" },
    "music_generation_started": { label: "Music Generation Started", variant: "secondary" },
    "music_generation_failed": { label: "Music Generation Failed", variant: "destructive" },
    "credits_purchased": { label: "Credits Purchased", variant: "default" },
    "credits_refunded": { label: "Credits Refunded", variant: "outline" },
  };

  const mapped = actionMap[action];
  if (mapped) {
    return (
      <Badge variant={mapped.variant}>
        {mapped.label}
      </Badge>
    );
  }

  // Format action name (convert snake_case to Title Case)
  const formatted = action
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return <Badge variant="outline">{formatted}</Badge>;
};

export const getColumns = (
  t: (key: string) => string
): ColumnDef<ActivityLog>[] => [
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => (
      <div>
        {dayjs(row.getValue("createdAt")).format("YYYY-MM-DD HH:mm:ss")}
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => formatAction(row.getValue("action")),
  },
  {
    accessorKey: "resourceType",
    header: "Resource Type",
    cell: ({ row }) => {
      const type = row.getValue("resourceType") as string | null;
      return type ? (
        <Badge variant="outline">{type}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "resourceId",
    header: "Resource ID",
    cell: ({ row }) => {
      const id = row.getValue("resourceId") as string | null;
      return id ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[150px] truncate font-mono text-xs">
                {id}
              </div>
            </TooltipTrigger>
            <TooltipContent>{id}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "metadata",
    header: "Details",
    cell: ({ row }) => {
      const metadata = row.getValue("metadata") as Record<string, any> | null;
      if (!metadata || Object.keys(metadata).length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      const preview = JSON.stringify(metadata).slice(0, 50);
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[200px] truncate text-xs">
                {preview}
                {JSON.stringify(metadata).length > 50 ? "..." : ""}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
];

