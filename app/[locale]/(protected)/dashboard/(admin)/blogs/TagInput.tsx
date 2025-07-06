"use client";

import { listTagsAction, type Tag as DbTag } from "@/actions/blogs/tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TagSelectDialog } from "./TagSelectDialog";

export type FormTag = {
  id: string;
  name: string;
};

interface TagInputProps {
  value: FormTag[];
  onChange: (value: FormTag[]) => void;
  disabled?: boolean;
}

export function TagInput({ value, onChange, disabled }: TagInputProps) {
  const t = useTranslations("DashboardBlogs.TagManager");
  const locale = useLocale();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allAvailableTags, setAllAvailableTags] = useState<DbTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      setIsLoadingTags(true);
      try {
        const result = await listTagsAction({ query: "", locale });
        if (result.success && result.data?.tags) {
          setAllAvailableTags(result.data.tags);
        } else {
          toast.error(t("errors.fetchFailed"), {
            description: result.error,
          });
          console.error("Failed to fetch initial tags:", result.error);
        }
      } catch (error) {
        toast.error(t("errors.fetchFailed"));
        console.error("Error fetching initial tags:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };
    loadTags();
  }, [locale]);

  const handleDeselectTag = (tagId: string) => {
    onChange(value.filter((t) => t.id !== tagId));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] items-center p-2 border rounded-md">
        {value?.map((tag) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
            <button
              type="button"
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => handleDeselectTag(tag.id)}
              aria-label={`Remove ${tag.name}`}
              disabled={disabled}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          disabled={disabled}
          className="ml-auto shrink-0"
        >
          <TagIcon className="mr-2 h-4 w-4" />
          {t("selectTags")}
        </Button>
      </div>

      <TagSelectDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedTags={value || []}
        onTagsChange={onChange}
        initialAvailableTags={allAvailableTags}
        isLoadingInitialTags={isLoadingTags}
      />
    </div>
  );
}
