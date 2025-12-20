"use client";

import { ActivityLog, getActivityLogs } from "@/actions/usage/activity-logs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getColumns } from "./Columns";

interface ActivityLogsDataTableProps {
  initialData: ActivityLog[];
  initialTotalCount: number;
  pageSize?: number;
}

export function ActivityLogsDataTable({
  initialData,
  initialTotalCount,
  pageSize = 20,
}: ActivityLogsDataTableProps) {
  const t = useTranslations("ActivityLogs");

  const [data, setData] = useState<ActivityLog[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageCount = useMemo(
    () => Math.ceil(totalCount / pagination.pageSize),
    [totalCount, pagination.pageSize]
  );

  const columns = useMemo(() => getColumns(t), [t]);

  useEffect(() => {
    const fetchPage = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getActivityLogs({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        });
        if (result.success && result.data) {
          setData(result.data.logs);
          setTotalCount(result.data.count);
        } else {
          throw new Error(result.error || "Failed to load activity logs");
        }
      } catch (err: any) {
        const errorMessage = err.message || "Failed to load activity logs";
        setError(errorMessage);
        toast.error("Error", { description: errorMessage });
        setData([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [pagination.pageIndex, pagination.pageSize]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
  });

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-600 bg-red-100 border border-red-400 rounded p-4 flex items-center space-x-2 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
      )}

      <div className="rounded-md border relative min-h-[200px] max-h-[calc(100vh-270px)] overflow-y-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length
              ? table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No activity logs found
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} ({totalCount} Logs)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

