"use client";

import {
  deleteTagAction,
  listTagsAction,
  updateTagAction,
} from "@/actions/blogs/tags";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PostType } from "@/lib/db/schema";
import { Tag } from "@/types/cms";
import { Check, Edit3, Loader2, Tags, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { TagCreateForm } from "./TagCreateForm";

export function TagManagementDialog({ postType }: { postType: PostType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const result = await listTagsAction({
        postType: postType,
      });
      if (result.success && result.data?.tags) {
        setTags(result.data.tags.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        toast.error("Failed to fetch tags.", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to fetch tags.");
      console.error("Failed to fetch tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleTagCreated = (tag: Tag) => {
    setTags((prev) =>
      [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    if (
      !window.confirm(`Are you sure you want to delete the tag "${tagName}"?`)
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteTagAction({ id: tagId });
      if (result.success) {
        toast.success(`Tag "${tagName}" deleted successfully.`);
        setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      } else {
        toast.error(`Failed to delete tag "${tagName}".`, {
          description: result.error,
        });
      }
    });
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTag(tag);
    setEditingTagName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingTagName("");
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTagName.trim()) {
      toast.info("Tag name is required.");
      return;
    }
    if (
      tags.some(
        (tag) =>
          tag.id !== editingTag.id &&
          tag.name.toLowerCase() === editingTagName.trim().toLowerCase()
      )
    ) {
      toast.info(`Tag "${editingTagName.trim()}" already exists.`);
      return;
    }

    startTransition(async () => {
      const result = await updateTagAction({
        id: editingTag.id,
        name: editingTagName.trim(),
      });
      if (result.success && result.data?.tag) {
        toast.success(`Tag "${result.data.tag.name}" updated successfully.`);
        setTags((prev) =>
          prev
            .map((t) => (t.id === editingTag.id ? result.data!.tag! : t))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        handleCancelEdit();
      } else {
        toast.error("Failed to update tag.", {
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Tags className="mr-2 h-4 w-4" /> Manage Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="grow overflow-hidden">
          <div className="mt-1 mb-4 mx-1">
            <TagCreateForm
              existingTags={tags}
              onTagCreated={handleTagCreated}
              disabled={isPending}
              postType={postType}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No tags found. Create your first tag above.
            </p>
          ) : (
            <ScrollArea className="h-[calc(80vh-280px)]">
              <ul className="space-y-2 pr-4">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {editingTag?.id === tag.id ? (
                      <>
                        <Input
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isPending) {
                              handleUpdateTag();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="h-8"
                          disabled={isPending}
                          autoFocus
                        />
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleUpdateTag}
                            disabled={isPending || !editingTagName.trim()}
                            className="h-8 w-8"
                          >
                            {isPending && editingTag?.id === tag.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            disabled={isPending}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{tag.name}</span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(tag)}
                            title="Edit tag"
                            disabled={isPending}
                            className="h-8 w-8"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            title="Delete tag"
                            disabled={isPending}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
