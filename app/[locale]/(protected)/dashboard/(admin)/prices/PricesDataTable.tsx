"use client";

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
import { Link as I18nLink } from "@/i18n/routing";
import { pricingPlans as pricingPlansSchema } from "@/lib/db/schema";
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { columns } from "./Columns";

type PricingPlan = typeof pricingPlansSchema.$inferSelect;

const PAGE_SIZE = 20;

interface DataTableProps<TData extends PricingPlan, TValue> {
  data: TData[];
}

export function PricesDataTable<TData extends PricingPlan, TValue>({
  data,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations("Prices.PricesDataTable");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["environment", "cardTitle"],
    right: ["actions"],
  });

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<TData, TValue>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnPinningChange: setColumnPinning,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnPinning,
    },
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE,
      },
      sorting: [
        { id: "environment", desc: false },
        { id: "displayOrder", desc: false },
      ],
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:justify-between sm:items-center gap-4 py-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Input
            placeholder="Filter by title..."
            value={
              (table.getColumn("cardTitle")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("cardTitle")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            value={
              (table.getColumn("environment")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) => {
              const filterValue = value === "all" ? null : value;
              table.getColumn("environment")?.setFilterValue(filterValue);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allEnvironments")}</SelectItem>
              <SelectItem value="test">{t("test")}</SelectItem>
              <SelectItem value="live">{t("live")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button asChild className="highlight-bg text-white">
          <I18nLink
            href="/dashboard/prices/new"
            title="Create New Plan"
            prefetch={false}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Plan
          </I18nLink>
        </Button>
      </div>
      <div className="relative min-h-[200px] max-h-[calc(100vh-200px)] overflow-auto rounded-md border">
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
                  {t("noPlansFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} plan(s) found.
          {table.getFilteredSelectedRowModel().rows.length > 0 &&
            ` (${table.getFilteredSelectedRowModel().rows.length} selected)`}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
