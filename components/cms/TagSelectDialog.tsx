"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandInput } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PostType } from "@/lib/db/schema";
import { Tag } from "@/types/cms";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { TagCreateForm } from "./TagCreateForm";

const MAX_TAGS_LIMIT = 5;

export type FormTag = {
  id: string;
  name: string;
};

interface TagSelectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedTags: FormTag[];
  onTagsChange: (tags: FormTag[]) => void;
  initialAvailableTags: Tag[];
  isLoadingInitialTags: boolean;
  postType: PostType;
}

export function TagSelectDialog({
  isOpen,
  onOpenChange,
  selectedTags,
  onTagsChange,
  initialAvailableTags,
  isLoadingInitialTags,
  postType,
}: TagSelectDialogProps) {
  const [currentAvailableTags, setCurrentAvailableTags] =
    useState<Tag[]>(initialAvailableTags);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setCurrentAvailableTags(initialAvailableTags);
  }, [initialAvailableTags]);

  const handleSelectTag = (tag: Tag) => {
    if (selectedTags.length >= MAX_TAGS_LIMIT) {
      return;
    }

    const formTag: FormTag = {
      id: tag.id,
      name: tag.name,
    };
    if (!selectedTags.some((t) => t.id === formTag.id)) {
      onTagsChange([...selectedTags, formTag]);
    }
  };

  const handleDeselectTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleTagCreated = (tag: Tag) => {
    setCurrentAvailableTags((prev) => [tag, ...prev]);
    handleSelectTag(tag);
  };

  const selectableTags = currentAvailableTags
    .filter((tag) =>
      searchTerm.trim() === ""
        ? true
        : tag.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    .filter((tag) => !selectedTags.some((selected) => selected.id === tag.id));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Tags</DialogTitle>
          <DialogDescription>
            Select up to {MAX_TAGS_LIMIT} tags for your post.
            {selectedTags.length > 0 && (
              <span className="ml-1">
                ({selectedTags.length}/{MAX_TAGS_LIMIT} selected)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {selectedTags.length > 0 && (
          <div className="border-b pb-4 mb-4">
            <p className="text-sm font-medium mb-2">Selected Tags</p>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => handleDeselectTag(tag.id)}
                    aria-label={`Remove ${tag.name}`}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {isLoadingInitialTags ? (
          <div className="flex grow justify-center items-center p-4 min-h-[150px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading tags...</span>
          </div>
        ) : (
          <>
            <Command className="grow overflow-hidden">
              <div className="w-full">
                <CommandInput
                  placeholder="Search for tags..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
                />
              </div>

              {/* Create New Tag Section */}
              <div className="my-2 ml-1">
                <TagCreateForm
                  existingTags={currentAvailableTags}
                  onTagCreated={handleTagCreated}
                  disabled={selectedTags.length >= MAX_TAGS_LIMIT}
                  postType={postType}
                />
                {selectedTags.length >= MAX_TAGS_LIMIT && (
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Maximum tag limit reached. Remove a tag to add more.
                  </p>
                )}
              </div>

              <ScrollArea className="flex-grow h-[calc(80vh-300px)]">
                {selectableTags.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No tags found.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-2">
                    {selectableTags.map((tag) => {
                      const isLimitReached =
                        selectedTags.length >= MAX_TAGS_LIMIT;
                      return (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className={`transition-colors ${
                            isLimitReached
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                          }`}
                          onClick={() => handleSelectTag(tag)}
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </Command>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
