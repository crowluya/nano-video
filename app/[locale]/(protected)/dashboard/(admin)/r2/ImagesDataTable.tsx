"use client";

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
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { deleteR2File, listR2Files, R2File } from "./actions";
import { getColumns } from "./Columns";

interface ImagesDataTableProps {
  initialData: R2File[];
  initialHasMore: boolean;
  initialTokenMap: Record<number, string | null>;
  categoryPrefix: string;
  r2PublicUrl?: string;
  pageSize: number;
}

export function ImagesDataTable({
  initialData,
  initialHasMore,
  initialTokenMap = {},
  categoryPrefix,
  r2PublicUrl,
  pageSize,
}: ImagesDataTableProps) {
  const [filter, setFilter] = useState("");
  const [debouncedFilter] = useDebounce(filter, 500);

  const [files, setFiles] = useState<R2File[]>(initialData);
  const pageTokensRef = useRef<Record<number, string | null>>(initialTokenMap);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleFetchError = (err: any) => {
    const errorMessage = err.message || "An unknown error occurred";
    setError(errorMessage);
    toast.error("Failed to fetch files", { description: errorMessage });
    setFiles([]);
    setHasMore(false);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isDeleting) {
      return;
    }

    const performFetch = async () => {
      setIsLoading(true);
      setError(null);

      const tokenForThisPage =
        currentPageIndex === 0
          ? undefined
          : pageTokensRef.current[currentPageIndex - 1];

      if (currentPageIndex > 0 && tokenForThisPage === undefined) {
        console.warn(
          `Token missing for page ${currentPageIndex}. Fetch aborted.`
        );
        setIsLoading(false);
        setHasMore(false);
        return;
      }

      console.log(
        `Fetching page ${currentPageIndex} (category: ${categoryPrefix}) using token: ${tokenForThisPage}`
      );

      try {
        const result = await listR2Files({
          categoryPrefix: categoryPrefix,
          filterPrefix: debouncedFilter,
          continuationToken: tokenForThisPage ?? undefined,
          pageSize: pageSize,
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setFiles(result.files);
        const nextToken = result.nextContinuationToken;
        console.log(
          `Received next token for page ${currentPageIndex + 1}: ${nextToken}`
        );

        pageTokensRef.current = {
          ...pageTokensRef.current,
          [currentPageIndex]: nextToken ?? null,
        };

        setHasMore(nextToken !== undefined);
      } catch (err: any) {
        handleFetchError(err);
      } finally {
        setIsLoading(false);
      }
    };

    performFetch();
  }, [currentPageIndex, categoryPrefix, debouncedFilter, isDeleting]);

  useEffect(() => {
    setCurrentPageIndex(0);
    pageTokensRef.current = {};
    setHasMore(true);
    setFiles([]);
    setError(null);
  }, [categoryPrefix, debouncedFilter]);

  const handleDelete = useCallback(
    async (key: string) => {
      setIsDeleting(true);
      toast.info(`Deleting ${key}...`);
      const result = await deleteR2File({ key });

      if (result.success) {
        toast.success(`Successfully deleted ${key}`);
        setIsLoading(true);
        setError(null);

        const tokenForThisPage =
          currentPageIndex === 0
            ? undefined
            : pageTokensRef.current[currentPageIndex - 1];

        console.log(
          `Refetching page ${currentPageIndex} after delete (category: ${categoryPrefix}) using token: ${tokenForThisPage}`
        );

        try {
          const listResult = await listR2Files({
            categoryPrefix: categoryPrefix,
            filterPrefix: debouncedFilter,
            continuationToken: tokenForThisPage ?? undefined,
            pageSize: pageSize,
          });

          if (listResult.error) throw new Error(listResult.error);

          setFiles(listResult.files);
          const nextToken = listResult.nextContinuationToken;
          pageTokensRef.current = {
            ...pageTokensRef.current,
            [currentPageIndex]: nextToken ?? null,
          };
          setHasMore(nextToken !== undefined);
        } catch (err: any) {
          handleFetchError(err);
        } finally {
          setIsLoading(false);
          setIsDeleting(false);
        }
      } else {
        toast.error(`Failed to delete ${key}`, { description: result.error });
        setIsDeleting(false);
      }
    },
    [currentPageIndex, categoryPrefix, debouncedFilter]
  );

  const columns = useMemo(
    () => getColumns(r2PublicUrl, handleDelete),
    [r2PublicUrl, handleDelete]
  );

  const table = useReactTable({
    data: files,
    columns,
    pageCount: -1,
    state: {
      pagination: { pageIndex: currentPageIndex, pageSize: pageSize },
      sorting,
    },
    onPaginationChange: (updater) => {
      const newPageIndex =
        typeof updater === "function"
          ? updater(table.getState().pagination).pageIndex
          : updater.pageIndex;
      if (newPageIndex !== currentPageIndex) {
        setCurrentPageIndex(newPageIndex);
      }
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    debugTable: process.env.NODE_ENV === "development",
  });

  const canGoNext = hasMore;
  const canGoPrevious = currentPageIndex > 0;

  const handleNextPage = () => {
    if (canGoNext) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (canGoPrevious) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by filename prefix..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
          disabled={isLoading || isDeleting}
        />
      </div>

      {error && (
        <div className="text-red-600 bg-red-100 border border-red-400 rounded p-4 flex items-center space-x-2 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
      )}

      <div className="rounded-md border relative min-h-[200px] max-h-[70vh] overflow-y-auto">
        {(isLoading || isDeleting) && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">
              {isDeleting ? "Deleting..." : "Loading..."}
            </span>
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
                  <TableRow key={row.id}>
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
              : !isLoading &&
                !isDeleting && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No files found matching the criteria.
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPageIndex + 1}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={!canGoPrevious || isLoading || isDeleting}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!canGoNext || isLoading || isDeleting}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
