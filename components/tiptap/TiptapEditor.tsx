"use client";

import { generateAdminPresignedUploadUrl } from "@/actions/r2-resources";
import { BLOGS_IMAGE_PATH } from "@/config/common";
import { PostType } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlock from "@tiptap/extension-code-block";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapImage from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold as BoldIcon,
  Cloud,
  Code,
  Grid3x3,
  Heading2,
  Heading3,
  Heading4,
  Image,
  Italic as ItalicIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "tiptap-markdown";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ImageGrid, type ImageGridItem } from "./ImageGridExtension";
import { R2ResourceSelector } from "./R2ResourceSelector";
import { TableMenu } from "./TableMenu";
import { TranslationButton } from "./TranslationButton";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableYoutube?: boolean;
  enableImage?: boolean;
  enableCodeBlock?: boolean;
  enableTable?: boolean;
  enableBlockquote?: boolean;
  enableHorizontalRule?: boolean;
  enableR2Selector?: boolean;
  r2PublicUrl?: string;
  imageUploadConfig?: {
    maxSize?: number; // in bytes
    filenamePrefix?: string;
    path?: string;
  };
  enableTranslation?: boolean;
  postType?: PostType;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  disabled = false,
  enableYoutube = true,
  enableImage = true,
  enableCodeBlock = true,
  enableTable = true,
  enableBlockquote = true,
  enableHorizontalRule = true,
  enableR2Selector = false,
  r2PublicUrl,
  imageUploadConfig,
  enableTranslation = false,
  postType = "blog",
}: TiptapEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isYoutubePopoverOpen, setIsYoutubePopoverOpen] = useState(false);

  const [isImageGridPopoverOpen, setIsImageGridPopoverOpen] = useState(false);
  const [imageGridFiles, setImageGridFiles] = useState<File[]>([]);
  const [imageGridPreviews, setImageGridPreviews] = useState<string[]>([]);
  const [isUploadingImageGrid, setIsUploadingImageGrid] = useState(false);
  const [imageGridColumns, setImageGridColumns] = useState(2);
  const [imageGridCaptions, setImageGridCaptions] = useState<string[]>([]);
  const [imageGridLinks, setImageGridLinks] = useState<string[]>([]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Heading.configure({
        levels: [2, 3, 4],
      }),
      Bold,
      Italic,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      ...(enableImage
        ? [
            TiptapImage.configure({
              HTMLAttributes: {
                class: "rounded-lg max-w-full h-auto",
              },
            }),
          ]
        : []),
      BulletList,
      OrderedList,
      ListItem,
      ...(enableBlockquote ? [Blockquote] : []),
      ...(enableCodeBlock ? [CodeBlock] : []),
      ...(enableHorizontalRule ? [HorizontalRule] : []),
      ...(enableTable
        ? [
            Table.configure({
              resizable: true,
              HTMLAttributes: {
                class: "border-collapse table-auto w-full",
              },
            }),
            TableRow,
            TableHeader.configure({
              HTMLAttributes: {
                class: "border border-border bg-muted font-bold p-2",
              },
            }),
            TableCell.configure({
              HTMLAttributes: {
                class: "border border-border p-2",
              },
            }),
          ]
        : []),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      ...(enableYoutube
        ? [
            Youtube.configure({
              controls: true,
              nocookie: true,
              HTMLAttributes: {
                class: "rounded-lg my-4",
              },
            }),
          ]
        : []),
      ImageGrid,
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // @ts-ignore - Markdown extension storage
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor) {
      // @ts-ignore - Markdown extension storage
      const currentMarkdown = editor.storage.markdown.getMarkdown();
      if (content !== currentMarkdown) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Upload failed", {
          description: "Please select an image file.",
        });
        return;
      }

      // Use provided config or fallback to defaults
      const maxSize = imageUploadConfig?.maxSize ?? 10 * 1024 * 1024; // Default: 10MB
      if (file.size > maxSize) {
        toast.error("Upload failed", {
          description: `File size limit: ${maxSize / 1024 / 1024}MB`,
        });
        return;
      }

      setIsUploadingImage(true);

      try {
        // Use provided config or fallback to defaults
        const filenamePrefix = imageUploadConfig?.filenamePrefix;
        const uploadPath = imageUploadConfig?.path ?? BLOGS_IMAGE_PATH;

        const presignedUrlActionResponse =
          await generateAdminPresignedUploadUrl({
            fileName: file.name,
            contentType: file.type,
            prefix: filenamePrefix,
            path: uploadPath,
          });

        if (
          !presignedUrlActionResponse.success ||
          !presignedUrlActionResponse.data
        ) {
          toast.error("Upload failed", {
            description:
              presignedUrlActionResponse.error ||
              "Failed to generate presigned URL",
          });
          return;
        }

        const { presignedUrl, publicObjectUrl } =
          presignedUrlActionResponse.data;

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          let r2Error = "";
          try {
            r2Error = await uploadResponse.text();
          } catch {}
          console.error("R2 Upload Error:", r2Error, uploadResponse);
          throw new Error(r2Error);
        }

        editor?.chain().focus().setImage({ src: publicObjectUrl }).run();
        setIsImagePopoverOpen(false);
        setImageUrl("");
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Image Upload failed:", error);
        toast.error(getErrorMessage(error) || "An unexpected error occurred.");
      } finally {
        setIsUploadingImage(false);
      }
    },
    [editor, imageUploadConfig]
  );

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl("");
    setIsLinkPopoverOpen(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setIsImagePopoverOpen(false);
    }
  }, [editor, imageUrl]);

  const addYoutube = useCallback(() => {
    if (youtubeUrl) {
      editor?.commands.setYoutubeVideo({
        src: youtubeUrl,
        width: 640,
        height: 360,
      });
      setYoutubeUrl("");
      setIsYoutubePopoverOpen(false);
    }
  }, [editor, youtubeUrl]);

  const handleImageGridFilesChange = useCallback(
    (files: File[], append: boolean = false) => {
      if (append) {
        // 追加新图片
        const newFiles = [...imageGridFiles, ...files];
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        const newCaptions = [
          ...imageGridCaptions,
          ...Array(files.length).fill(""),
        ];
        const newLinks = [...imageGridLinks, ...Array(files.length).fill("")];
        setImageGridFiles(newFiles);
        setImageGridPreviews([...imageGridPreviews, ...newPreviews]);
        setImageGridCaptions(newCaptions);
        setImageGridLinks(newLinks);
      } else {
        // 替换所有图片
        // Clean up old preview URLs
        imageGridPreviews.forEach((url) => URL.revokeObjectURL(url));

        // Create new preview URLs
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setImageGridFiles(files);
        setImageGridPreviews(newPreviews);
        setImageGridCaptions(Array(files.length).fill(""));
        setImageGridLinks(Array(files.length).fill(""));
      }
    },
    [imageGridFiles, imageGridPreviews, imageGridCaptions, imageGridLinks]
  );

  const handleRemoveImageGridPreview = useCallback(
    (index: number) => {
      const newFiles = imageGridFiles.filter((_, i) => i !== index);
      const newPreviews = imageGridPreviews.filter((_, i) => i !== index);
      const newCaptions = imageGridCaptions.filter((_, i) => i !== index);
      const newLinks = imageGridLinks.filter((_, i) => i !== index);

      // Revoke the removed preview URL
      URL.revokeObjectURL(imageGridPreviews[index]);

      setImageGridFiles(newFiles);
      setImageGridPreviews(newPreviews);
      setImageGridCaptions(newCaptions);
      setImageGridLinks(newLinks);
    },
    [imageGridFiles, imageGridPreviews, imageGridCaptions, imageGridLinks]
  );

  const handleUpdateImageGridCaption = useCallback(
    (index: number, caption: string) => {
      const newCaptions = [...imageGridCaptions];
      newCaptions[index] = caption;
      setImageGridCaptions(newCaptions);
    },
    [imageGridCaptions]
  );

  const handleUpdateImageGridLink = useCallback(
    (index: number, link: string) => {
      const newLinks = [...imageGridLinks];
      newLinks[index] = link;
      setImageGridLinks(newLinks);
    },
    [imageGridLinks]
  );

  const handleImageGridUpload = useCallback(async () => {
    if (imageGridFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    if (imageGridFiles.length > 12) {
      toast.error("Maximum 12 images allowed in a grid");
      return;
    }

    setIsUploadingImageGrid(true);

    try {
      const uploadedImages: Array<ImageGridItem> = [];

      // Use provided config or fallback to defaults
      const filenamePrefix = imageUploadConfig?.filenamePrefix || "grid-image";
      const uploadPath = imageUploadConfig?.path ?? BLOGS_IMAGE_PATH;
      const maxSize = imageUploadConfig?.maxSize ?? 10 * 1024 * 1024;

      for (const file of imageGridFiles) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > maxSize) {
          toast.error(
            `${file.name} exceeds size limit: ${maxSize / 1024 / 1024}MB`
          );
          continue;
        }

        const presignedUrlActionResponse =
          await generateAdminPresignedUploadUrl({
            fileName: file.name,
            contentType: file.type,
            prefix: filenamePrefix,
            path: uploadPath,
          });

        if (
          !presignedUrlActionResponse.success ||
          !presignedUrlActionResponse.data
        ) {
          toast.error(
            `Failed to upload ${file.name}: ${presignedUrlActionResponse.error || "Unknown error"}`
          );
          continue;
        }

        const { presignedUrl, publicObjectUrl } =
          presignedUrlActionResponse.data;

        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          let r2Error = "";
          try {
            r2Error = await uploadResponse.text();
          } catch {}
          console.error("R2 Upload Error:", r2Error, uploadResponse);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        uploadedImages.push({
          src: publicObjectUrl,
          alt: file.name,
          caption: imageGridCaptions[imageGridFiles.indexOf(file)] || "",
          link: imageGridLinks[imageGridFiles.indexOf(file)] || "",
        });
      }

      if (uploadedImages.length > 0) {
        editor?.commands.setImageGrid({
          images: uploadedImages,
          columns: imageGridColumns,
        });
        toast.success(
          `Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? "s" : ""}`
        );

        // Clean up preview URLs
        imageGridPreviews.forEach((url) => URL.revokeObjectURL(url));
        setImageGridFiles([]);
        setImageGridPreviews([]);
        setImageGridCaptions([]);
        setImageGridLinks([]);
        setIsImageGridPopoverOpen(false);
      } else {
        toast.error("No images were uploaded successfully");
      }
    } catch (error) {
      console.error("Image Grid Upload failed:", error);
      toast.error(getErrorMessage(error) || "An unexpected error occurred.");
    } finally {
      setIsUploadingImageGrid(false);
    }
  }, [
    editor,
    imageGridFiles,
    imageGridColumns,
    imageUploadConfig,
    imageGridPreviews,
    imageGridCaptions,
    imageGridLinks,
  ]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="Bold"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="Italic"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={disabled}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={disabled}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 4 }) ? "secondary" : "ghost"
          }
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          disabled={disabled}
          title="Heading 4"
        >
          <Heading4 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {enableBlockquote && (
          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        )}

        {enableCodeBlock && (
          <Button
            type="button"
            variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={disabled}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
        )}

        {enableHorizontalRule && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={disabled}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}

        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("link") ? "secondary" : "ghost"}
              size="sm"
              disabled={disabled}
              title="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Insert Link</h4>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setLink();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={setLink}
                  className="flex-1"
                >
                  Insert
                </Button>
                {editor.isActive("link") && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setIsLinkPopoverOpen(false);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {enableTable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            disabled={disabled}
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        )}

        {(enableImage || enableYoutube) && (
          <div className="w-px h-6 bg-border mx-1" />
        )}

        {enableImage && (
          <>
            <Popover
              open={isImagePopoverOpen}
              onOpenChange={setIsImagePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  title="Image"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Insert Image</h4>
                  <Input
                    placeholder="Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addImage}
                    className="w-full"
                    disabled={!imageUrl}
                  >
                    Insert from URL
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                      disabled={disabled || isUploadingImage}
                    />
                    <label htmlFor="image-upload">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={disabled || isUploadingImage}
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                      >
                        {isUploadingImage ? "Uploading..." : "Upload Image"}
                      </Button>
                    </label>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {enableR2Selector && r2PublicUrl && (
              <R2ResourceSelector
                onSelect={(url) => {
                  if (Array.isArray(url) && url.length > 1) {
                    // Multiple images: insert as image grid
                    const images = url.map((src) => ({
                      src,
                      alt: src.split("/").pop() || "",
                    }));
                    editor?.commands.setImageGrid({
                      images,
                      columns: 2,
                    });
                  } else {
                    // Single image: insert as regular image
                    editor?.chain().focus().setImage({ src: url[0] }).run();
                  }
                }}
                r2PublicUrl={r2PublicUrl}
                fileTypeFilter="image"
                multiple={true}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  title="Select from R2"
                >
                  <Cloud className="h-4 w-4" />
                </Button>
              </R2ResourceSelector>
            )}
          </>
        )}

        {enableImage && (
          <Popover
            open={isImageGridPopoverOpen}
            onOpenChange={(open) => {
              setIsImageGridPopoverOpen(open);
              if (!open) {
                // Clean up preview URLs when closing
                imageGridPreviews.forEach((url) => URL.revokeObjectURL(url));
                setImageGridFiles([]);
                setImageGridPreviews([]);
                setImageGridCaptions([]);
                setImageGridLinks([]);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Image Grid"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] h-[450px] overflow-y-auto">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Insert Image Grid</h4>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Columns
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((col) => (
                      <Button
                        key={col}
                        type="button"
                        size="sm"
                        variant={
                          imageGridColumns === col ? "default" : "outline"
                        }
                        onClick={() => setImageGridColumns(col)}
                        className="flex-1"
                      >
                        {col}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Preview Grid */}
                {imageGridPreviews.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Preview ({imageGridPreviews.length} images)
                    </label>
                    <div className="max-h-[400px] overflow-y-auto p-2 border rounded-md bg-muted/30 space-y-3">
                      {imageGridPreviews.map((preview, index) => (
                        <div
                          key={preview}
                          className="flex gap-3 p-2 border rounded-md bg-background"
                        >
                          <div
                            className="relative group rounded overflow-hidden border bg-muted shrink-0"
                            style={{ width: "100px", height: "100px" }}
                          >
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveImageGridPreview(index)
                              }
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              disabled={isUploadingImageGrid}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="text-xs text-muted-foreground">
                                Caption (optional)
                              </label>
                              <Input
                                placeholder="Enter caption"
                                value={imageGridCaptions[index] || ""}
                                onChange={(e) =>
                                  handleUpdateImageGridCaption(
                                    index,
                                    e.target.value
                                  )
                                }
                                disabled={isUploadingImageGrid}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">
                                Link (optional)
                              </label>
                              <Input
                                placeholder="https://example.com"
                                value={imageGridLinks[index] || ""}
                                onChange={(e) =>
                                  handleUpdateImageGridLink(
                                    index,
                                    e.target.value
                                  )
                                }
                                disabled={isUploadingImageGrid}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      handleImageGridFilesChange(files, false);
                      // Reset input value to allow selecting same files again
                      e.target.value = "";
                    }}
                    className="hidden"
                    id="image-grid-upload"
                    disabled={disabled || isUploadingImageGrid}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (imageGridFiles.length + files.length > 12) {
                        toast.error("Maximum 12 images allowed in total");
                        return;
                      }
                      handleImageGridFilesChange(files, true);
                      // Reset input value to allow selecting same files again
                      e.target.value = "";
                    }}
                    className="hidden"
                    id="image-grid-add"
                    disabled={disabled || isUploadingImageGrid}
                  />
                  {imageGridFiles.length === 0 ? (
                    <label htmlFor="image-grid-upload" className="flex-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={disabled || isUploadingImageGrid}
                        onClick={() =>
                          document.getElementById("image-grid-upload")?.click()
                        }
                      >
                        Select Images
                      </Button>
                    </label>
                  ) : (
                    <>
                      <label htmlFor="image-grid-add" className="flex-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={
                            disabled ||
                            isUploadingImageGrid ||
                            imageGridFiles.length >= 12
                          }
                          onClick={() =>
                            document.getElementById("image-grid-add")?.click()
                          }
                        >
                          Add More
                        </Button>
                      </label>
                      <label htmlFor="image-grid-upload" className="flex-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={disabled || isUploadingImageGrid}
                          onClick={() =>
                            document
                              .getElementById("image-grid-upload")
                              ?.click()
                          }
                        >
                          Replace All
                        </Button>
                      </label>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleImageGridUpload}
                  className="w-full"
                  disabled={
                    !imageGridFiles.length || isUploadingImageGrid || disabled
                  }
                >
                  {isUploadingImageGrid ? "Uploading..." : "Upload Image Grid"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Select 2-12 images for a responsive grid layout
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {enableYoutube && (
          <>
            <Popover
              open={isYoutubePopoverOpen}
              onOpenChange={setIsYoutubePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  title="YouTube Video"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Insert YouTube Video</h4>
                  <Input
                    placeholder="YouTube URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addYoutube();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addYoutube}
                    className="w-full"
                    disabled={!youtubeUrl}
                  >
                    Insert Video
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Paste a YouTube URL (e.g.,
                    https://www.youtube.com/watch?v=...)
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {enableTranslation && editor && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <TranslationButton
              editor={editor}
              disabled={disabled}
              postType={postType as PostType}
            />
          </>
        )}
      </div>

      {/* Editor Content */}
      <div
        className="relative px-4 py-0 min-h-[400px] max-h-[600px] overflow-y-auto cursor-text"
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent
          editor={editor}
          className="prose dark:prose-invert max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[350px]"
        />
        {enableTable && <TableMenu editor={editor} />}
      </div>
    </div>
  );
}
