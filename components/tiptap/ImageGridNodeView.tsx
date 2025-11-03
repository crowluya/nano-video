"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";

interface ImageGridItem {
  src: string;
  alt?: string;
  caption?: string;
  link?: string;
}

export function ImageGridNodeView({
  node,
  updateAttributes,
  deleteNode,
  editor,
}: NodeViewProps) {
  const { images, columns } = node.attrs;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editLink, setEditLink] = useState("");
  const isEditable = editor.isEditable;

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_: any, i: number) => i !== index);
    if (newImages.length === 0) {
      deleteNode();
    } else {
      updateAttributes({ images: newImages });
    }
  };

  const handleChangeColumns = (newColumns: number) => {
    updateAttributes({ columns: newColumns });
  };

  const handleEditImage = (index: number) => {
    const image = images[index] as ImageGridItem;
    setEditingIndex(index);
    setEditCaption(image.caption || "");
    setEditLink(image.link || "");
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const newImages = [...images];
      newImages[editingIndex] = {
        ...newImages[editingIndex],
        caption: editCaption,
        link: editLink,
      };
      updateAttributes({ images: newImages });
      setEditingIndex(null);
      setEditCaption("");
      setEditLink("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditCaption("");
    setEditLink("");
  };

  return (
    <NodeViewWrapper className="image-grid-wrapper my-6">
      {isEditable && (
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-t-lg border border-b-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Image Grid ({images.length} images)
            </span>
            <div className="flex gap-1">
              {[2, 3, 4].map((col) => (
                <Button
                  key={col}
                  type="button"
                  size="sm"
                  variant={columns === col ? "secondary" : "ghost"}
                  onClick={() => handleChangeColumns(col)}
                  className="h-7 px-2 text-xs"
                >
                  {col} cols
                </Button>
              ))}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={deleteNode}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div
        className={`grid gap-3 ${
          isEditable ? "border border-t-0 rounded-b-lg p-3" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {images.map((image: ImageGridItem, index: number) => (
          <div key={image.src} className="flex flex-col gap-1">
            <div
              className="relative group overflow-hidden rounded-lg border bg-background flex items-center justify-center"
              style={{ aspectRatio: "1/1" }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={image.src}
                alt={image.alt || `Image ${index + 1}`}
                className="w-full h-full object-contain"
              />
              {isEditable && hoveredIndex === index && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                  <Popover
                    open={editingIndex === index}
                    onOpenChange={(open) => {
                      if (open) {
                        handleEditImage(index);
                      } else {
                        handleCancelEdit();
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-80"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Edit Image</h4>
                        <div className="space-y-2">
                          <Label htmlFor={`caption-${index}`}>Caption</Label>
                          <Input
                            id={`caption-${index}`}
                            placeholder="Enter caption"
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`link-${index}`}>Link (URL)</Label>
                          <Input
                            id={`link-${index}`}
                            placeholder="https://example.com"
                            value={editLink}
                            onChange={(e) => setEditLink(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveEdit}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {image.caption && (
              <span className="text-sm text-muted-foreground text-center px-1 leading-tight">
                {image.caption}
              </span>
            )}
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}
