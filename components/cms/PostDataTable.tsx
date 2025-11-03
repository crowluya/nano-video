"use client";

import { TagManagementDialog } from "@/components/cms/TagManagementDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link as I18nLink } from "@/i18n/routing";
import { PostType } from "@/lib/db/schema";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Loader2, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

interface PostDataTableConfig {
  postType: PostType;
  columns: ColumnDef<any, any>[];
  listAction: (params: {
    postType: PostType;
    pageIndex: number;
    pageSize: number;
    filter: string;
  }) => Promise<any>;
  createUrl: string;
  enableTags?: boolean;
  searchPlaceholder?: string;
}

interface DataTableProps<TData, TValue> {
  config: PostDataTableConfig;
  initialData: TData[];
  initialPageCount: number;
  pageSize: number;
  totalPosts: number;
}

export function PostDataTable<TData, TValue>({
  config,
  initialData,
  initialPageCount,
  pageSize,
  totalPosts,
}: DataTableProps<TData, TValue>) {
  const {
    postType,
    columns,
    listAction,
    createUrl,
    enableTags = false,
    searchPlaceholder,
  } = config;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 500);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [data, setData] = useState<TData[]>(initialData);
  const [pageCount, setPageCount] = useState<number>(initialPageCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    if (debouncedGlobalFilter !== undefined) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedGlobalFilter]);

  useEffect(() => {
    if (
      pagination.pageIndex === 0 &&
      !debouncedGlobalFilter &&
      data === initialData
    ) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await listAction({
          postType,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          filter: debouncedGlobalFilter,
        });

        if (!result.success) {
          throw new Error(result.error || `Failed to fetch ${postType}s.`);
        }

        setData(result.data?.posts as TData[]);
        setPageCount(
          Math.ceil((result.data?.count || 0) / pagination.pageSize)
        );
      } catch (error: any) {
        toast.error(`Failed to fetch ${postType}s.`, {
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
    pagination.pageIndex,
    pagination.pageSize,
    initialData,
    postType,
  ]);

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<TData, TValue>[],
    pageCount: pageCount,
    state: {
      sorting,
      pagination,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    debugTable: process.env.NODE_ENV === "development",
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 py-4">
        <Input
          placeholder={searchPlaceholder || `Search ${postType}s...`}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex space-x-2">
          {enableTags && <TagManagementDialog postType={postType} />}
          <Button asChild className="highlight-button">
            <I18nLink href={createUrl} title="Create New Post" prefetch={false}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Post
            </I18nLink>
          </Button>
        </div>
      </div>

      <div className="relative min-h-[200px] max-h-[calc(100vh-200px)] overflow-auto rounded-md border">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          {table.getPageCount() || 0} ({totalPosts} Post)
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
