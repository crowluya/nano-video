"use client";

import {
  ColumnDef,
  ColumnPinningState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { getOrders, GetOrdersResult } from "@/actions/orders/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  initialData: TData[];
  initialPageCount: number;
  pageSize: number;
  totalCount: number;
}

const ORDER_PROVIDERS = ["stripe"];
const ORDER_TYPES = [
  "one_time_purchase",
  "subscription_initial",
  "subscription_renewal",
  "refund",
];
const ORDER_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "active",
  "canceled",
  "refunded",
  "past_due",
  "incomplete",
];

export function OrdersDataTable<TData, TValue>({
  columns,
  initialData,
  initialPageCount,
  pageSize,
  totalCount,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 500);
  const [provider, setProvider] = useState("");
  const [orderType, setOrderType] = useState("");
  const [status, setStatus] = useState("");
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["id", "users"],
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [data, setData] = useState<TData[]>(initialData);
  const [pageCount, setPageCount] = useState<number>(initialPageCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initialLoad = useMemo(
    () =>
      !debouncedGlobalFilter &&
      !provider &&
      !orderType &&
      !status &&
      pagination.pageIndex === 0,
    [debouncedGlobalFilter, provider, orderType, status, pagination.pageIndex]
  );

  useEffect(() => {
    if (!initialLoad) {
      if (pagination.pageIndex !== 0) {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
    }
  }, [
    debouncedGlobalFilter,
    provider,
    orderType,
    status,
    initialLoad,
    pagination.pageIndex,
  ]);

  useEffect(() => {
    if (initialLoad) {
      if (data !== initialData) {
        setData(initialData);
        setPageCount(initialPageCount);
      }
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result: GetOrdersResult = await getOrders({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          filter: debouncedGlobalFilter,
          provider: provider || undefined,
          orderType: orderType || undefined,
          status: status || undefined,
        });
        if (result.success) {
          setData(result.data?.orders as TData[]);
          setPageCount(
            Math.ceil((result.data?.totalCount || 0) / pagination.pageSize)
          );
        } else {
          toast.error("Failed to fetch data", {
            description: result.error,
          });
          setData([]);
          setPageCount(0);
        }
      } catch (error: any) {
        toast.error("Failed to fetch data", {
          description: error.message,
        });
        setData([]);
        setPageCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    debouncedGlobalFilter,
    provider,
    orderType,
    status,
    pagination.pageIndex,
    pagination.pageSize,
    initialData,
    initialLoad,
    initialPageCount,
  ]);

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount,
    state: {
      sorting,
      pagination,
      columnPinning,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    debugTable: process.env.NODE_ENV === "development",
  });

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search by Email, Order ID..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Select
            value={provider || "all"}
            onValueChange={(value) => setProvider(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {ORDER_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={orderType || "all"}
            onValueChange={(value) =>
              setOrderType(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ORDER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status || "all"}
            onValueChange={(value) => setStatus(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="relative min-h-[200px] max-h-[calc(100vh-200px)] overflow-auto rounded-md border">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                        position: header.column.getIsPinned()
                          ? "sticky"
                          : "relative",
                        left:
                          header.column.getIsPinned() === "left"
                            ? `${header.column.getStart("left")}px`
                            : undefined,
                        right:
                          header.column.getIsPinned() === "right"
                            ? `${header.column.getAfter("right")}px`
                            : undefined,
                        zIndex: header.column.getIsPinned() ? 20 : 1,
                        backgroundColor: "hsl(var(--background))",
                        boxShadow:
                          header.column.getIsPinned() === "left" &&
                          header.column.getIsLastColumn("left")
                            ? "2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                            : header.column.getIsPinned() === "right" &&
                                header.column.getIsFirstColumn("right")
                              ? "-2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                              : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize,
                        position: cell.column.getIsPinned()
                          ? "sticky"
                          : "relative",
                        left:
                          cell.column.getIsPinned() === "left"
                            ? `${cell.column.getStart("left")}px`
                            : undefined,
                        right:
                          cell.column.getIsPinned() === "right"
                            ? `${cell.column.getAfter("right")}px`
                            : undefined,
                        zIndex: cell.column.getIsPinned() ? 20 : 1,
                        backgroundColor: "hsl(var(--background))",
                        boxShadow:
                          cell.column.getIsPinned() === "left" &&
                          cell.column.getIsLastColumn("left")
                            ? "2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                            : cell.column.getIsPinned() === "right" &&
                                cell.column.getIsFirstColumn("right")
                              ? "-2px 0 4px -2px rgba(0, 0, 0, 0.1)"
                              : undefined,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {isLoading ? "" : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} ({totalCount} Orders)
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
