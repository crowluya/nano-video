"use client";

import { createTagAction, Tag as DbTag } from "@/actions/blogs/tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, PlusCircle, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type FormTag = {
  id: string;
  name: string;
};

interface TagSelectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedTags: FormTag[];
  onTagsChange: (tags: FormTag[]) => void;
  initialAvailableTags: DbTag[];
  isLoadingInitialTags: boolean;
}

export function TagSelectDialog({
  isOpen,
  onOpenChange,
  selectedTags,
  onTagsChange,
  initialAvailableTags,
  isLoadingInitialTags,
}: TagSelectDialogProps) {
  const t = useTranslations("DashboardBlogs.TagManager");
  const locale = useLocale();

  const [currentAvailableTags, setCurrentAvailableTags] =
    useState<DbTag[]>(initialAvailableTags);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setCurrentAvailableTags(initialAvailableTags);
  }, [initialAvailableTags]);

  const handleSelectTag = (tag: DbTag) => {
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

  const handleCreateTag = async () => {
    if (!searchTerm.trim()) return;
    const newTagName = searchTerm.trim();

    if (
      currentAvailableTags.some(
        (tag) => tag.name.toLowerCase() === newTagName.toLowerCase()
      )
    ) {
      toast.info(t("errors.alreadyExists", { name: newTagName }));
      return;
    }

    setIsCreating(true);
    try {
      const result = await createTagAction({
        name: newTagName,
        locale,
      });
      if (result.success && result.data?.tag) {
        toast.success(t("createSuccess", { name: result.data.tag.name }));
        setCurrentAvailableTags((prev) => [result.data?.tag!, ...prev]);
        handleSelectTag(result.data.tag);
        setSearchTerm("");
      } else {
        toast.error(t("errors.createFailed"), { description: result.error });
      }
    } catch (error) {
      toast.error(t("errors.createFailed"));
      console.error("Failed to create tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectableTags = currentAvailableTags
    .filter((tag) =>
      searchTerm.trim() === ""
        ? true
        : tag.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    .filter((tag) => !selectedTags.some((selected) => selected.id === tag.id));

  const newTagCandidateName = searchTerm.trim();
  const canPotentiallyCreateTag =
    newTagCandidateName &&
    !currentAvailableTags.some(
      (tag) => tag.name.toLowerCase() === newTagCandidateName.toLowerCase()
    );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {selectedTags.length > 0 && (
          <div className="border-b pb-4 mb-4">
            <p className="text-sm font-medium mb-2">{t("selectedTagsLabel")}</p>
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
          <div className="flex flex-grow justify-center items-center p-4 min-h-[150px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2">
              {t("loadingTagsMessage") || "Loading tags..."}
            </span>
          </div>
        ) : (
          <>
            <Command className="flex-grow overflow-hidden">
              <div className="flex items-center border-b px-3">
                <CommandInput
                  placeholder={t("searchPlaceholder")}
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
                />
              </div>

              <ScrollArea className="flex-grow h-[calc(80vh-250px)]">
                <CommandList className="max-h-fit">
                  <CommandEmpty>{t("noResults")}</CommandEmpty>

                  <CommandGroup>
                    {selectableTags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={`${tag.name}-${tag.id}`}
                        onSelect={() => handleSelectTag(tag)}
                        className="cursor-pointer"
                      >
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {canPotentiallyCreateTag && (
                    <CommandGroup heading={t("createNewTag")}>
                      <CommandItem
                        key={`create-${newTagCandidateName}`}
                        value={`create-${newTagCandidateName}`}
                        onSelect={handleCreateTag}
                        className="cursor-pointer text-emerald-600 dark:text-emerald-400"
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("creatingButton")}
                          </>
                        ) : (
                          <>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t("createButton", {
                              name: newTagCandidateName,
                            })}
                          </>
                        )}
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </ScrollArea>
            </Command>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("closeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
