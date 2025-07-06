"use client";

import {
  createTagAction,
  Tag as DbTag,
  deleteTagAction,
  listTagsAction,
  updateTagAction,
} from "@/actions/blogs/tags";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  Edit3,
  Loader2,
  PlusCircle,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export function TagManagementDrawer() {
  const t = useTranslations("DashboardBlogs.TagManager");
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<DbTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<DbTag | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const result = await listTagsAction({ locale });
      if (result.success && result.data?.tags) {
        setTags(result.data.tags.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        toast.error(t("errors.fetchFailed"), {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error(t("errors.fetchFailed"));
      console.error("Failed to fetch tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.info(t("errors.nameRequired"));
      return;
    }
    if (
      tags.some(
        (tag) => tag.name.toLowerCase() === newTagName.trim().toLowerCase()
      )
    ) {
      toast.info(t("errors.alreadyExists", { name: newTagName.trim() }));
      return;
    }

    startTransition(async () => {
      const result = await createTagAction({
        name: newTagName.trim(),
        locale,
      });
      if (result.success && result.data?.tag) {
        toast.success(t("createSuccess", { name: result.data.tag.name }));
        setTags((prev) =>
          [...prev, result.data!.tag!].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setNewTagName("");
      } else {
        toast.error(t("errors.createFailed"), { description: result.error });
      }
    });
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    if (!window.confirm(t("confirmDelete", { name: tagName }))) {
      return;
    }
    startTransition(async () => {
      const result = await deleteTagAction({ id: tagId, locale });
      if (result.success) {
        toast.success(t("deleteSuccess", { name: tagName }));
        setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      } else {
        toast.error(t("errors.deleteFailed", { name: tagName }), {
          description: result.error,
        });
      }
    });
  };

  const handleStartEdit = (tag: DbTag) => {
    setEditingTag(tag);
    setEditingTagName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditingTagName("");
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTagName.trim()) {
      toast.info(t("errors.nameRequired"));
      return;
    }
    if (
      tags.some(
        (tag) =>
          tag.id !== editingTag.id &&
          tag.name.toLowerCase() === editingTagName.trim().toLowerCase()
      )
    ) {
      toast.info(t("errors.alreadyExists", { name: editingTagName.trim() }));
      return;
    }

    startTransition(async () => {
      const result = await updateTagAction({
        id: editingTag.id,
        name: editingTagName.trim(),
        locale,
      });
      if (result.success && result.data?.tag) {
        toast.success(t("updateSuccess", { name: result.data.tag.name }));
        setTags((prev) =>
          prev
            .map((t) => (t.id === editingTag.id ? result.data!.tag! : t))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        handleCancelEdit();
      } else {
        toast.error(t("errors.updateFailed"), {
          description: result.error,
        });
      }
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">
          <Tags className="mr-2 h-4 w-4" /> {t("manageTagsButton")}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md md:max-w-lg lg:max-w-xl">
          <DrawerHeader>
            <DrawerTitle>{t("title")}</DrawerTitle>
            <DrawerDescription>{t("description")}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder={t("newTagPlaceholder")}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !isPending && handleCreateTag()
                }
                disabled={isPending}
              />
              <Button
                onClick={handleCreateTag}
                disabled={isPending || !newTagName.trim()}
                size="icon"
              >
                {isPending && !editingTag ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t("noResults")}
              </p>
            ) : (
              <ScrollArea className="h-[calc(100vh-350px)] md:h-[400px]">
                <ul className="space-y-2">
                  {tags.map((tag) => (
                    <li
                      key={tag.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      {editingTag?.id === tag.id ? (
                        <>
                          <Input
                            value={editingTagName}
                            onChange={(e) => setEditingTagName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              !isPending &&
                              handleUpdateTag()
                            }
                            className="h-8"
                            disabled={isPending}
                          />
                          <div className="flex space-x-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleUpdateTag}
                              disabled={isPending || !editingTagName.trim()}
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
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">{tag.name}</span>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(tag)}
                              title={t("editButton")}
                              disabled={isPending}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTag(tag.id, tag.name)}
                              title={t("deleteButton")}
                              disabled={isPending}
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
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t("closeButton")}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
