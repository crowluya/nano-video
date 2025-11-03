"use client";

import { listR2Files, R2File } from "@/actions/r2-resources";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { R2_CATEGORIES } from "@/config/common";
import { getFileType } from "@/lib/cloudflare/r2-utils";
import { Check, FileIcon, Loader2, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

interface R2ResourceSelectorProps {
  onSelect: (url: string | string[]) => void;
  r2PublicUrl?: string;
  children?: React.ReactNode;
  buttonText?: string;
  title?: string;
  description?: string;
  fileTypeFilter?: "image" | "video" | "all";
  multiple?: boolean;
}

const PAGE_SIZE = 48;

export function R2ResourceSelector({
  onSelect,
  r2PublicUrl = "",
  children,
  buttonText = "Select from R2",
  title = "Select Resource from R2",
  fileTypeFilter = "all",
  multiple = false,
}: R2ResourceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(R2_CATEGORIES[0].prefix);
  const [filter, setFilter] = useState("");
  const [debouncedFilter] = useDebounce(filter, 500);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const handleSelect = (url: string) => {
    if (multiple) {
      setSelectedUrls((prev) => {
        if (prev.includes(url)) {
          return prev.filter((u) => u !== url);
        } else {
          return [...prev, url];
        }
      });
    } else {
      onSelect(url);
      setOpen(false);
    }
  };

  const handleConfirm = () => {
    if (multiple && selectedUrls.length > 0) {
      onSelect(selectedUrls);
      setSelectedUrls([]);
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && multiple) {
      setSelectedUrls([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">{buttonText}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>
            {title}
            {multiple && selectedUrls.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({selectedUrls.length} selected)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden px-6">
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="shrink-0 mb-2 -mx-6 px-6 overflow-x-auto">
              <TabsList className="inline-flex w-auto min-w-full">
                {R2_CATEGORIES.map((cat) => (
                  <TabsTrigger
                    key={cat.prefix}
                    value={cat.prefix}
                    className="shrink-0"
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="shrink-0 mb-2">
              <Input
                placeholder="Filter by filename..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            {R2_CATEGORIES.map((cat) => (
              <TabsContent
                key={cat.prefix}
                value={cat.prefix}
                className="flex-1 overflow-hidden mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ResourceGrid
                  categoryPrefix={cat.prefix}
                  filterPrefix={debouncedFilter}
                  r2PublicUrl={r2PublicUrl}
                  onSelect={handleSelect}
                  selectedUrls={multiple ? selectedUrls : []}
                  fileTypeFilter={fileTypeFilter}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {multiple && (
          <div className="flex justify-between items-center px-6 py-4 border-t shrink-0">
            <Button
              variant="outline"
              onClick={() => setSelectedUrls([])}
              disabled={selectedUrls.length === 0}
            >
              Clear Selection
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
            >
              Insert {selectedUrls.length} Image
              {selectedUrls.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ResourceGridProps {
  categoryPrefix: string;
  filterPrefix: string;
  r2PublicUrl: string;
  onSelect: (url: string) => void;
  selectedUrls: string[];
  fileTypeFilter: "image" | "video" | "all";
}

function ResourceGrid({
  categoryPrefix,
  filterPrefix,
  r2PublicUrl,
  onSelect,
  selectedUrls,
  fileTypeFilter,
}: ResourceGridProps) {
  const [files, setFiles] = useState<R2File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [continuationToken, setContinuationToken] = useState<
    string | undefined
  >();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadFiles = useCallback(
    async (reset: boolean = false) => {
      if (isLoading || (!reset && !hasMore)) return;

      setIsLoading(true);

      try {
        const result = await listR2Files({
          categoryPrefix,
          filterPrefix,
          continuationToken: reset ? undefined : continuationToken,
          pageSize: PAGE_SIZE,
        });

        if (!result.success || !result.data) {
          toast.error("Failed to load files", {
            description: result.error,
          });
          return;
        }

        const { files: newFiles, nextContinuationToken } = result.data;

        // Filter by file type if specified
        const filteredFiles =
          fileTypeFilter === "all"
            ? newFiles
            : newFiles.filter((file) => {
                const type = getFileType(file.key);
                return type === fileTypeFilter;
              });

        if (reset) {
          setFiles(filteredFiles);
        } else {
          setFiles((prev) => [...prev, ...filteredFiles]);
        }

        setContinuationToken(nextContinuationToken);
        setHasMore(nextContinuationToken !== undefined);
      } catch (error: any) {
        toast.error("Failed to load files", {
          description: error.message || "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      categoryPrefix,
      filterPrefix,
      continuationToken,
      hasMore,
      isLoading,
      fileTypeFilter,
    ]
  );

  // Reset when category or filter changes
  useEffect(() => {
    setFiles([]);
    setContinuationToken(undefined);
    setHasMore(true);
    loadFiles(true);
  }, [categoryPrefix, filterPrefix, fileTypeFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadFiles(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadFiles]);

  const handleSelect = (file: R2File) => {
    const fullUrl = `${r2PublicUrl}/${file.key}`;
    onSelect(fullUrl);
  };

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 -mr-6 pr-6">
      {files.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileIcon className="h-12 w-12 mb-2" />
          <p>No files found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-4">
          {files.map((file) => {
            const fileType = getFileType(file.key);
            const previewUrl = `${r2PublicUrl}/${file.key}`;
            const isSelected = selectedUrls.includes(previewUrl);

            return (
              <div
                key={file.key}
                className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:border-primary ${
                  isSelected ? "border-primary" : "border-transparent"
                }`}
                style={{ aspectRatio: "1/1" }}
                onClick={() => handleSelect(file)}
              >
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  {fileType === "image" ? (
                    <img
                      src={previewUrl}
                      alt={file.key}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : fileType === "video" ? (
                    <div className="relative w-full h-full">
                      <video
                        src={previewUrl}
                        className="w-full h-full object-contain"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Video className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-2 px-2 text-center break-all">
                        {file.key.split("/").pop()}
                      </p>
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">
                    {file.key.split("/").pop()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="flex items-center justify-center py-4"
        >
          {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
      )}

      {!hasMore && files.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No more files
        </div>
      )}
    </ScrollArea>
  );
}
