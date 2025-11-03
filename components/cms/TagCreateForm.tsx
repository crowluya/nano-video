"use client";

import { createTagAction } from "@/actions/blogs/tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostType } from "@/lib/db/schema";
import { Tag } from "@/types/cms";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TagCreateFormProps {
  existingTags: Tag[];
  onTagCreated: (tag: Tag) => void;
  disabled?: boolean;
  postType: PostType;
}

export function TagCreateForm({
  existingTags,
  onTagCreated,
  disabled = false,
  postType,
}: TagCreateFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();

    if (!trimmedName) {
      toast.info("Please enter a tag name.");
      return;
    }

    if (
      existingTags.some(
        (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      toast.info(`Tag "${trimmedName}" already exists.`);
      return;
    }

    setIsCreating(true);
    try {
      const result = await createTagAction({
        name: trimmedName,
        postType,
      });
      if (result.success && result.data?.tag) {
        toast.success(`Tag "${result.data.tag.name}" created successfully.`);
        onTagCreated(result.data.tag);
        setNewTagName("");
      } else {
        toast.error("Failed to create tag.", { description: result.error });
      }
    } catch (error) {
      toast.error("Failed to create tag.");
      console.error("Failed to create tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="New tag name"
        value={newTagName}
        onChange={(e) => setNewTagName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isCreating) {
            handleCreateTag();
          }
        }}
        disabled={isCreating || disabled}
      />
      <Button
        type="button"
        size="icon"
        onClick={handleCreateTag}
        disabled={isCreating || !newTagName.trim() || disabled}
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PlusCircle className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
