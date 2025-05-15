"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  TableMeta,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { columns } from "./Columns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useRouter } from "@/i18n/routing";
import { PricingPlan } from "@/types/pricing";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { DeletePlanDialog } from "./DeletePlanDialog";
const PAGE_SIZE = 20;

interface CustomTableMeta extends TableMeta<any> {
  openDeleteDialog: (plan: PricingPlan) => void;
}

interface DataTableProps<TData extends PricingPlan, TValue> {
  data: TData[];
}

export function PricesDataTable<TData extends PricingPlan, TValue>({
  data,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations("Dashboard.Admin.Prices.PricesDataTable");
  const tCommon = useTranslations("Dashboard.Common");
  const locale = useLocale();

  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [planToDelete, setPlanToDelete] = React.useState<PricingPlan | null>(
    null
  );

  const handleOpenDeleteDialog = (plan: PricingPlan) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (planId: string) => {
    try {
      const response = await fetch(`/api/admin/pricing-plans/${planId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": (locale || "en") as string,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || t("deleteError", { status: response.status })
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || t("deleteError2"));
      }

      toast.success(
        t("deleteSuccess", { title: planToDelete?.card_title || planId })
      );
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
      router.refresh();
    } catch (error: any) {
      console.error("Deletion failed:", error);
      toast.error(`Deletion failed: ${error.message}`);
    }
  };

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
    meta: {
      openDeleteDialog: handleOpenDeleteDialog,
    } as CustomTableMeta,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE,
      },
      sorting: [
        { id: "environment", desc: false },
        { id: "display_order", desc: false },
      ],
    },
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start gap-4 py-4">
        <Input
          placeholder="Filter by title..."
          value={
            (table.getColumn("card_title")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("card_title")?.setFilterValue(event.target.value)
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="md:ml-auto">
              {tCommon("columnsVisibility")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border relative min-h-[200px] max-h-[70vh] overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 150
                            ? undefined
                            : `${header.getSize()}px`,
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
                    <TableCell key={cell.id}>
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

      <DeletePlanDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        planId={planToDelete?.id ?? null}
        planTitle={planToDelete?.card_title ?? null}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
